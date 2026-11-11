from html import escape
import json


EXAMPLES = {
    "web": ("Orbit Architecture", "/assets/concepts/orbit.html", "/assets/project-4-640.webp", 640, 480),
    "redesign": ("Ostrelya Studio", "/#work", "/assets/hero-metal-emblem-640.webp", 640, 640),
    "brand": ("Solarium", "/assets/concepts/solarium.html", "/assets/project-1-640.webp", 640, 480),
}


def read_regions(root):
    return json.loads((root / "content/regional.json").read_bytes())


def region_path(key, region, service=None):
    return f"/{key}/{region['services'][service]['slug']}/" if service else f"/{key}/"


def region_routes(regions):
    return {
        region_path(key, region, service): (key, service)
        for key, region in regions.items()
        for service in (None, *region["services"])
    }


def language_suggestion(regions):
    options = [
        {"key": key, "lang": region["tag"], "href": region_path(key, region),
         "prompt": region["prompt"], "choose": region["choose"], "stay": region["stay"]}
        for key, region in regions.items()
    ]
    data = escape(json.dumps(options, ensure_ascii=False))
    return (
        f'<dialog class="locale-dialog" aria-labelledby="locale-prompt" data-locale-options="{data}" closedby="any">'
        '<img class="locale-dialog-mark" src="/assets/symbol-white-small.png" alt="" width="32" height="32">'
        '<h2 id="locale-prompt" tabindex="-1" autofocus></h2>'
        '<div class="locale-dialog-actions"><a class="locale-dialog-primary"></a>'
        '<button type="button" data-keep-english></button></div>'
        '<form method="dialog"><button class="locale-dialog-close" aria-label="Close" lang="en">'
        '<span aria-hidden="true">×</span></button></form></dialog>'
    )


def faq_details(questions):
    return "".join(
        f'<details class="service-accordion"><summary>{escape(question)}<span class="service-accordion-icon" aria-hidden="true"></span></summary>'
        f'<div class="service-accordion-body services-detail"><p>{escape(answer)}</p></div></details>'
        for question, answer in questions
    )


def croatian_web_main(service_links, markets):
    steps = (
        ("Struktura i sadržaj", "Popisujemo ključne stranice, raspoređujemo sadržaj i dogovaramo što posjetitelj treba napraviti na svakoj stranici."),
        ("Web dizajn i prototip", "Na klikabilnom prototipu pregledavamo izgled i put do upita na mobitelu i desktopu."),
        ("Razvoj, CMS i objava", "Izrađujemo web, povezujemo dogovoreni CMS i kontakt te provjeravamo brzinu, naslove, sitemap i preusmjerenja gdje su potrebna."),
        ("Primopredaja", "Prolazimo s vašim timom kako mijenjati tekst, fotografije ili članke te dogovaramo što obuhvaća podrška nakon objave."),
    )
    rows = "".join(
        f'<li><span aria-hidden="true">{index:02}</span><div><h3>{escape(name)}</h3><p>{escape(copy)}</p></div></li>'
        for index, (name, copy) in enumerate(steps, start=1)
    )
    questions = (
        ("Koliko košta izrada web stranice po mjeri?", "Cijena ovisi o broju različitih predložaka, jezicima, pripremi sadržaja i funkcijama kao što su CMS ili integracije. U upitu navedite što web treba raditi i što već imate. Nakon razgovora predlažemo opseg i ponudu."),
        ("Koliko traje izrada web stranice?", "Rok određujemo prema opsegu i dostupnosti sadržaja. U planu izdvajamo datume za prvi prototip, povratne informacije, testiranje i objavu, tako da znate kad trebamo vašu potvrdu."),
        ("Mogu li samostalno uređivati web?", "Da, ako u projekt uključimo CMS. Prije izrade dogovaramo koja polja vaš tim uređuje, primjerice tekst usluga, fotografije projekata ili članke. Na primopredaji prolazimo stvarni postupak objave."),
        ("Može li web imati više jezika i privlačiti kupce iz više zemalja?", "Da. Za svaki dogovoreni jezik planiramo zasebne adrese, lokalizirane naslove i sadržaj te poveznice među verzijama. Kod redizajna provjeravamo koje postojeće URL-ove treba sačuvati ili preusmjeriti."),
        ("Kako radite s klijentima iz drugih zemalja?", "Sastanke, pregled prototipa i primopredaju možemo voditi online. Za prvi razgovor pošaljite postojeći web ako ga imate, tržišta koja ciljate i što želite da posjetitelji naprave."),
    )
    faq = faq_details(questions)
    return f"""
      <section class="services-editorial-hero web-service-hero" aria-labelledby="web-service-title">
        <div class="page-container services-hero-layout">
          <div>
            <p class="services-kicker">Ostrelya Studio / Zagreb i regija</p>
            <h1 class="editorial-heading" id="web-service-title">Web dizajn i<br> izrada web<br> stranica<span>.</span></h1>
          </div>
          <div class="services-hero-aside">
            <p>Dizajniramo i izrađujemo web stranice po mjeri za tvrtke u Hrvatskoj i regiji. Od strukture i prototipa do razvoja, uređivanja sadržaja i objave.</p>
            <a class="btn-primary" href="#contact">Razgovarajmo o projektu <span aria-hidden="true">↗</span></a>
          </div>
          <nav class="services-hero-index" aria-label="Sadržaj stranice">
            <a href="#usluge"><span aria-hidden="true">01</span> Što dobivate <span aria-hidden="true">↘</span></a>
            <a href="#projekti"><span aria-hidden="true">02</span> Primjer rada <span aria-hidden="true">↘</span></a>
            <a href="#trzista"><span aria-hidden="true">03</span> Jezik i tržište <span aria-hidden="true">↘</span></a>
          </nav>
        </div>
      </section>
      <section id="usluge" class="page-container web-service-process">
        <div>
          <p class="services-kicker">01 / Opseg usluge</p>
          <h2 class="editorial-heading" data-editorial-reveal>Od prve skice<br>do objave.</h2>
          <p>Radimo poslovne webove, portfolije i stranice za pojedinačne usluge. Na početku dogovorimo kome se obraćate, koje informacije kupci trebaju prije upita i koji sadržaj vaš tim želi uređivati.</p>
        </div>
        <ol aria-label="Što dobivate">{rows}</ol>
      </section>
      <section id="projekti" class="page-container web-service-project">
        <a class="web-service-project-image" href="/assets/concepts/orbit.html" hreflang="en" aria-label="Otvori Orbit Architecture, studijski koncept na engleskom">
          <img src="/assets/project-4-640.webp" srcset="/assets/project-4-640.webp 640w, /assets/project-4-800.webp 800w, /assets/project-4-1200.webp 1200w" sizes="(max-width: 760px) 90vw, 46vw" width="640" height="480" alt="Kuća uz planinsko jezero iz koncepta Orbit Architecture" loading="lazy" decoding="async">
        </a>
        <div>
          <p class="services-kicker">02 / Studijski koncept</p>
          <h2 class="editorial-heading" data-editorial-reveal>Orbit<br>Architecture.</h2>
          <p>Za koncept arhitektonskog portfolija osmislili smo put od naslovne fotografije do detalja projekta. Posjetitelj može pregledati tlocrt, materijale i fotografije prostora prije nego što kontaktira studio.</p>
          <a class="web-service-text-link" href="/assets/concepts/orbit.html" hreflang="en">Otvori Orbit (EN) <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      {markets}
      <section class="services-disciplines web-service-faq" id="pitanja">
        <div class="page-container">
          <div class="services-section-head"><div><p class="services-kicker">04 / Prije upita</p><h2 class="editorial-heading" data-editorial-reveal>Česta pitanja.</h2></div>
          <p>Trošak, rok, uređivanje sadržaja i rad na više jezika.</p></div>
          <div class="service-accordions">{faq}</div>
        </div>
      </section>
      <section class="page-container region-services web-service-related">
        <p class="services-kicker">05 / Ostale usluge</p>
        <h2 class="editorial-heading" data-editorial-reveal>Imate web ili trebate<br>vizualni identitet?</h2>
        <div class="region-service-grid">{service_links}</div>
      </section>
    """


def site_chrome(root, *, regional=True, croatian=False):
    source = (root / "services.html").read_text(encoding="utf-8")
    header = source[source.index('<header class="site-header"'):source.index("</header>") + len("</header>")]
    footer = source[source.index('<footer class="editorial-footer"'):source.index("</footer>") + len("</footer>")]
    header = header.replace('<header ', '<header lang="en" ', 1)
    footer = footer.replace('<footer ', '<footer lang="en" ', 1)
    header = header.replace(' aria-current="page"', "").replace('nav-link active"', 'nav-link"')
    footer = footer.replace(' aria-current="page"', "")
    if regional:
        header = header.replace('href="/hr/"', 'href="#trzista"').replace(' hreflang="hr"', "")
        footer = footer.replace('href="/hr/" lang="hr" hreflang="hr">Region / Hrvatski', 'href="#trzista">Region')
    if croatian:
        footer = footer.replace('href="/privacy/">Privacy', 'href="/hr/privatnost/" lang="hr">Privatnost')
        footer = footer.replace('href="/privacy/#cookies">Cookies', 'href="/hr/privatnost/#kolacici" lang="hr">Kolačići')
    return header, footer


def render_region(root, origin, regions, key, service):
    region = regions[key]
    active = region["services"][service] if service else region
    lang = region["tag"]
    nav = region["nav"]
    labels = region["labels"]
    hub = region_path(key, region)
    path = region_path(key, region, service)
    headline = escape(active["title"])
    intro = escape(active["intro"])
    description = escape(active["meta_description"])
    canonical = escape(origin + path)
    market = escape(region["market"])
    title = escape(active["meta_title"])
    web_service_layout = key == "hr" and service == "web"
    social_image = EXAMPLES[service][2] if service else "/assets/hero-metal-emblem.webp"
    alternates = []
    switches = []
    for code, alternative in regions.items():
        alternate_url = region_path(code, alternative, service)
        tag = alternative["tag"]
        alternates.append(f'<link rel="alternate" hreflang="{tag}" href="{escape(origin + alternate_url)}">')
        current = ' aria-current="page"' if code == key else ""
        switches.append(
            f'<li><a href="{alternate_url}" lang="{tag}" hreflang="{tag}" data-locale="{code}"{current}>'
            f'<strong>{escape(alternative["label"])}</strong><span>{escape(alternative["language"])}</span></a></li>'
        )
    service_links = []
    for name, item in region["services"].items():
        if name != service:
            service_links.append(
                f'<a href="{region_path(key, region, name)}"><strong>{escape(item["label"])}</strong>'
                f'<p>{escape(item["intro"])}</p><span aria-hidden="true">↗</span></a>'
            )
    page_class = "page-services region-page region-web" if web_service_layout else "page-editorial region-page"
    header, footer = site_chrome(root, croatian=key == "hr")
    privacy_link = ('<a href="/hr/privatnost/#contact">Kako obrađujemo upite</a>' if key == "hr"
                    else '<a href="/privacy/#contact" lang="en">How we handle enquiries</a>')
    market_links = "".join(switches)
    markets = (
        '<section class="page-container region-market" id="trzista">'
        f'<p class="services-kicker">{"03 / Rad u regiji" if web_service_layout else escape(nav["languages"])}</p>'
        f'<h2 class="editorial-heading">{escape(nav["languages"])}.</h2>'
        + ('<p>Studio je u Zagrebu. S timovima iz regije radimo na daljinu, od prvog razgovora do primopredaje. Odaberite verziju ove usluge za svoje tržište.</p>' if web_service_layout else "")
        + f'<ul>{market_links}<li><a href="/?lang=en" lang="en" hreflang="en" data-locale="en"><strong>English</strong><span>International</span></a></li></ul></section>'
    )
    if web_service_layout:
        main = croatian_web_main("".join(service_links), markets)
    else:
        main = default_main(active, headline, intro, market, labels, nav, service, "".join(service_links)) + markets
        if service:
            main += (
                '<section class="page-container services-disciplines web-service-faq" id="pitanja">'
                f'<h2 class="editorial-heading">{escape(active["faq_heading"])}.</h2>'
                f'<div class="service-accordions">{faq_details(active["faq"])}</div></section>'
            )

    trail = [("Ostrelya Studio", "/"), (region["label"], hub)]
    if service:
        trail.append((active["label"], path))
    crumbs = "".join(f'<li><a href="{url}">{escape(name)}</a></li>' for name, url in trail[:-1])
    breadcrumbs = (
        f'<nav class="page-container region-breadcrumb" aria-label="{escape(nav["breadcrumb"])}">'
        f'<ol>{crumbs}<li aria-current="page">{escape(trail[-1][0])}</li></ol></nav>'
    )
    graph = [{
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": number, "name": name, "item": origin + url}
            for number, (name, url) in enumerate(trail, start=1)
        ],
    }]
    if service:
        areas = [entry["market"] for entry in regions.values()] if web_service_layout else [region["market"]]
        graph.append({
            "@type": "Service", "name": active["title"], "serviceType": active["label"],
            "url": origin + path, "description": active["meta_description"], "areaServed": areas,
            "provider": {"@type": "Organization", "name": "Ostrelya Studio", "url": origin + "/"},
        })
    structured_data = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("<", "\\u003c")

    return f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{canonical}">
  {"".join(alternates)}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Ostrelya Studio">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{escape(origin + social_image)}">
  <script type="application/ld+json">{structured_data}</script>
  <link rel="icon" type="image/png" href="/assets/symbol-dark-small.png">
  <link rel="stylesheet" href="/assets/regional-fonts.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=regional">
  <link rel="stylesheet" href="/assets/regional.css?v=4">
  <script src="/assets/region-language.js?v=9" defer></script>
  <script src="/script.js?v=clean-routes" defer></script>
</head>
<body id="top" class="{page_class}">
  {header}
  <main id="main-content">
    {breadcrumbs}
    {main}
    <section class="editorial-contact" id="contact" aria-labelledby="regional-contact-title">
      <div class="page-container">
        <p class="services-kicker">{escape(nav["contact"])}</p>
        <h2 class="editorial-heading" id="regional-contact-title" data-editorial-reveal>{escape(labels["contact"])}</h2>
        <p>{escape(labels["brief"])}</p>
        <div class="editorial-contact-links">
          <a href="mailto:hello@ostrelya.com?subject=Ostrelya%20Studio">{escape(labels["enquiry"])} <span aria-hidden="true">→</span></a>
          <a href="mailto:hello@ostrelya.com">hello@ostrelya.com <span aria-hidden="true">→</span></a>
        </div>
        <p data-preview-privacy class="regional-privacy-link">{privacy_link}</p>
      </div>
    </section>
  </main>
  {footer}
</body>
</html>
"""


def default_main(active, headline, description, market, labels, nav, service, service_links):
    if service:
        project, demo, cover, width, height = EXAMPLES[service]
        items = "".join(f"<li>{escape(item)}</li>" for item in active["deliverables"])
        project_type = f'<p class="services-kicker">{escape(labels["concept"])}</p>' if service != "redesign" else ""
        detail = f"""
        <section id="usluge" class="region-split">
          <div><p class="services-kicker">01 / {escape(labels["process"])}</p>
          <h2 class="editorial-heading">{escape(labels["process"])}</h2><p>{escape(active["process"])}</p></div>
          <div><h3>{escape(labels["deliverables"])}</h3><ul>{items}</ul></div>
        </section>
        <section class="region-split" id="projekti">
          <div><p class="services-kicker">02 / {escape(labels["example"])}</p>
          <h2 class="editorial-heading">{escape(project)}</h2>{project_type}<p>{escape(active["example"])}</p></div>
          <a class="region-cover" href="{demo}" lang="en" hreflang="en" aria-label="{escape(project)} (English)">
            <img src="{cover}" alt="" width="{width}" height="{height}" loading="lazy"><span aria-hidden="true">↗</span>
          </a>
        </section>"""
    else:
        detail = ""

    return f"""
    <div class="page-container">
      <section class="region-hero">
        <div><p class="services-kicker">Ostrelya Studio / {market}</p>
        <h1 class="editorial-heading">{headline}</h1>
        <p class="content-intro">{description}</p>
        <a class="btn-primary content-cta" href="#contact">{escape(labels["enquiry"])} <span aria-hidden="true">↗</span></a></div>
        <div class="region-emblem"><img src="/assets/hero-metal-emblem-640.webp" srcset="/assets/hero-metal-emblem-480.webp 480w, /assets/hero-metal-emblem-640.webp 640w" sizes="(max-width: 690px) 240px, 30vw" width="640" height="640" alt="" fetchpriority="high"></div>
      </section>
      {detail}
      <section class="region-services" id="{ 'ostale-usluge' if service else 'usluge' }">
        <p class="services-kicker">Ostrelya Studio</p>
        <h2 class="editorial-heading">{escape(labels["other"] if service else nav["services"])}</h2>
        <div class="region-service-grid">{service_links}</div>
      </section>
    </div>
"""
