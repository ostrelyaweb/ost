from argparse import ArgumentParser
from base64 import b64encode
from datetime import date
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import re
from shutil import copyfile
from tempfile import TemporaryDirectory
from urllib.parse import quote, urlsplit
from xml.etree.ElementTree import Element, SubElement, tostring

from regional_site import read_regions, region_routes, render_region, site_chrome
from work_site import WORK_INDEX, read_projects, render_work, work_routes

ROOT = Path(__file__).resolve().parent.parent
PAGES = {"/": "index.html", "/services/": "services.html", "/about/": "about.html", "/journal/": "journal.html"}
PAGE_ALIASES = {"/index.html": "/", "/work": WORK_INDEX}
for route, template in PAGES.items():
    if route != "/":
        PAGE_ALIASES.update({route.rstrip("/"): route, "/" + template: route, route + "index.html": route})
PREVIEW_PRIVACY = re.compile(r'<(a|p|span)\b[^>]*\bdata-preview-privacy\b[^>]*>.*?</\1>', re.S)
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
ARTICLE_PATH = re.compile(r"/journal/([a-z0-9]+(?:-[a-z0-9]+)*)/?")
HERO = "/assets/hero-metal-emblem.webp"
PUBLIC_ASSET_TYPES = {
    ".avif", ".css", ".gif", ".html", ".ico", ".jpeg", ".jpg", ".js", ".json",
    ".mp4", ".png", ".svg", ".txt", ".wav", ".webm", ".webp", ".woff", ".woff2", ".zip",
}


def read_content(root, name):
    return json.loads((root / "content" / (name + ".json")).read_bytes())


def journal_articles(content):
    return {article["slug"]: article for article in content["articles"] if SLUG.fullmatch(article["slug"])}


def asset_url(root, value):
    if not value or not value.lstrip("/").startswith("assets/") or "\\" in value:
        return ""
    asset = (root / value.lstrip("/")).resolve()
    if not asset.is_file() or (root / "assets") not in asset.parents:
        return ""
    return "/" + quote(asset.relative_to(root).as_posix())


def image(root, data, class_name="content-image", *, eager=False):
    url = asset_url(root, data.get("image"))
    if not url:
        return ""
    attributes = ' fetchpriority="high"' if eager else ' loading="lazy" decoding="async"'
    if url == HERO:
        attributes += ' width="1254" height="1254"'
        if eager:
            attributes += ' srcset="/assets/hero-metal-emblem-640.webp 640w, /assets/hero-metal-emblem.webp 1254w" sizes="(max-width: 760px) 288px, 33vw"'
    return f'<img class="{class_name}" src="{url}" alt="{escape(data.get("alt", ""))}"{attributes} />'


def paragraphs(value):
    return "".join(f"<p>{escape(part.strip())}</p>" for part in re.split(r"\r?\n\s*\r?\n", value) if part.strip())


def about_markup(root, content):
    cover = image(root, content, "about-cover", eager=True)
    sections = []
    for section in content["sections"]:
        eyebrow = escape(section.get("eyebrow", ""))
        label = f'<p class="services-kicker">{eyebrow}</p>' if eyebrow else ""
        sections.append(
            '<section class="about-section"><div class="about-section-heading">'
            f'{label}<h2 class="editorial-heading">{escape(section["title"])}</h2></div>'
            f'<div class="about-section-body">{paragraphs(section["text"])}{image(root, section)}</div></section>'
        )
    return (
        '<section class="page-container content-hero about-hero" aria-labelledby="content-title"><div>'
        f'<p class="services-kicker">{escape(content["eyebrow"])}</p>'
        f'<h1 class="editorial-heading" id="content-title">{escape(content["title"])}</h1>'
        f'<p class="content-intro">{escape(content["intro"])}</p>'
        '<a class="btn-primary content-cta" href="#contact">Let’s talk <span aria-hidden="true">↗</span></a>'
        f'</div>{cover}</section><div class="page-container about-sections">{"".join(sections)}</div>'
    )


def journal_meta(article):
    category = escape(article.get("category", ""))
    stamp = date.fromisoformat(article["date"])
    label = f"<span>{category}</span>" if category else ""
    return (
        f'<div class="journal-meta">{label}'
        f'<time datetime="{stamp.isoformat()}">{stamp.strftime("%d %b %Y").lstrip("0")}</time></div>'
    )


def journal_markup(root, content, article):
    if article is not None:
        sections = []
        for section in article["sections"]:
            title = escape(section.get("title", ""))
            heading = f"<h2>{title}</h2>" if title else ""
            section_id = section.get("id", "")
            anchor = f' id="{section_id}"' if SLUG.fullmatch(section_id) else ""
            sections.append(f'<section class="journal-block"{anchor}>{heading}{paragraphs(section["text"])}{image(root, section)}</section>')
        back = '<a class="journal-back" href="/journal/">← All articles</a>'
        links = ""
        if article["slug"] == "website-launch-and-maintenance":
            links = ('<p class="journal-block"><a class="journal-back" href="/services/#seo">Technical SEO ↗</a>'
                     ' · <a class="journal-back" href="/services/#support">Website maintenance ↗</a></p>')
        inner = (
            f'<article class="journal-article">{back}'
            f'{journal_meta(article)}<h1 class="editorial-heading">{escape(article["title"])}</h1>'
            f'<p class="content-intro">{escape(article["summary"])}</p>'
            f'{image(root, article)}{"".join(sections)}{links}</article>'
        )
    else:
        cards = []
        for post in sorted(journal_articles(content).values(), key=lambda entry: entry["date"], reverse=True):
            cards.append(
                f'<a class="journal-card" href="/journal/{post["slug"]}/"><div class="journal-card-copy">'
                f'{journal_meta(post)}<h2 class="editorial-heading">{escape(post["title"])}</h2>'
                f'<p>{escape(post["summary"])}</p><span class="journal-read">Read article ↗</span></div>{image(root, post)}</a>'
            )
        listing = "".join(cards) or '<p class="content-status">No articles yet.</p>'
        inner = (
            '<header class="content-hero journal-hero"><p class="services-kicker">Ostrelya Studio / Notes</p>'
            f'<h1 class="editorial-heading">{escape(content["title"])}</h1><p class="content-intro">{escape(content["intro"])}</p>'
            f'</header><div class="journal-list" aria-label="Articles">{listing}</div>'
            '<p class="journal-block"><a class="journal-back" href="/en/blog">Web design, development and SEO guides ↗</a>'
            ' · <a class="journal-back" href="/blog" lang="hr" hreflang="hr">Vodiči na hrvatskom ↗</a></p>'
        )
    return f'<div class="page-container journal-shell">{inner}</div>'


def render_page(root, origin, path, content=None, article=None):
    template = PAGES["/journal/"] if article is not None else PAGES[path]
    html = (root / template).read_text(encoding="utf-8")
    title, description, social = {
        "index.html": ("Ostrelya Studio — Web Design, Development & Brand Identity",
                       "Ostrelya is an independent studio for web design, development and visual identity. We build, redesign and maintain websites for teams across Southeast Europe.", HERO),
        "services.html": ("Web Development, SEO & Web Design | Ostrelya Studio",
                          "Web development, technical SEO and website maintenance for teams in Southeast Europe. Explore website design, visual identity and CMS support.", HERO),
        "about.html": ("About Ostrelya — Independent Web Design Studio",
                       "Meet Ostrelya, an independent studio designing brand identities and building websites for teams across Southeast Europe.", HERO),
        "journal.html": ("Journal — Design and Web Development Notes | Ostrelya",
                         "Notes on designing and building the web at Ostrelya.", HERO),
    }[template]
    if template == "about.html":
        html = replace_editorial(html, about_markup(root, content))
        social = asset_url(root, content.get("image")) or social
    elif template == "journal.html":
        html = replace_editorial(html, journal_markup(root, content, article))
        if article is not None:
            title = article["title"] + " — Ostrelya Journal"
            description = article["summary"]
            social = asset_url(root, article.get("image")) or social
        else:
            description = content["intro"]

    url = origin + path
    meta = (
        f'<title>{escape(title)}</title>\n'
        f'  <meta name="description" content="{escape(description)}" />\n'
        f'  <link rel="canonical" href="{escape(url)}" />\n'
        f'  <meta property="og:type" content="{"article" if article is not None else "website"}" />\n'
        '  <meta property="og:site_name" content="Ostrelya Studio" />\n'
        f'  <meta property="og:title" content="{escape(title)}" />\n'
        f'  <meta property="og:description" content="{escape(description)}" />\n'
        f'  <meta property="og:url" content="{escape(url)}" />\n'
        f'  <meta property="og:image" content="{escape(origin + social)}" />'
    )
    organization = {"@type": "Organization", "name": "Ostrelya Studio", "url": origin + "/"}
    schema = None
    if path == "/":
        schema = {**organization, "logo": origin + "/assets/symbol-dark.png"}
    elif article is not None:
        schema = {
            "@type": "BlogPosting", "headline": article["title"], "description": description,
            "datePublished": article["date"], "mainEntityOfPage": url, "publisher": organization,
        }
        if article_image := asset_url(root, article.get("image")):
            schema["image"] = origin + article_image
    if schema:
        data = json.dumps({"@context": "https://schema.org", **schema}, ensure_ascii=False).replace("<", "\\u003c")
        meta += f'\n  <script type="application/ld+json">{data}</script>'
    start = html.index("<!-- PAGE_METADATA_START -->")
    end = html.index("<!-- PAGE_METADATA_END -->", start) + len("<!-- PAGE_METADATA_END -->")
    html = html[:start] + meta + html[end:]
    return html


def replace_editorial(html, markup):
    start = html.index("<!-- EDITORIAL_START -->")
    end = html.index("<!-- EDITORIAL_END -->", start) + len("<!-- EDITORIAL_END -->")
    html = html[:start] + markup + html[end:]
    return html.replace('  <script type="module" src="/editorial-content.js?v=studio-session"></script>\n', "")


def article_url(slug):
    return f"/journal/{slug}/"


def sitemap(origin, articles, regions, projects):
    urlset = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in (*PAGES, *work_routes(projects), *(article_url(slug) for slug in articles), *region_routes(regions)):
        SubElement(SubElement(urlset, "url"), "loc").text = origin + path
    return tostring(urlset, encoding="unicode", xml_declaration=True) + "\n"


def robots(origin):
    return f"User-agent: *\nAllow: /\n\nSitemap: {origin}/sitemap.xml\n"


def render_not_found(root):
    header, footer = site_chrome(root, regional=False)
    header = header.replace('href="#contact"', 'href="/#contact"')
    footer = footer.replace('href="#contact"', 'href="/#contact"')
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Page not found | Ostrelya Studio</title>
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=regional">
  <script src="/script.js?v=clean-routes" defer></script>
</head>
<body id="top" class="page-editorial">
  {header}
  <main class="page-container">
    <section class="content-hero">
      <p class="services-kicker">Ostrelya Studio / 404</p>
      <h1 class="editorial-heading">Page not found.</h1>
      <p class="content-intro">This address may have changed.</p>
      <a class="btn-primary content-cta" href="/">Back to Ostrelya <span aria-hidden="true">↗</span></a>
    </section>
  </main>
  {footer}
</body>
</html>
"""


def public_headers(root, *, analytics=False):
    # Keep the homepage bootstrap and the local Three.js import map usable without unsafe-inline scripts.
    inline_scripts = (
        (root / "index.html", r"<script>(.*?)</script>"),
        (root / "assets/concepts/room-studio/index.html", r'<script type="importmap">(.*?)</script>'),
    )
    hashes = []
    for path, pattern in inline_scripts:
        script = re.search(pattern, path.read_text(encoding="utf-8"), re.S).group(1)
        hashes.append("'sha256-" + b64encode(sha256(script.encode("utf-8")).digest()).decode("ascii") + "'")
    tag_host = " https://www.googletagmanager.com" if analytics else ""
    analytics_hosts = " https://*.google-analytics.com" if analytics else ""
    analytics_connections = " https://*.analytics.google.com" if analytics else ""
    return (
        "/*\n"
        f"  Content-Security-Policy: default-src 'self'; script-src 'self' {' '.join(hashes)}{tag_host}; "
        f"style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:{tag_host}{analytics_hosts}; "
        f"media-src 'self' blob:; connect-src 'self'{tag_host}{analytics_hosts}{analytics_connections}; "
        "frame-src 'self'; frame-ancestors 'none'; "
        "object-src 'none'; base-uri 'none'; form-action 'self'\n"
        "  X-Content-Type-Options: nosniff\n"
        "  X-Frame-Options: DENY\n"
        "  Referrer-Policy: strict-origin-when-cross-origin\n"
        "  Permissions-Policy: camera=(), microphone=(), geolocation=()\n"
    )


def build_public(root, output, origin):
    about = read_content(root, "about")
    journal = read_content(root, "journal")
    articles = journal_articles(journal)
    regions = read_regions(root)
    projects = read_projects(root)
    pages = {
        path.lstrip("/") + "index.html": render_page(
            root, origin, path, {"/about/": about, "/journal/": journal}.get(path)
        )
        for path in PAGES
    }
    for slug, article in articles.items():
        pages[f"journal/{slug}/index.html"] = render_page(root, origin, article_url(slug), journal, article)
    for path, project in work_routes(projects).items():
        pages[path.lstrip("/") + "index.html"] = render_work(root, origin, path, project, projects)
    for path, (key, service) in region_routes(regions).items():
        pages[path.lstrip("/") + "index.html"] = render_region(root, origin, regions, key, service)
    pages["404.html"] = render_not_found(root)
    pages = {name: PREVIEW_PRIVACY.sub("", body) for name, body in pages.items()}
    pages["_redirects"] = "".join(f"{alias} {path} 301\n" for alias, path in PAGE_ALIASES.items())
    pages["_headers"] = public_headers(root)
    pages["sitemap.xml"] = sitemap(origin, articles, regions, projects)
    pages["robots.txt"] = robots(origin)
    pages["_routes.json"] = json.dumps({"version": 1, "include": ["/", "/api/locale", "/api/enquiry"], "exclude": []}) + "\n"
    pages["_worker.js"] = (root / "tools" / "locale_worker.js").read_text(encoding="utf-8")

    output.mkdir()
    for name, body in pages.items():
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
    for name in ("styles.css", "script.js"):
        copyfile(root / name, output / name)

    rendered_pages = "\n".join(pages.values())
    assets = root / "assets"
    for source in assets.rglob("*"):
        relative = source.relative_to(root)
        if (not source.is_file() or assets not in source.resolve().parents
                or any(part.startswith(".") for part in relative.parts)):
            continue
        if source.name != "LICENSE" and source.suffix.lower() not in PUBLIC_ASSET_TYPES:
            continue
        if relative.parts[1] == "uploads" and ('/' + quote(relative.as_posix()) + '"') not in rendered_pages:
            continue
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix == ".html":
            html = PREVIEW_PRIVACY.sub("", source.read_text(encoding="utf-8"))
            target.write_text(html.replace("</head>", '  <meta name="robots" content="noindex">\n</head>', 1), encoding="utf-8")
        else:
            copyfile(source, target)


def main():
    parser = ArgumentParser(description="Build the public Ostrelya site from published content.")
    parser.add_argument("--origin", required=True, help="The public HTTPS origin, without a path.")
    parser.add_argument("--output", required=True, type=Path, help="A new directory for the public files.")
    args = parser.parse_args()
    origin = urlsplit(args.origin)
    if (origin.scheme != "https" or not origin.hostname or origin.username is not None
            or origin.path not in ("", "/") or origin.query or origin.fragment):
        parser.error("--origin must be a public HTTPS origin without a path")
    output = args.output.resolve()
    if output.exists() or not output.parent.is_dir() or ROOT / "assets" in output.parents:
        parser.error("--output must be a new directory under an existing parent, outside assets")
    with TemporaryDirectory(prefix=".ostrelya-build-", dir=output.parent) as temporary:
        staging = Path(temporary) / "public"
        build_public(ROOT, staging, f"{origin.scheme}://{origin.netloc}")
        staging.rename(output)


if __name__ == "__main__":
    main()
