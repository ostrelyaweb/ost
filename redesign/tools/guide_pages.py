"""Render guides, topic indexes and language alternatives."""

from html import escape
import json

from regional_site import region_path, site_chrome
from guide_routes import GUIDE_SERVICES, guide_path


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
        "Practical guides for planning a website or redesign, choosing a CMS, checking Google visibility and maintaining the site after launch.",
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
        "Vodiči za izradu i redizajn sajta u Srbiji. Uporedite ponude, odaberite CMS i proverite kako kupci pronalaze vaše stranice na Google-u.",
        ("Izrada i redizajn", "SEO i AI pretraga", "Sadržaj i održavanje"),
        "Teme", "Jezik i tržište", "Svi vodiči", "Povezane usluge i vodiči", "Izvori",
    ),
    "sr-me": (
        "Vodiči za izradu sajtova i SEO u Crnoj Gori",
        "Vodiči za izradu i redizajn sajta u Crnoj Gori. Uporedite ponude, odaberite CMS i provjerite kako kupci pronalaze vaše stranice na Googleu.",
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
CONTENTS_LABELS = {
    "hr": "U ovom vodiču", "en": "In this guide", "bs": "U ovom vodiču",
    "sr-rs": "U ovom vodiču", "sr-me": "U ovom vodiču", "sl": "V tem vodniku",
    "mk": "Во овој водич", "sq": "Në këtë udhëzues",
}
RELATED_GUIDES = {
    "koliko-košta-web-stranica-2026": ("što-znati-prije-kupnje-web-stranice", "održavanje-web-stranice-zašto-je-bitno"),
    "što-znati-prije-kupnje-web-stranice": ("koliko-košta-web-stranica-2026", "treba-li-web-stranici-cms"),
    "održavanje-web-stranice-zašto-je-bitno": ("što-znati-prije-kupnje-web-stranice", "zasto-web-stranica-nije-na-googleu"),
    "redizajn-web-stranice-bez-gubitka-seo": ("zasto-web-stranica-nije-na-googleu", "plan-visejezicne-web-stranice"),
    "zasto-web-stranica-nije-na-googleu": ("redizajn-web-stranice-bez-gubitka-seo", "kako-da-se-web-pojavi-u-ai-pretrazivanju"),
    "kako-da-se-web-pojavi-u-ai-pretrazivanju": ("zasto-web-stranica-nije-na-googleu",),
    "treba-li-web-stranici-cms": ("što-znati-prije-kupnje-web-stranice", "održavanje-web-stranice-zašto-je-bitno"),
    "plan-visejezicne-web-stranice": ("treba-li-web-stranici-cms", "redizajn-web-stranice-bez-gubitka-seo"),
}


def example_table(table):
    caption = escape(table["caption"])
    columns = "".join(f'<th scope="col">{escape(column)}</th>' for column in table["columns"])
    rows = "".join(
        f'<tr><th scope="row">{escape(label)}</th>' +
        "".join(f"<td>{escape(cell)}</td>" for cell in cells) + "</tr>"
        for label, *cells in table["rows"]
    )
    return (
        f'<div class="guide-table-wrap" id="guide-example" role="region" tabindex="0" aria-label="{caption}">'
        f'<table class="guide-table"><caption>{caption}</caption>'
        f'<thead><tr>{columns}</tr></thead><tbody>{rows}</tbody></table></div>'
    )

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


def render_guide(root, origin, slug, lang, entry, locales, guides):
    _, _, _, _, _, all_guides, related, sources_heading = LABELS[lang]
    locale = locales[lang]
    guide = entry[lang]
    url = origin + guide_path(slug, lang, entry)
    title = escape(guide["title"])
    summary = escape(guide["summary"])
    description = escape(guide.get("meta_description", guide["summary"]))
    links = guide.get("links")
    if links:
        contact = next((href for _, href in reversed(links) if href.endswith("#contact")),
                       "/services/#contact" if lang == "en" else "/hr/#contact")
    else:
        service = GUIDE_SERVICES[slug]
        path = region_path(lang, locale, service)
        contact = path + "#contact"
        links = ((locale["services"][service]["label"], path), (locale["labels"]["enquiry"], contact))

    guide_links_in_locale = tuple(
        (guides[key][lang]["title"], guide_path(key, lang, guides[key])) for key in RELATED_GUIDES[slug]
    )
    contents_label = CONTENTS_LABELS[lang]
    contents = []
    sections = []
    for index, (heading, body) in enumerate(guide["sections"], start=1):
        anchor = f"section-{index}"
        contents.append((heading, f"#{anchor}"))
        paragraphs = "".join(f"<p>{escape(p)}</p>" for p in body.split("\n\n"))
        sections.append(f'<section class="journal-block" id="{anchor}"><h2>{escape(heading)}</h2>{paragraphs}</section>')
    if table := guide.get("table"):
        sections.append(example_table(table))
        contents.append((table["caption"], "#guide-example"))
    case_markup = ""
    if case := guide.get("migration_case"):
        download = root / "assets" / "resources" / "redirect-map.csv"
        if not download.is_file():
            raise ValueError(f"Missing migration template: {download}")
        download_path = "/" + download.relative_to(root).as_posix()
        paragraphs = "".join(f"<p>{escape(paragraph)}</p>" for paragraph in case["paragraphs"])
        case_markup = (
            '<section class="journal-block guide-links" id="ostrelya-migration">'
            f'<h2>{escape(case["title"])}</h2>{paragraphs}'
            f'<p><a href="{escape(download_path)}" download>{escape(case["download_label"])}</a></p>'
            '</section>'
        )
    modified = entry.get("modified", "2026-11-12")
    published = (entry.get("published", "2026-08-27") if lang in {"hr", "en"}
                 else entry.get("regional_published", "2026-11-12"))
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
      <p class="content-intro">{summary}</p>
      {language_links(slug, lang, entry, locales)}
      <nav class="journal-block guide-links" aria-label="{contents_label}">
        <h2>{contents_label}</h2><ol>{guide_links(contents)}</ol>
      </nav>
      {"".join(sections)}
      {case_markup}
      <nav class="journal-block guide-links" aria-label="{related}">
        <h2>{related}</h2><ul>{guide_links((*links, *guide_links_in_locale))}</ul>
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
    search_title = escape(entry[lang]["meta_title"]) if entry and "meta_title" in entry[lang] else title
    return f"""<!doctype html>
<html lang="{tag}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{search_title} | Ostrelya</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  {alternates}<link rel="alternate" hreflang="x-default" href="{origin + guide_path(slug, 'en', entry)}">
  <meta property="og:type" content="{"article" if schema else "website"}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{origin}/assets/hero-metal-emblem.webp">
  <meta name="twitter:card" content="summary_large_image">
  {structured_data}
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=reading-guides">
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
