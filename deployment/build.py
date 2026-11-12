"""Build the production Worker assets from the audited redesign and published archive."""

import re
from pathlib import Path
from shutil import copyfile
import sys
from tempfile import TemporaryDirectory
from urllib.parse import quote
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent
REDESIGN = ROOT / "redesign"
ORIGIN = "https://ostrelya.com"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

sys.path.insert(0, str(REDESIGN / "tools"))
from public_site import build_public
from privacy_pages import render_privacy


REDIRECTS = {
    "/usluge": "/hr/",
    "/usluge.html": "/hr/",
    "/kontakt": "/hr/#contact",
    "/kontakt.html": "/hr/#contact",
    "/en": "/?lang=en",
    "/en/": "/?lang=en",
    "/en/index.html": "/?lang=en",
    "/en/usluge": "/services/",
    "/en/usluge.html": "/services/",
    "/en/kontakt": "/?lang=en#contact",
    "/en/kontakt.html": "/?lang=en#contact",
    "/privacy/": "/privacy-policy/",
    "/privacy": "/privacy-policy/",
    "/hr/privatnost/": "/hr/politika-privatnosti/",
    "/hr/privatnost": "/hr/politika-privatnosti/",
    "/pravila-privatnosti": "/hr/politika-privatnosti/",
    "/pravila-privatnosti.html": "/hr/politika-privatnosti/",
    "/en/pravila-privatnosti": "/privacy-policy/",
    "/en/pravila-privatnosti.html": "/privacy-policy/",
}
ARCHIVE_PAGES = (
    "blog.html", "en/blog.html",
    *(
        path.relative_to(ROOT).as_posix()
        for folder in ("blog", "en/blog")
        for path in sorted((ROOT / folder).glob("*.html"))
    ),
)
ARCHIVE_ASSETS = (
    "js/main.js", "images/blog1.jpg", "images/blog2.jpg", "images/blog3.jpg",
    "images/favicon.png", "images/footer-logo.png", "images/logo.png", "og.png",
)
FONT_LINK = re.compile(r'<link\b[^>]*href="https://fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>\s*', re.I)
ARCHIVE_NEWSLETTER = re.compile(r'<section class="lead-magnet"[^>]*>.*?</section>', re.S)
FOOTER_NAV = re.compile(r'(<nav aria-label="Footer navigation">.*?)(</nav>)', re.S)
PRIVACY_ROUTES = {"/privacy/": "/privacy-policy/", "/hr/privatnost/": "/hr/politika-privatnosti/"}


def copy_asset(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    copyfile(source, target)


def preserve_archive(output):
    for name in ARCHIVE_ASSETS:
        copy_asset(ROOT / name, output / name)
    (output / "css").mkdir()
    legacy_css = (ROOT / "css/styles.css").read_text(encoding="utf-8")
    (output / "css/styles.css").write_text(legacy_css.replace("DM Sans", "Manrope"), encoding="utf-8")

    scripts = ("gsap.min.js", "ScrollTrigger.min.js")
    for script in scripts:
        copy_asset(ROOT / "deployment/vendor" / script, output / "js/vendor" / script)

    for name in ARCHIVE_PAGES:
        body = (ROOT / name).read_text(encoding="utf-8")
        if name.startswith(("blog/", "en/blog/")):
            if name.startswith("en/"):
                label, href = "Read the website launch and maintenance checklist", "/journal/website-launch-and-maintenance/"
            elif "održavanje" in name:
                label, href = "Pogledajte uslugu održavanja web stranica", "/hr/usluge/odrzavanje-web-stranica/"
            else:
                label, href = "Pogledajte opseg usluge izrade web stranica", "/hr/usluge/web-dizajn/"
            body = ARCHIVE_NEWSLETTER.sub(
                f'<section class="article-cta"><a class="btn" href="{href}">{label} →</a></section>',
                body,
            )
        body = FONT_LINK.sub("", body)
        body = body.replace("</head>", '<link rel="stylesheet" href="/assets/regional-fonts.css">\n</head>', 1)
        for script in scripts:
            body = body.replace(
                f"https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/{script}", f"/js/vendor/{script}"
            )
        for archive in ARCHIVE_PAGES:
            canonical = ORIGIN + "/" + quote(archive, safe="/")
            body = body.replace(canonical, canonical.removesuffix(".html"))
            unencoded = ORIGIN + "/" + archive
            body = body.replace(unencoded, unencoded.removesuffix(".html"))
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def build_privacy(output):
    for source, canonical in PRIVACY_ROUTES.items():
        body = render_privacy(REDESIGN, ORIGIN, source)
        for old, new in PRIVACY_ROUTES.items():
            body = body.replace(ORIGIN + old, ORIGIN + new).replace(f'href="{old}', f'href="{new}')
        path = output / canonical.lstrip("/") / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")


def update_navigation(output):
    for page in output.rglob("index.html"):
        body = page.read_text(encoding="utf-8")
        privacy = ('<a href="/hr/politika-privatnosti/">Privatnost i kolačići</a>' if '<html lang="hr">' in body
                   else '<a href="/privacy-policy/">Privacy and cookies</a>')
        body = re.sub(r'<a\b[^>]*\bdata-preview-privacy\b[^>]*>.*?</a>', "", body, flags=re.S)
        body, count = FOOTER_NAV.subn(lambda match: match[1] + privacy + "\n      " + match[2], body, count=1)
        if count:
            status = (
                '<div class="page-container locale-connection" id="connection-location" data-locale-connection hidden>'
                '<span data-country-status role="status"></span>'
                '<button type="button" data-refresh-locale></button></div>'
            )
            body = body.replace("</footer>", status + "</footer>", 1)
            if "/assets/region-language.js" not in body:
                body = body.replace("</body>", '<script src="/assets/region-language.js?v=10" defer></script></body>', 1)
            page.write_text(body, encoding="utf-8")

    room = output / "assets/concepts/room-studio/index.html"
    body = room.read_text(encoding="utf-8")
    body = body.replace("</footer>", '<a href="/privacy-policy/#cookies">Browser storage and privacy</a></footer>', 1)
    room.write_text(body, encoding="utf-8")


def update_routing(output):
    with (output / "_redirects").open("a", encoding="utf-8") as handle:
        for source, target in REDIRECTS.items():
            handle.write(f"{source} {target} 301\n")

    ElementTree.register_namespace("", SITEMAP_NS)
    path = output / "sitemap.xml"
    sitemap = ElementTree.parse(path)
    for page in ARCHIVE_PAGES:
        entry = ElementTree.SubElement(sitemap.getroot(), f"{{{SITEMAP_NS}}}url")
        ElementTree.SubElement(entry, f"{{{SITEMAP_NS}}}loc").text = ORIGIN + "/" + quote(
            page.removesuffix(".html"), safe="/"
        )
    sitemap.write(path, encoding="utf-8", xml_declaration=True)

    # Wrangler uses the source module and explicit Worker routes instead of Pages metadata.
    (output / "_worker.js").unlink()
    (output / "_routes.json").unlink()


def main():
    destination = ROOT / "dist"
    if destination.is_symlink() or destination.resolve() != destination:
        raise RuntimeError("dist must be a real directory within the repository.")
    with TemporaryDirectory(prefix=".ostrelya-build-", dir=ROOT) as temporary:
        staging = Path(temporary) / "public"
        build_public(REDESIGN, staging, ORIGIN)
        preserve_archive(staging)
        build_privacy(staging)
        update_navigation(staging)
        update_routing(staging)
        previous = Path(temporary) / "previous"
        if destination.exists():
            if not destination.is_dir():
                raise RuntimeError("dist exists and is not a directory.")
            destination.rename(previous)
        try:
            staging.rename(destination)
        except OSError:
            if previous.exists():
                previous.rename(destination)
            raise
    print("Built Ostrelya production assets in dist.")


if __name__ == "__main__":
    main()
