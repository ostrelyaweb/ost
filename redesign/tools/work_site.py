"""Render the studio's portfolio index and case studies."""

from html import escape
import json
from urllib.parse import quote

from regional_site import site_chrome


WORK_INDEX = "/work/"


def read_projects(root):
    return json.loads((root / "content/portfolio.json").read_bytes())


def work_routes(projects):
    return {WORK_INDEX: None, **{work_url(project): project for project in projects}}


def work_url(project):
    return f'{WORK_INDEX}{project["slug"]}/'


def cover_markup(media, *, eager=False, sizes="(max-width: 760px) 90vw, 31vw"):
    path, alt, width, height, *small = media
    source = "/assets/" + quote(path)
    responsive = ""
    if small:
        responsive = (
            f' srcset="/assets/{quote(small[0])} 640w, {source} {width}w"'
            f' sizes="{sizes}"'
        )
    loading = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return f'<img src="{source}"{responsive} alt="{escape(alt)}" width="{width}" height="{height}" {loading}>'


def arrow_link(label, href, *, primary=False):
    button = " portfolio-button-primary" if primary else ""
    return f'<a class="portfolio-button{button}" href="{escape(href)}">{escape(label)} <span aria-hidden="true">↗</span></a>'


def project_tile(project):
    return f"""
    <article class="portfolio-tile">
      <a class="portfolio-tile-link" href="{work_url(project)}">
        <div class="portfolio-tile-image">{cover_markup(project["cover"])}</div>
        <div class="portfolio-tile-heading">
          <div><p class="portfolio-label">{escape(project["category"])}</p>
          <h3>{escape(project["name"])}</h3></div>
          <span class="portfolio-tile-arrow" aria-hidden="true">↗</span>
        </div>
        <p class="portfolio-tile-summary">{escape(project["summary"])}</p>
      </a>
    </article>
    """


def index_markup(projects):
    featured, *other_projects = projects
    return f"""
    <section class="portfolio-index-intro page-container">
      <div class="portfolio-index-copy">
        <p class="portfolio-label">Ostrelya Studio / Portfolio</p>
        <h1>Selected<br>work<span>.</span></h1>
        <p>Websites, identities and interactive prototypes built by Ostrelya. Explore what we made and try it for yourself.</p>
        <a class="portfolio-back" href="#portfolio-more-title">More studio concepts ↓</a>
      </div>
      <a class="portfolio-feature" href="{work_url(featured)}">
        <div class="portfolio-feature-image">{cover_markup(featured["cover"], eager=True, sizes="(max-width: 760px) 90vw, 49vw")}</div>
        <div class="portfolio-feature-caption">
          <div><p class="portfolio-label">Studio concept / {escape(featured["category"])}</p><h2>{escape(featured["name"])}</h2>
          <p>{escape(featured["summary"])}</p></div>
          <span class="portfolio-tile-arrow" aria-hidden="true">↗</span>
        </div>
      </a>
    </section>
    <section class="page-container portfolio-index-more" aria-labelledby="portfolio-more-title">
      <h2 id="portfolio-more-title">Studio concepts</h2>
      <div class="portfolio-grid">{"".join(map(project_tile, other_projects))}</div>
    </section>
    <section class="page-container portfolio-studio" aria-labelledby="portfolio-studio-title">
      <div><p class="portfolio-label">Live studio site</p><h2 id="portfolio-studio-title">Ostrelya.com</h2></div>
      <div><p>We designed and built the site you’re on. See how its loading sequence moves into the navigation, and how the same site serves seven regional editions.</p>
      <div class="portfolio-actions">{arrow_link("Read the build notes", "/journal/from-loading-bar-to-navbar/")}{arrow_link("See the regional site", "/hr/")}</div></div>
    </section>
    """


def project_markup(project, projects):
    name = escape(project["name"])
    decisions = "".join(
        f"<li><h3>{escape(heading)}</h3><p>{escape(body)}</p></li>"
        for heading, body in project["decisions"]
    )
    evidence = ""
    if media := project.get("evidence"):
        evidence = (
            '<figure class="portfolio-figure portfolio-evidence">'
            f'{cover_markup(media, sizes="(max-width: 950px) 90vw, 864px")}<figcaption>{escape(project["evidence_caption"])}</figcaption></figure>'
        )
    elif palette := project.get("palette"):
        swatches = "".join(
            f'<li><span style="background:{escape(colour)}" aria-hidden="true"></span>'
            f'<strong>{escape(label)}</strong> <small>{escape(colour)}</small></li>'
            for label, colour in palette
        )
        evidence = f'<ul class="portfolio-palette" aria-label="Solarium identity palette">{swatches}</ul>'
    actions = arrow_link(project["demo_label"], project["demo"], primary=True)
    if related := project.get("related"):
        actions += arrow_link(*related)
    index = projects.index(project)
    following = projects[(index + 1) % len(projects)]
    credits = "".join(
        f' · <a href="{escape(href)}">{escape(label)}</a>'
        for label, href in project.get("cover_credits", ())
    )
    return f"""
    <article>
      <header class="page-container portfolio-case-intro">
        <a class="portfolio-back" href="/work/">← Selected work</a>
        <div class="portfolio-case-title">
          <div><p class="portfolio-label">Studio concept / {escape(project["category"])}</p><h1>{name}<span>.</span></h1></div>
          <div><p>{escape(project["summary"])}</p><div class="portfolio-actions">{actions}</div></div>
        </div>
      </header>
      <div class="page-container">
        <figure class="portfolio-figure portfolio-case-cover">{cover_markup(project["cover"], eager=True, sizes="(max-width: 1440px) 91vw, 1296px")}
          <figcaption>{escape(project["cover_caption"])}{credits}</figcaption>
        </figure>
        <section class="portfolio-case-section portfolio-brief">
          <div><h2>The brief</h2><p>{escape(project["brief"])}</p></div>
          <div><p class="portfolio-label">Ostrelya’s scope</p><p>{escape(project["scope"])}</p>
          <a class="portfolio-back" href="{escape(project["service"][1])}">{escape(project["service"][0])} ↗</a></div>
        </section>
        <section class="portfolio-case-section portfolio-decisions" aria-labelledby="design-decisions">
          <h2 id="design-decisions">Design decisions</h2><ol>{decisions}</ol>
        </section>
        {evidence}
        <section class="portfolio-case-section portfolio-brief">
          <div><h2>Try the prototype</h2><p>{escape(project["note"])}</p></div>
          <div class="portfolio-actions">{actions}</div>
        </section>
        <a class="portfolio-next" href="{work_url(following)}">
          <span class="portfolio-label">Next project</span><strong>{escape(following["name"])}</strong>
          <span class="portfolio-tile-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
    """


def render_work(root, origin, path, project, projects):
    header, footer = site_chrome(root, regional=False)
    if not project:
        header = header.replace('href="/work/" class="nav-link"', 'href="/work/" class="nav-link active" aria-current="page"')
        header = header.replace('href="/work/" class="mobile-link"', 'href="/work/" class="mobile-link" aria-current="page"')
    title = f'{project["name"]} — Studio Concept | Ostrelya' if project else "Selected Work & Studio Concepts | Ostrelya"
    summary = project["summary"] if project else "Explore Ostrelya’s web design, visual identity and interactive prototypes, from architecture portfolios to 3D product configurators."
    image = "/assets/" + quote((project or projects[0])["cover"][0])
    canonical = origin + path
    organization = {"@type": "Organization", "name": "Ostrelya Studio", "url": origin + "/"}
    schema = (
        {"@type": "CreativeWork", "name": project["name"], "description": summary,
         "url": canonical, "image": origin + image, "creator": organization}
        if project else
        {"@type": "CollectionPage", "name": "Selected Work", "url": canonical,
         "mainEntity": {"@type": "ItemList", "itemListElement": [
             {"@type": "ListItem", "position": index, "name": item["name"], "url": origin + work_url(item)}
             for index, item in enumerate(projects, start=1)
         ]}}
    )
    data = json.dumps({"@context": "https://schema.org", **schema}, ensure_ascii=False).replace("<", "\\u003c")
    main = project_markup(project, projects) if project else index_markup(projects)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(summary)}">
  <link rel="canonical" href="{escape(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Ostrelya Studio">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(summary)}">
  <meta property="og:url" content="{escape(canonical)}">
  <meta property="og:image" content="{escape(origin + image)}">
  <script type="application/ld+json">{data}</script>
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=regional-services">
  <link rel="stylesheet" href="/assets/portfolio.css?v=1">
  <script src="/script.js?v=regional-services" defer></script>
</head>
<body id="top" class="portfolio-page">
  {header}
  <main id="main-content">
    {main}
    <section class="page-container portfolio-contact" id="contact">
      <h2>Have a project in mind?</h2>
      {arrow_link("Tell us about it", "/#contact", primary=True)}
    </section>
  </main>
  {footer}
</body>
</html>
"""
