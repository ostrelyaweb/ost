"""Render the existing bilingual guides with the studio's editorial layout."""

from html import escape
import json
from urllib.parse import quote

from regional_site import site_chrome


def guide_path(slug, lang, entry=None):
    prefix = "/en/blog" if lang == "en" else "/blog"
    if entry:
        slug = entry[lang].get("slug", slug)
    return prefix + "/" + quote(slug) if slug else prefix


def guide_links(links):
    return "".join(
        f'<li><a href="{escape(href)}">{escape(label)}</a></li>'
        for label, href in links
    )


def render_guide(root, origin, slug, lang, entry):
    croatian = lang == "hr"
    other = "en" if croatian else "hr"
    guide = entry[lang]
    url = origin + guide_path(slug, lang, entry)
    title = escape(guide["title"])
    description = escape(guide["summary"])
    contact = guide["links"][-1][1]
    if not contact.endswith("#contact"):
        contact = "/hr/#contact" if croatian else "/services/#contact"
    article = "".join(
        f'<section class="journal-block"><h2>{escape(heading)}</h2>'
        + "".join(f"<p>{escape(paragraph)}</p>" for paragraph in body.split("\n\n"))
        + "</section>"
        for heading, body in guide["sections"]
    )
    published = entry.get("published", "2026-08-27")
    modified = entry.get("modified", "2026-11-12")
    sources = guide.get("sources", ())
    source_markup = (
        f'<section class="journal-block guide-links"><h2>{"Izvori" if croatian else "Sources"}</h2>'
        f'<ul>{guide_links(sources)}</ul></section>'
        if sources else ""
    )
    schema = {
        "@type": "Article",
        "headline": guide["title"],
        "description": guide["summary"],
        "inLanguage": lang,
        "url": url,
        "mainEntityOfPage": url,
        "datePublished": published,
        "dateModified": modified,
        "author": {"@type": "Organization", "name": "Ostrelya Studio", "url": origin + "/"},
    }
    body = f"""
    <article class="journal-article">
      <a class="journal-back" href="{guide_path(None, lang)}">{"← Svi vodiči" if croatian else "← All guides"}</a>
      <div class="journal-meta">
        <span>Ostrelya Studio</span><time datetime="{modified}">{modified}</time>
        <a href="{guide_path(slug, other, entry)}" lang="{other}" hreflang="{other}">{"English" if croatian else "Hrvatski"}</a>
      </div>
      <h1 class="editorial-heading">{title}</h1>
      <p class="content-intro">{description}</p>
      {article}
      <nav class="journal-block guide-links" aria-label="{"Povezane stranice" if croatian else "Related pages"}">
        <h2>{"Povezane usluge i vodiči" if croatian else "Related services and guides"}</h2><ul>{guide_links(guide["links"])}</ul>
      </nav>
      {source_markup}
    </article>
    """
    return render_layout(root, origin, slug, lang, title, description, contact, body, schema, entry)


def render_guide_index(root, origin, lang, guides):
    croatian = lang == "hr"
    title = "Vodiči za web dizajn, razvoj i SEO" if croatian else "Web design, development and SEO guides"
    description = ("Planirajte izradu ili redizajn weba, odaberite CMS i provjerite kako kupci mogu pronaći vaše stranice."
                   if croatian else "Plan a new website or redesign, choose a CMS and check how customers can find your pages.")
    other = "en" if croatian else "hr"
    topics = (
        ("planning", "Izrada i redizajn" if croatian else "Build and redesign"),
        ("search", "SEO i AI pretraživanje" if croatian else "SEO and AI search"),
        ("operations", "Sadržaj i održavanje" if croatian else "Content and maintenance"),
    )
    groups = []
    topic_links = []
    for key, heading in topics:
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
      <a class="journal-back" href="{guide_path(None, other)}" lang="{other}" hreflang="{other}">{"English" if croatian else "Hrvatski"}</a>
      <h1 class="editorial-heading">{title}</h1>
      <p class="content-intro">{description}</p>
      <nav class="guide-topics" aria-label="{"Teme" if croatian else "Topics"}">{"".join(topic_links)}</nav>
    </header>
    {"".join(groups)}
    """
    return render_layout(root, origin, None, lang, title, description,
                         "/hr/#contact" if croatian else "/services/#contact", body)


def render_layout(root, origin, slug, lang, title, description, contact, body, schema=None, entry=None):
    url = origin + guide_path(slug, lang, entry)
    header, footer = site_chrome(root, regional=False, croatian=lang == "hr")
    header = header.replace('href="#contact"', f'href="{escape(contact)}"')
    footer = footer.replace('href="#contact"', f'href="{escape(contact)}"')
    footer = footer.replace('href="/privacy/', 'href="/privacy-policy/')
    footer = footer.replace('href="/hr/privatnost/', 'href="/hr/politika-privatnosti/')
    footer = footer.replace(" data-preview-privacy", "")
    if lang == "hr":
        header = header.replace("<span>Let's talk</span>", '<span lang="hr">Pošaljite upit</span>')
    structured_data = ""
    if schema:
        data = json.dumps({"@context": "https://schema.org", **schema}, ensure_ascii=False).replace("<", "\\u003c")
        structured_data = f'<script type="application/ld+json">{data}</script>'
    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | Ostrelya Studio</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  <link rel="alternate" hreflang="hr" href="{origin + guide_path(slug, 'hr', entry)}">
  <link rel="alternate" hreflang="en" href="{origin + guide_path(slug, 'en', entry)}">
  <link rel="alternate" hreflang="x-default" href="{origin + guide_path(slug, 'hr', entry)}">
  <meta property="og:type" content="{"article" if schema else "website"}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{origin}/assets/hero-metal-emblem.webp">
  {structured_data}
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=guide-topics">
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
