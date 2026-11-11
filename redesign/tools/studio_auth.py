from getpass import GetPassWarning, getpass
from hashlib import scrypt
from hmac import compare_digest
import json
from os import link
from pathlib import Path
import secrets
from sys import version_info
from tempfile import NamedTemporaryFile
from time import monotonic
import warnings

ACCOUNT_FILE = "editor-account.json"
MIN_PASSWORD_LENGTH = 16
SESSION_SECONDS = 8 * 60 * 60
sessions = {}
failed_logins = []


def session_token(handler):
    scheme, _, token = handler.headers.get("Authorization", "").partition(" ")
    return token if scheme.lower() == "bearer" and len(token) == 43 else None


def session_user(handler):
    session = sessions.get(session_token(handler))
    if session and session[1] > monotonic():
        return session[0]
    return None


def password_hash(password, salt):
    return scrypt(password.encode("utf-8"), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


def auth_action(handler, private, method, action, data):
    account_path = private / ACCOUNT_FILE
    if method == "GET" and action == "session":
        provisioned = account_path.is_file()
        return 200, {"user": session_user(handler) if provisioned else None, "provisioned": provisioned}
    if method != "POST":
        return 405, {"error": "Radnja nije dostupna."}
    if action == "logout":
        sessions.pop(session_token(handler), None)
        return 200, {"user": None, "provisioned": account_path.is_file()}
    if action != "login":
        return 404, {"error": "Radnja nije pronađena."}

    user = data.get("user", "")
    password = data.get("password", "")
    if not isinstance(user, str) or not user.strip() or len(user) > 80 or not isinstance(password, str) or len(password) > 128:
        return 400, {"error": "Provjeri korisničko ime i lozinku."}

    now = monotonic()
    failed_logins[:] = [attempt for attempt in failed_logins if now - attempt < 60]
    if len(failed_logins) >= 8:
        return 429, {"error": "Previše pokušaja. Pričekaj jednu minutu."}
    account = json.loads(account_path.read_bytes()) if account_path.is_file() else None
    if not account or not compare_digest(password_hash(password, account["salt"]), account["hash"]) or user.strip() != account["user"]:
        failed_logins.append(now)
        return 401, {"error": "Korisničko ime ili lozinka nisu točni."}
    failed_logins.clear()

    sessions.pop(session_token(handler), None)
    for token, (_, expiry) in list(sessions.items()):
        if expiry <= now:
            sessions.pop(token, None)
    token = secrets.token_urlsafe(32)
    sessions[token] = (account["user"], now + SESSION_SECONDS)
    return 200, {"user": account["user"], "provisioned": True, "token": token}


def provision_editor():
    account_path = Path(__file__).resolve().parents[1] / ".studio-private" / ACCOUNT_FILE
    if account_path.exists():
        raise SystemExit("Urednički račun već postoji.")
    user = input("Korisničko ime: ").strip()
    if not user or len(user) > 80 or not user.isprintable():
        raise SystemExit("Unesi korisničko ime do 80 znakova.")
    password_options = {"echo_char": "*"} if version_info >= (3, 14) else {}
    if not password_options:
        print("Terminal prima znakove lozinke bez prikaza. Pritisni Enter nakon unosa.")
    with warnings.catch_warnings():
        warnings.simplefilter("error", GetPassWarning)
        try:
            password = getpass(f"Lozinka (najmanje {MIN_PASSWORD_LENGTH} znakova): ", **password_options)
            confirmation = getpass("Ponovi lozinku: ", **password_options)
        except GetPassWarning:
            raise SystemExit("Otvori interaktivni terminal za unos skrivene lozinke.") from None
    if not MIN_PASSWORD_LENGTH <= len(password) <= 128 or password != confirmation:
        raise SystemExit(f"Lozinke se moraju podudarati i imati od {MIN_PASSWORD_LENGTH} do 128 znakova.")

    salt = secrets.token_hex(16)
    account = {"user": user, "salt": salt, "hash": password_hash(password, salt)}
    account_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=account_path.parent, delete=False) as temporary:
        temporary_path = Path(temporary.name)
        try:
            temporary.write(json.dumps(account, ensure_ascii=False).encode("utf-8"))
            temporary.close()
            # A concurrent invocation must never replace an existing account.
            link(temporary_path, account_path)
        except FileExistsError:
            raise SystemExit("Urednički račun već postoji.") from None
        finally:
            temporary_path.unlink(missing_ok=True)
    print("Urednički račun je spreman. Prijavi se u Studio Editor.")


if __name__ == "__main__":
    provision_editor()
