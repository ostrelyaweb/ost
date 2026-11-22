"""Shared guide routes and service relationships for both directions of navigation."""

import json
from urllib.parse import quote


GUIDE_SERVICES = {
    "koliko-košta-web-stranica-2026": "web",
    "što-znati-prije-kupnje-web-stranice": "web",
    "održavanje-web-stranice-zašto-je-bitno": "maintenance",
    "redizajn-web-stranice-bez-gubitka-seo": "redesign",
    "zasto-web-stranica-nije-na-googleu": "seo",
    "kako-da-se-web-pojavi-u-ai-pretrazivanju": "seo",
    "treba-li-web-stranici-cms": "development",
    "plan-visejezicne-web-stranice": "development",
    "web-za-apartmane-upit-ili-rezervacija": "web",
}


def guide_path(slug, lang, entry=None):
    prefix = "/blog" if lang == "hr" else f"/{lang}/blog"
    if entry:
        slug = entry[lang].get("slug", slug)
    return prefix + "/" + quote(slug) if slug else prefix


def service_guides(root, lang, service):
    guides = {}
    for name in ("archive-guides", "guides"):
        guides.update(json.loads((root / f"content/{name}.json").read_bytes()))
    translations = json.loads((root / "content/regional-guides.json").read_bytes())
    links = []
    for slug, target in GUIDE_SERVICES.items():
        if target != service:
            continue
        entry = {**guides[slug], **translations[slug]}
        links.append((entry[lang]["title"], guide_path(slug, lang, entry)))
    return links
