from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from urllib.parse import parse_qs, parse_qsl, urlencode, urlsplit

from privacy_pages import PRIVACY_PAGES, render_privacy
from public_site import (
    ARTICLE_PATH, PAGE_ALIASES, PAGES as PUBLIC_PAGES, article_url, journal_articles,
    read_content, render_not_found, render_page, robots, sitemap,
)
from regional_site import read_regions, region_routes, render_region
from studio_cms import local_origin, serve_cms

ROOT = Path(__file__).resolve().parent.parent
REGIONS = read_regions(ROOT)
REGION_ROUTES = region_routes(REGIONS)
PAGES = {
    "index.html", "services.html", "about.html", "journal.html",
    "loader-preview.html", "styles.css", "script.js", "editorial-content.js",
    "napravi_mi_animirano_otkrivanj (1).mp4",
}
FOLDERS = {"assets", "studio-editor"}
CONTENT_FILES = {ROOT / "content" / name for name in ("about.json", "journal.json")}


class StudioPreview(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path.startswith("/api/studio/"):
            serve_cms(self, ROOT, "GET", path)
        else:
            super().do_GET()

    def do_PUT(self):
        serve_cms(self, ROOT, "PUT", urlsplit(self.path).path)

    def do_POST(self):
        serve_cms(self, ROOT, "POST", urlsplit(self.path).path)


    def public_response(self, body, content_type, *, status=200, cache="no-cache"):
        data = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", cache)
        self.end_headers()
        return BytesIO(data)

    def redirect(self, location):
        self.send_response(301)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def serve_public(self, route, path, article_match):
        origin = "http://" + self.headers["Host"]
        query = parse_qs(route.query, keep_blank_values=True)
        journal = read_content(ROOT, "journal") if article_match or path in {"/journal/", "/sitemap.xml"} else None
        if path == "/robots.txt":
            return self.public_response(robots(origin), "text/plain")
        if path == "/sitemap.xml":
            return self.public_response(sitemap(origin, journal_articles(journal), REGIONS), "application/xml")
        if article_match or (path == "/journal/" and "article" in query):
            slug = article_match[1] if article_match else query["article"][0]
            article = journal_articles(journal).get(slug)
            if article is None:
                return self.public_response(render_not_found(ROOT), "text/html", status=404)
            canonical = article_url(slug)
            if route.path != canonical or "v" in query:
                self.redirect(canonical)
                return None
            return self.public_response(render_page(ROOT, origin, canonical, journal, article), "text/html")
        if path != route.path or "v" in query:
            params = urlencode([(key, value) for key, value in parse_qsl(route.query, keep_blank_values=True) if key != "v"])
            self.redirect(path + ("?" + params if params else ""))
            return None
        content = read_content(ROOT, "about") if path == "/about/" else journal
        return self.public_response(render_page(ROOT, origin, path, content, regions=REGIONS), "text/html")

    def send_head(self):
        if not local_origin(self):
            self.send_error(403)
            return None
        route = urlsplit(self.path)
        regional_path = route.path.removesuffix("/index.html").rstrip("/") + "/"
        if route.path in PRIVACY_PAGES:
            return self.public_response(render_privacy(ROOT, "http://" + self.headers["Host"], route.path), "text/html")
        if regional_path in PRIVACY_PAGES:
            self.redirect(regional_path + ("?" + route.query if route.query else ""))
            return None
        if regional_path in REGION_ROUTES:
            if regional_path != route.path:
                self.redirect(regional_path + ("?" + route.query if route.query else ""))
                return None
            key, service = REGION_ROUTES[regional_path]
            origin = "http://" + self.headers["Host"]
            return self.public_response(render_region(ROOT, origin, REGIONS, key, service), "text/html")
        path = PAGE_ALIASES.get(route.path, route.path)
        if path in {"/about/", "/journal/"} and "studio-preview" in parse_qs(route.query, keep_blank_values=True):
            if path != route.path:
                self.redirect(path + "?" + route.query)
                return None
            template = (ROOT / PUBLIC_PAGES[path]).read_text(encoding="utf-8")
            return self.public_response(template, "text/html", cache="no-store")
        article_match = ARTICLE_PATH.fullmatch(path)
        if article_match or path in {*PUBLIC_PAGES, "/sitemap.xml", "/robots.txt"}:
            return self.serve_public(route, path, article_match)
        path = Path(self.translate_path(self.path)).resolve()
        if path == ROOT:
            self.path = "/index.html"
        elif path == ROOT / "studio-editor" and path.is_dir():
            if urlsplit(self.path).path.endswith("/"):
                self.path = f"/{path.name}/index.html"
        elif not (
            path.is_file() and (
                (path.parent == ROOT and path.name in PAGES)
                or path in CONTENT_FILES
                or any(ROOT / folder in path.parents for folder in FOLDERS)
            )
        ):
            return self.public_response(render_not_found(ROOT), "text/html", status=404)
        return super().send_head()

    def end_headers(self):
        self.send_header("X-Robots-Tag", "noindex")
        path = Path(self.translate_path(self.path)).resolve()
        if path == ROOT / "studio-editor" or ROOT / "studio-editor" in path.parents:
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self'; img-src 'self' blob:; "
                "style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; "
                "frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
            )
        super().end_headers()


if __name__ == "__main__":
    parser = ArgumentParser(description="Run the local Ostrelya preview.")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    handler = partial(StudioPreview, directory=str(ROOT))
    ThreadingHTTPServer(("127.0.0.1", args.port), handler).serve_forever()
