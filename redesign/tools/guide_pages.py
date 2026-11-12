"""Render guides, topic indexes and language alternatives."""

from html import escape
import json
from urllib.parse import quote

from regional_site import region_path, site_chrome


# Title, introduction, topic labels and navigation strings for each edition.
LABELS = {
    "hr": (
        "Vodiči za web dizajn, razvoj i SEO",
        "Planirajte izradu ili redizajn weba, odaberite CMS i provjerite kako kupci mogu pronaći vaše stranice.",
        ("Izrada i redizajn", "SEO i AI pretraživanje", "Sadržaj i održavanje"),
        "Teme", "Jezik i tržište", "Svi vodiči", "Povezane usluge i vodiči", "Izvori",
    ),
    "en": (
        "Web design, development and SEO guides",
        "Plan a new website or redesign, choose a CMS and check how customers can find your pages.",
        ("Build and redesign", "SEO and AI search", "Content and maintenance"),
        "Topics", "Language and market", "All guides", "Related services and guides", "Sources",
    ),
    "bs": (
        "Vodiči za izradu web stranica i SEO u BiH",
        "Saznajte kako uporediti ponude, pripremiti redizajn i provjeriti mogu li kupci pronaći vašu stranicu.",
        ("Izrada i redizajn", "SEO i AI pretraga", "Sadržaj i održavanje"),
        "Teme", "Jezik i tržište", "Svi vodiči", "Povezane usluge i vodiči", "Izvori",
    ),
    "sr-rs": (
        "Vodiči za izradu sajtova i SEO u Srbiji",
        "Isplanirajte izradu ili redizajn sajta, odaberite CMS i proverite kako vas kupci pronalaze.",
        ("Izrada i redizajn", "SEO i AI pretraga", "Sadržaj i održavanje"),
        "Teme", "Jezik i tržište", "Svi vodiči", "Povezane usluge i vodiči", "Izvori",
    ),
    "sr-me": (
        "Vodiči za izradu sajtova i SEO u Crnoj Gori",
        "Isplanirajte novi sajt, pripremite redizajn i provjerite kako vas kupci pronalaze.",
        ("Izrada i redizajn", "SEO i AI pretraga", "Sadržaj i održavanje"),
        "Teme", "Jezik i tržište", "Svi vodiči", "Povezane usluge i vodiči", "Izvori",
    ),
    "sl": (
        "Vodniki za izdelavo spletnih strani in SEO",
        "Načrtujte izdelavo ali prenovo, izberite CMS in preverite, kako lahko kupci najdejo vaše spletno mesto.",
        ("Izdelava in prenova", "SEO in iskanje z umetno inteligenco", "Vsebina in vzdrževanje"),
        "Teme", "Jezik in trg", "Vsi vodniki", "Povezane storitve in vodniki", "Viri",
    ),
    "mk": (
        "Водичи за изработка на веб-страници и SEO",
        "Испланирајте изработка или редизајн, одберете CMS и проверете како клиентите ја наоѓаат вашата страница.",
        ("Изработка и редизајн", "SEO и пребарување со ВИ", "Содржина и одржување"),
        "Теми", "Јазик и пазар", "Сите водичи", "Поврзани услуги и водичи", "Извори",
    ),
    "sq": (
        "Udhëzues për krijimin e faqeve të internetit dhe SEO",
        "Planifikoni krijimin ose ridizajnimin e faqes, zgjidhni një CMS dhe shihni si mund t’ju gjejnë klientët.",
        ("Krijimi dhe ridizajnimi", "SEO dhe kërkimi me AI", "Përmbajtja dhe mirëmbajtja"),
        "Temat", "Gjuha dhe tregu", "Të gjithë udhëzuesit", "Shërbime dhe udhëzues të lidhur", "Burimet",
    ),
}
TOPICS = ("planning", "search", "operations")
GUIDE_SERVICES = {
    "koliko-košta-web-stranica-2026": "web",
    "što-znati-prije-kupnje-web-stranice": "web",
    "održavanje-web-stranice-zašto-je-bitno": "maintenance",
    "redizajn-web-stranice-bez-gubitka-seo": "redesign",
    "zasto-web-stranica-nije-na-googleu": "seo",
    "kako-da-se-web-pojavi-u-ai-pretrazivanju": "seo",
    "treba-li-web-stranici-cms": "development",
    "plan-visejezicne-web-stranice": "development",
}


def guide_path(slug, lang, entry=None):
    prefix = "/blog" if lang == "hr" else f"/{lang}/blog"
    if entry:
        slug = entry[lang].get("slug", slug)
    return prefix + "/" + quote(slug) if slug else prefix


def guide_links(links):
    return "".join(
        f'<li><a href="{escape(href)}">{escape(label)}</a></li>'
        for label, href in links
    )


def language_links(slug, lang, entry, locales):
    links = []
    for key, locale in locales.items():
        tag = locale["tag"]
        label = locale["language"]
        current = ' aria-current="page"' if key == lang else ""
        links.append(
            f'<a href="{guide_path(slug, key, entry)}" lang="{tag}" hreflang="{tag}"{current}>{escape(label)}</a>'
        )
    return f'<nav class="guide-topics guide-languages" aria-label="{LABELS[lang][4]}">{"".join(links)}</nav>'


def render_guide(root, origin, slug, lang, entry, locales):
    _, _, _, _, _, all_guides, related, sources_heading = LABELS[lang]
    locale = locales[lang]
    guide = entry[lang]
    url = origin + guide_path(slug, lang, entry)
    title = escape(guide["title"])
    description = escape(guide["summary"])
    links = guide.get("links")
    if links:
        contact = next((href for _, href in reversed(links) if href.endswith("#contact")),
                       "/services/#contact" if lang == "en" else "/hr/#contact")
    else:
        service = GUIDE_SERVICES[slug]
        path = region_path(lang, locale, service)
        contact = path + "#contact"
        links = ((locale["services"][service]["label"], path), (locale["labels"]["enquiry"], contact))

    article = "".join(
        f'<section class="journal-block"><h2>{escape(heading)}</h2>'
        + "".join(f"<p>{escape(paragraph)}</p>" for paragraph in body.split("\n\n"))
        + "</section>"
        for heading, body in guide["sections"]
    )
    modified = entry.get("modified", "2026-11-12")
    published = entry.get("published", "2026-08-27") if lang in {"hr", "en"} else modified
    sources = guide.get("sources", entry["en"].get("sources", ()))
    source_markup = (
        f'<section class="journal-block guide-links"><h2>{sources_heading}</h2>'
        f'<ul>{guide_links(sources)}</ul></section>'
        if sources else ""
    )
    schema = {
        "@type": "Article",
        "headline": guide["title"],
        "description": guide["summary"],
        "inLanguage": locale["tag"],
        "url": url,
        "mainEntityOfPage": url,
        "datePublished": published,
        "dateModified": modified,
        "author": {"@type": "Organization", "name": "Ostrelya Studio", "url": origin + "/"},
    }
    body = f"""
    <article class="journal-article">
      <a class="journal-back" href="{guide_path(None, lang)}">← {all_guides}</a>
      <div class="journal-meta"><span>Ostrelya Studio</span><time datetime="{modified}">{modified}</time></div>
      <h1 class="editorial-heading">{title}</h1>
      <p class="content-intro">{description}</p>
      {language_links(slug, lang, entry, locales)}
      {article}
      <nav class="journal-block guide-links" aria-label="{related}">
        <h2>{related}</h2><ul>{guide_links(links)}</ul>
      </nav>
      {source_markup}
    </article>
    """
    return render_layout(root, origin, slug, lang, title, description, contact, body, locales, schema, entry)


def render_guide_index(root, origin, lang, guides, locales):
    title, description, headings, topics_label, *_ = LABELS[lang]
    groups = []
    topic_links = []
    for key, heading in zip(TOPICS, headings):
        cards = "".join(
            f'<a class="journal-card" href="{guide_path(slug, lang, guide)}"><div class="journal-card-copy">'
            f'<h3>{escape(guide[lang]["title"])}</h3><p>{escape(guide[lang]["summary"])}</p></div>'
            '<span class="journal-read" aria-hidden="true">↗</span></a>'
            for slug, guide in guides.items() if guide.get("topic", "planning") == key
        )
        if cards:
            groups.append(f'<section class="guide-group" id="{key}"><h2>{heading}</h2><div class="journal-list">{cards}</div></section>')
            topic_links.append(f'<a href="#{key}">{heading}</a>')
    body = f"""
    <header class="content-hero journal-hero">
      <h1 class="editorial-heading">{title}</h1>
      <p class="content-intro">{description}</p>
      {language_links(None, lang, None, locales)}
      <nav class="guide-topics" aria-label="{topics_label}">{"".join(topic_links)}</nav>
    </header>
    {"".join(groups)}
    """
    contact = "/services/#contact" if lang == "en" else f"/{lang}/#contact"
    return render_layout(root, origin, None, lang, title, description, contact, body, locales)


def render_layout(root, origin, slug, lang, title, description, contact, body, locales, schema=None, entry=None):
    locale = locales[lang]
    tag = locale["tag"]
    url = origin + guide_path(slug, lang, entry)
    alternates = "".join(
        f'<link rel="alternate" hreflang="{item["tag"]}" href="{origin + guide_path(slug, key, entry)}">\n  '
        for key, item in locales.items()
    )
    header, footer = site_chrome(root, regional=False, croatian=lang == "hr")
    header = header.replace('href="#contact"', f'href="{escape(contact)}"')
    footer = footer.replace('href="#contact"', f'href="{escape(contact)}"')
    footer = footer.replace('href="/privacy/', 'href="/privacy-policy/')
    footer = footer.replace('href="/hr/privatnost/', 'href="/hr/politika-privatnosti/')
    footer = footer.replace(" data-preview-privacy", "")
    if lang != "en":
        enquiry = escape(locale["labels"]["enquiry"])
        header = header.replace("<span>Let's talk</span>", f'<span lang="{tag}">{enquiry}</span>')
        header = header.replace('href="/hr/" class="nav-link"', f'href="/{lang}/" class="nav-link"')
        header = header.replace('href="/hr/" class="mobile-link"', f'href="/{lang}/" class="mobile-link"')
        header = header.replace('hreflang="hr">Region', f'hreflang="{tag}" lang="{tag}">{escape(locale["label"])}')
        footer = footer.replace('href="/hr/" lang="hr" hreflang="hr">Region / Hrvatski',
                                f'href="/{lang}/" lang="{tag}" hreflang="{tag}">{escape(locale["label"])}')
    structured_data = ""
    if schema:
        data = json.dumps({"@context": "https://schema.org", **schema}, ensure_ascii=False).replace("<", "\\u003c")
        structured_data = f'<script type="application/ld+json">{data}</script>'
    market = f' · {escape(locale["market"])}' if lang not in {"hr", "en"} else ""
    return f"""<!doctype html>
<html lang="{tag}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | Ostrelya Studio{market}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  {alternates}<link rel="alternate" hreflang="x-default" href="{origin + guide_path(slug, 'hr', entry)}">
  <meta property="og:type" content="{"article" if schema else "website"}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{origin}/assets/hero-metal-emblem.webp">
  {structured_data}
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=regional-guides">
  <script src="/script.js?v=service-paths" defer></script>
</head>
<body id="top" class="page-editorial">
  {header}
  <main id="main-content" class="page-container journal-shell">
    {body}
  </main>
  {footer}
</body>
</html>
"""
