"""Attach optional Google Analytics to the public production routes."""

import os
import re
from hashlib import sha256
from html import escape, unescape
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

from public_site import public_headers, read_content
from regional_site import read_regions, region_routes


def configure_analytics(root, output, privacy_routes):
    config = read_content(root, "analytics")
    measurement_id = os.environ.get("OSTRELYA_GA_MEASUREMENT_ID", config["measurement_id"])
    if not measurement_id:
        return
    if not re.fullmatch(r"G-[A-Z0-9]{6,20}", measurement_id):
        raise ValueError("Expected a Google Analytics web measurement ID.")

    def version(name):
        return sha256((output / name).read_bytes()).hexdigest()[:12]

    js_version = version("assets/analytics.js")
    css_version = version("assets/analytics.css")
    form_version = version("script.js")
    service_paths = {path for path, (_, service) in region_routes(read_regions(root)).items() if service}
    service_paths.add("/services/")
    urls = ElementTree.parse(output / "sitemap.xml").findall(".//{*}loc")
    paths = [urlsplit(item.text).path for item in urls]

    for path in (*paths, *privacy_routes):
        clean_path = unquote(path)
        name = clean_path.lstrip("/") + ("index.html" if path.endswith("/") else ".html")
        file = output / name
        html = file.read_text(encoding="utf-8")
        lang = re.search(r'<html\b[^>]*\blang="([^"]+)"', html, re.I)[1].lower()
        locale = clean_path.split("/")[1]
        if locale not in config["locales"]:
            locale = lang.split("-")[0]
        copy = {key: escape(value) for key, value in config["locales"].get(locale, config["locales"]["en"]).items()}
        blog = re.match(r"^/(?:[^/]+/)?blog(?:/|$)|^/journal(?:/|$)", clean_path)
        group = "guide" if blog else "service" if clean_path in service_paths else "site"
        if path in privacy_routes:
            group = "privacy"
        privacy_path = "/hr/politika-privatnosti/#kolacici" if locale in {"hr", "bs"} else "/privacy-policy/#cookies"
        panel = f"""
<section class="analytics-consent" id="analytics-consent" aria-labelledby="analytics-consent-title" hidden>
  <div>
    <h2 id="analytics-consent-title" tabindex="-1">{copy["title"]}</h2>
    <p>{copy["description"]} <a href="{privacy_path}">{copy["privacy"]}</a></p>
  </div>
  <div class="analytics-actions">
    <button type="button" data-analytics-choice="denied">{copy["deny"]}</button>
    <button type="button" data-analytics-choice="granted">{copy["allow"]}</button>
  </div>
</section>
"""
        if not all(tag in html for tag in ("</head>", "</body>", "</footer>")):
            raise ValueError(f"Analytics markup has no insertion point in {path}")
        head = (
            f'<meta name="ostrelya-analytics" content="{measurement_id}" data-group="{group}">\n'
            f'<link rel="stylesheet" href="/assets/analytics.css?v={css_version}">\n'
            f'<script src="/assets/analytics.js?v={js_version}" defer></script>\n'
        )
        button = f'<button type="button" class="analytics-settings" data-analytics-settings hidden>{copy["settings"]}</button>'
        html = html.replace("</head>", head + "</head>", 1)
        footer_start = html.index("<footer")
        nav_end = html.find("</nav>", footer_start, html.index("</footer>", footer_start))
        settings_position = nav_end if nav_end != -1 else html.index("</footer>", footer_start)
        html = html[:settings_position] + button + html[settings_position:]
        html = html.replace("</body>", panel + "</body>", 1)
        html = re.sub(r'(?<=src="/script\.js)(?:\?[^"]*)?(?=")', f"?v={form_version}", html)
        if blog:
            def service_link(match):
                href = urlsplit(unescape(match["href"]))
                if not href.scheme and not href.netloc and unquote(href.path) in service_paths:
                    return match[0] + " data-analytics-service-link"
                return match[0]
            html = re.sub(r'<a\b[^>]*\bhref="(?P<href>[^"]+)"', service_link, html)
        if group == "privacy":
            lang = "hr" if locale == "hr" else "en"
            notice = (root / "content" / f"analytics-privacy-{lang}.html").read_text(encoding="utf-8")
            html, count = re.subn(
                r'(<h2 id="privacy-cookies">.*?</h2>\s*)<p>[^<]+</p>',
                lambda match: match[1] + notice,
                html,
                count=1,
            )
            if count != 1:
                raise ValueError(f"Analytics disclosure has no insertion point in {path}")
        file.write_text(html, encoding="utf-8")

    (output / "_headers").write_text(public_headers(root, analytics=True), encoding="utf-8")
