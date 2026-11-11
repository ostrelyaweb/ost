from datetime import date, datetime, timezone
from hashlib import sha256
from http import HTTPStatus
import json
from pathlib import Path
import re
import tempfile
from threading import Lock
from uuid import uuid4
from urllib.parse import parse_qs, urlsplit

from studio_auth import ACCOUNT_FILE, auth_action, session_user

EDIT_LOCK = Lock()
DOCUMENTS = {"about", "journal"}
MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
MAX_IMAGE_BYTES = 8 * 1024 * 1024
IMAGE_EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def local_origin(handler):
    port = handler.server.server_port
    return handler.headers.get("Host") in {f"127.0.0.1:{port}", f"localhost:{port}"}


def respond(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("X-Content-Type-Options", "nosniff")
    handler.end_headers()
    handler.wfile.write(body)


def read_body(handler, limit):
    length = int(handler.headers.get("Content-Length", "0"))
    if not 0 < length <= limit:
        raise ValueError("Datoteka ili sadržaj premašuje dopuštenu veličinu.")
    return handler.rfile.read(length)


def text_field(entry, key, label, limit, required=True):
    value = entry.get(key, "")
    if not isinstance(value, str) or len(value) > limit or (required and not value.strip()):
        raise ValueError(f"Provjeri polje {label}. Najviše {limit} znakova.")


def image_fields(entry, root):
    text_field(entry, "image", "Slika", 500, required=False)
    text_field(entry, "alt", "Opis slike", 250, required=False)
    image = entry.get("image", "").lstrip("/")
    if not image:
        return
    path = (root / image).resolve()
    staged = re.fullmatch(r"assets/uploads/studio-[a-f0-9]{32}\.(?:jpg|png|webp)", image) and (root / ".studio-private" / "uploads" / path.name).is_file()
    if not image.startswith("assets/") or (root / "assets") not in path.parents or not (path.is_file() or staged):
        raise ValueError("Odaberi postojeću sliku iz mape assets.")


def validate_sections(sections, root, article=False):
    if not isinstance(sections, list) or len(sections) > 100 or (article and not sections):
        raise ValueError("Provjeri broj sekcija. Članak treba imati barem jednu sekciju.")
    for section in sections:
        text_field(section, "eyebrow", "Oznaka sekcije", 120, required=False)
        text_field(section, "title", "Naslov sekcije", 180, required=not article)
        text_field(section, "text", "Tekst sekcije", 20000)
        image_fields(section, root)


def validate(document, content, root):
    text_field(content, "title", "Naslov stranice", 180)
    text_field(content, "intro", "Uvod", 2000)
    if document == "about":
        text_field(content, "eyebrow", "Oznaka stranice", 120)
        image_fields(content, root)
        validate_sections(content["sections"], root)
        return
    articles = content["articles"]
    if not isinstance(articles, list) or len(articles) > 200:
        raise ValueError("Journal može sadržavati do 200 članaka.")
    seen = set()
    for article in articles:
        text_field(article, "title", "Naslov članka", 180)
        text_field(article, "slug", "URL članka", 100)
        text_field(article, "summary", "Sažetak", 1000)
        text_field(article, "category", "Kategorija", 100, required=False)
        slug = article["slug"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or slug in seen:
            raise ValueError("Svaki članak treba imati jedinstven URL od malih slova, brojeva i crtica.")
        seen.add(slug)
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", article.get("date", "")):
            raise ValueError("Odaberi datum članka.")
        date.fromisoformat(article["date"])
        image_fields(article, root)
        validate_sections(article["sections"], root, article=True)


def valid_image(mime, data):
    if mime == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if mime == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if mime == "image/webp":
        return data.startswith(b"RIFF") and data[8:12] == b"WEBP"
    return False


def write_bytes(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temporary:
        temporary.write(data)
    temp_path = Path(temporary.name)
    try:
        temp_path.replace(path)
    finally:
        temp_path.unlink(missing_ok=True)


def write_json(path, data):
    write_bytes(path, (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))


def scope_content(document, key, public):
    if key == "page":
        if document == "about":
            return public
        return {field: public.get(field, "") for field in ("title", "intro")}
    if key.startswith("post:"):
        return next((item for item in public["articles"] if item["slug"] == key[5:]), None)
    return None


def valid_scope(document, key):
    return key == "page" or (document == "journal" and re.fullmatch(r"(?:post:[a-z0-9]+(?:-[a-z0-9]+)*|new:[a-f0-9-]{36})", key))


def revision(value):
    return sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


def scope_revision(public, draft):
    return revision([public, draft])


def public_scope_value(document, key, value):
    if value is None:
        return None
    fields = ("title", "intro", "eyebrow", "image", "alt", "sections") if document == "about" else (
        ("title", "intro") if key == "page" else ("title", "slug", "date", "category", "summary", "image", "alt", "sections")
    )
    return {field: value[field] for field in fields if field in value}


def merged_public(document, key, public, value):
    if key == "page":
        return value if document == "about" else {**public, **value}
    previous_slug = key[5:] if key.startswith("post:") else None
    articles = list(public["articles"])
    position = next((i for i, item in enumerate(articles) if item["slug"] == previous_slug), None)
    if position is not None:
        if value is None:
            articles.pop(position)
        else:
            articles[position] = value
    elif value is not None:
        articles.append(value)
    return {**public, "articles": articles}


def editor_snapshot(document, public, state):
    drafts = state["drafts"]
    history = state["history"]
    keys = {"page", *drafts, *history}
    if document == "journal":
        keys.update("post:" + item["slug"] for item in public["articles"])
    working = {key: drafts[key]["value"] if key in drafts else scope_content(document, key, public) for key in keys}
    content = dict(working["page"])
    if document == "journal":
        published_keys = ["post:" + item["slug"] for item in public["articles"]]
        ordered = [*published_keys, *(key for key in drafts if key not in published_keys and key != "page")]
        content["articles"] = [{**working[key], "_key": key} for key in ordered if working.get(key) is not None]
    return {
        "content": content,
        "revisions": {key: scope_revision(scope_content(document, key, public), drafts.get(key)) for key in keys},
        "saved": list(drafts),
        "history": {key: [{field: version[field] for field in ("id", "date", "title")} for version in versions]
                    for key, versions in history.items()},
    }


def promote_images(root, content):
    if not isinstance(content, dict):
        return
    image = content.get("image", "").lstrip("/")
    if re.fullmatch(r"assets/uploads/studio-[a-f0-9]{32}\.(?:jpg|png|webp)", image):
        staged = root / ".studio-private" / "uploads" / Path(image).name
        if staged.is_file() and not (root / image).is_file():
            write_bytes(root / image, staged.read_bytes())
    for section in content.get("sections", []):
        promote_images(root, section)


def image_reply(handler, root, name):
    if not re.fullmatch(r"studio-[a-f0-9]{32}\.(?:jpg|png|webp)", name):
        respond(handler, 404, {"error": "Slika nije pronađena."})
        return
    image = root / ".studio-private" / "uploads" / name
    if not image.is_file():
        image = root / "assets" / "uploads" / name
    if not image.is_file():
        respond(handler, 404, {"error": "Slika nije pronađena."})
        return
    data = image.read_bytes()
    mime = next(key for key, extension in IMAGE_EXTENSIONS.items() if image.suffix == extension)
    handler.send_response(200)
    handler.send_header("Content-Type", mime)
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("X-Content-Type-Options", "nosniff")
    handler.end_headers()
    handler.wfile.write(data)


def read_json(handler, limit=MAX_DOCUMENT_BYTES):
    if handler.headers.get_content_type() != "application/json":
        raise ValueError("Očekivan je JSON sadržaj.")
    data = json.loads(read_body(handler, limit))
    if not isinstance(data, dict):
        raise ValueError("Provjeri strukturu sadržaja.")
    return data


def edit_document(handler, root, private, method, route):
    parts = route.path.removeprefix("/api/studio/").split("/")
    document = parts[0]
    operation = parts[1] if len(parts) == 2 else ""
    if document not in DOCUMENTS or len(parts) > 2:
        respond(handler, 404, {"error": "Sadržaj nije pronađen."})
        return
    filename = root / "content" / (document + ".json")
    state_file = private / (document + "-editor.json")
    payload = read_json(handler) if method == "PUT" else {}
    with EDIT_LOCK:
        public = json.loads(filename.read_bytes())
        state = json.loads(state_file.read_bytes()) if state_file.exists() else {"drafts": {}, "history": {}}
        if method == "GET" and not operation:
            respond(handler, 200, editor_snapshot(document, public, state))
            return
        drafts = state["drafts"]
        history = state["history"]
        if method == "GET" and operation == "preview":
            key = parse_qs(route.query).get("key", ["page"])[0]
            if not valid_scope(document, key):
                raise ValueError("Nepoznat nacrt.")
            draft = drafts.get(key)
            value = draft["value"] if draft else scope_content(document, key, public)
            if value is None:
                respond(handler, 404, {"error": "Nacrt nije pronađen."})
                return
            if key == "page":
                preview = merged_public(document, key, public, value)
            else:
                preview = {**public, "articles": [{**value, "slug": "studio-draft"}]}
            respond(handler, 200, preview)
            return
        if method != "PUT" or operation not in {"draft", "publish", "restore"}:
            respond(handler, 404, {"error": "Radnja nije pronađena."})
            return
        key = payload["key"]
        if not valid_scope(document, key):
            raise ValueError("Nepoznata stavka.")
        before = scope_content(document, key, public)
        draft = drafts.get(key)
        new_scope = key.startswith("new:") and before is None and draft is None
        expected = None if new_scope else scope_revision(before, draft)
        if payload.get("revision") != expected:
            respond(handler, 409, {"error": "Sadržaj je u međuvremenu izmijenjen. Ponovno učitaj editor prije spremanja."})
            return
        if operation == "draft":
            value = payload.get("content")
            if value is None:
                drafts.pop(key, None)
            elif isinstance(value, dict):
                drafts[key] = {"value": value, "base": draft["base"] if draft else revision(before)}
            else:
                raise ValueError("Neispravan nacrt.")
            write_json(state_file, state)
            respond(handler, 200, editor_snapshot(document, public, state))
            return

        if operation == "restore":
            version = next((item for item in history.get(key, []) if item["id"] == payload.get("version")), None)
            if not version:
                raise ValueError("Verzija nije pronađena.")
            value = version["value"]
        else:
            if draft and draft["base"] != revision(before):
                respond(handler, 409, {"error": "Objavljena verzija je promijenjena iz drugog editora. Sačuvaj tekst iz nacrta i odbaci stari nacrt prije nove objave."})
                return
            value = public_scope_value(document, key, payload.get("content"))
        if key == "page" and value is None:
            raise ValueError("Stranica treba imati sadržaj.")
        if key.startswith("post:") and value is not None and value.get("slug") != key[5:]:
            raise ValueError("URL objavljenog članka ostaje isti.")
        if key.startswith("new:") and value is not None and any(item["slug"] == value.get("slug") for item in public["articles"]):
            raise ValueError("Članak s tim URL-om već postoji.")
        next_public = merged_public(document, key, public, value)
        validate(document, next_public, root)
        published_key = "post:" + value["slug"] if key.startswith("new:") and value is not None else key

        if next_public != public:
            promote_images(root, value)
            versions = history.setdefault(published_key, [])
            versions.insert(0, {"id": uuid4().hex, "date": datetime.now(timezone.utc).isoformat(),
                                "title": before.get("title") if before else "Prije prve objave", "value": before})
            del versions[20:]
            write_json(state_file, state)
            write_json(filename, next_public)
        if operation == "restore" and draft:
            draft["base"] = revision(value)
        else:
            drafts.pop(key, None)
        write_json(state_file, state)
        respond(handler, 200, {**editor_snapshot(document, next_public, state), "publishedKey": published_key})


def serve_cms(handler, root, method, path):
    route = urlsplit(handler.path)
    if not path.startswith("/api/studio/"):
        respond(handler, 404, {"error": "Radnja nije pronađena."})
        return
    origin = handler.headers.get("Origin")
    same_origin = origin == "http://" + handler.headers.get("Host", "")
    fetch_site = handler.headers.get("Sec-Fetch-Site")
    if not local_origin(handler) or fetch_site in {"cross-site", "same-site"} or (
        (method != "GET" or origin is not None) and not same_origin
    ):
        respond(handler, 403, {"error": "Otvori editor s lokalne adrese Ostrelya Studija."})
        return
    private = root / ".studio-private"
    operation = path.removeprefix("/api/studio/")
    try:
        if operation in {"session", "login", "logout"}:
            data = read_json(handler, 8192) if method == "POST" else {}
            with EDIT_LOCK:
                code, payload = auth_action(handler, private, method, operation, data)
            respond(handler, code, payload)
            return
        if not (private / ACCOUNT_FILE).is_file() or not session_user(handler):
            respond(handler, 401, {"error": "Prijavi se za uređivanje sadržaja."})
            return
        if method == "GET" and operation.startswith("media/"):
            image_reply(handler, root, operation[6:])
            return
        if method == "POST" and operation == "image":
            mime = handler.headers.get("Content-Type", "")
            data = read_body(handler, MAX_IMAGE_BYTES)
            if not valid_image(mime, data):
                raise ValueError("Odaberi PNG, JPEG ili WebP sliku.")
            name = "studio-" + uuid4().hex + IMAGE_EXTENSIONS[mime]
            write_bytes(private / "uploads" / name, data)
            respond(handler, 201, {"path": "assets/uploads/" + name})
            return
        edit_document(handler, root, private, method, route)
    except ValueError as error:
        respond(handler, HTTPStatus.BAD_REQUEST, {"error": str(error)})
    except (AttributeError, KeyError, TypeError):
        respond(handler, HTTPStatus.BAD_REQUEST, {"error": "Provjeri strukturu sadržaja."})
    except OSError:
        respond(handler, HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Datoteka se nije mogla spremiti ili učitati."})
