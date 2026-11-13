"""Build the production Worker assets from the audited redesign and published archive."""

import re
from pathlib import Path
from shutil import copyfile
import sys
from tempfile import TemporaryDirectory
from urllib.parse import quote, unquote
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent
REDESIGN = ROOT / "redesign"
ORIGIN = "https://ostrelya.com"
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

sys.path.insert(0, str(REDESIGN / "tools"))
from public_site import build_public, read_content
from guide_pages import guide_path, render_guide, render_guide_index
from regional_site import read_regions
from privacy_pages import render_privacy
from check_indexable import check_indexable


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

    guides = read_content(REDESIGN, "archive-guides")
    new_guides = read_content(REDESIGN, "guides")
    if guides.keys() & new_guides.keys():
        raise ValueError("Guide slugs must be unique across the blog.")
    guides.update(new_guides)
    regions = read_regions(REDESIGN)
    locales = {"en": {"tag": "en", "language": "English"}, **regions}
    translations = read_content(REDESIGN, "regional-guides")
    if translations.keys() != guides.keys():
        raise ValueError("Regional translations must cover all blog guides.")
    guide_files = {
        guide_path(None, lang).lstrip("/") + ".html": (None, lang) for lang in locales
    }
    for slug, guide in guides.items():
        localized = translations[slug]
        if set(localized) != set(regions) - {"hr"}:
            raise ValueError(f"Incomplete regional guide: {slug}")
        guide.update(localized)
        for lang in locales:
            local_slug = guide[lang].get("slug", slug)
            if not local_slug or not all(char.isalnum() or char == "-" for char in local_slug):
                raise ValueError(f"Invalid guide slug: {local_slug!r}")
            name = unquote(guide_path(slug, lang, guide)).lstrip("/") + ".html"
            if name in guide_files:
                raise ValueError(f"Duplicate guide path: {name}")
            guide_files[name] = slug, lang
    archive_pages = tuple(dict.fromkeys((*ARCHIVE_PAGES, *guide_files)))
    for name in archive_pages:
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        if name in guide_files:
            slug, lang = guide_files[name]
            if slug:
                body = render_guide(REDESIGN, ORIGIN, slug, lang, guides[slug], locales)
            else:
                body = render_guide_index(REDESIGN, ORIGIN, lang, guides, locales)
            target.write_text(body, encoding="utf-8")
            continue
        body = (ROOT / name).read_text(encoding="utf-8")
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
            body = body.replace(unencoded, canonical.removesuffix(".html"))
        target.write_text(body, encoding="utf-8")
    return archive_pages


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


def update_routing(output, archive_pages):
    with (output / "_redirects").open("a", encoding="utf-8") as handle:
        for source, target in REDIRECTS.items():
            handle.write(f"{source} {target} 301\n")
        for page in archive_pages:
            source = "/" + quote(page, safe="/")
            target = source.removesuffix(".html")
            handle.write(f"{source} {target} 301\n{target}/ {target} 301\n")

    ElementTree.register_namespace("", SITEMAP_NS)
    path = output / "sitemap.xml"
    sitemap = ElementTree.parse(path)
    for page in archive_pages:
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
        archive_pages = preserve_archive(staging)
        build_privacy(staging)
        update_navigation(staging)
        update_routing(staging, archive_pages)
        indexable_count = check_indexable(staging, ORIGIN)
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
    print(f"Built Ostrelya production assets in dist. Verified {indexable_count} sitemap URLs.")


if __name__ == "__main__":
    main()
