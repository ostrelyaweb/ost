from html import escape
import json
from urllib.parse import quote


PRICE_GUIDE = "/blog/" + quote("koliko-košta-web-stranica-2026")
MAINTENANCE_GUIDE = "/blog/" + quote("održavanje-web-stranice-zašto-je-bitno")
GUIDE_INDEX_LABELS = {
    "hr": "Vodiči za web dizajn, razvoj i SEO",
    "bs": "Vodiči za izradu web stranica i SEO",
    "sr-rs": "Vodiči za izradu sajtova i SEO",
    "sr-me": "Vodiči za izradu sajtova i SEO",
    "sl": "Vodniki za izdelavo spletnih strani in SEO",
    "mk": "Водичи за изработка на веб-страници и SEO",
    "sq": "Udhëzues për krijimin e faqeve dhe SEO",
}
SERVICE_GUIDE_TOPICS = {
    "web": "#planning", "redesign": "#planning", "brand": "#planning",
    "development": "#operations", "seo": "#search", "maintenance": "#operations",
}
SERVICE_GUIDES_HR = {
    "redesign": (("Pripremite URL-ove prije redizajna", "/blog/redizajn-web-stranice-bez-gubitka-seo"),),
    "development": (
        ("Odlučite što vaš tim treba uređivati u CMS-u", "/blog/treba-li-web-stranici-cms"),
        ("Planirajte višejezični web", "/blog/plan-visejezicne-web-stranice"),
    ),
    "seo": (
        ("Provjerite zašto stranica izostaje iz Googleovih rezultata", "/blog/zasto-web-stranica-nije-na-googleu"),
        ("Pripremite sadržaj za AI pretraživanje", "/blog/kako-da-se-web-pojavi-u-ai-pretrazivanju"),
    ),
    "maintenance": (("Mjesečna provjera web stranice", MAINTENANCE_GUIDE),),
}


EXAMPLES = {
    "web": ("Orbit Architecture", "/work/orbit-architecture/", "/assets/project-4-640.webp", 640, 480),
    "redesign": ("Ostrelya Studio", "/#work", "/assets/hero-metal-emblem-640.webp", 640, 640),
    "brand": ("Solarium", "/work/solarium/", "/assets/project-1-640.webp", 640, 480),
    "development": ("Orbit Architecture", "/work/orbit-architecture/", "/assets/project-4-640.webp", 640, 480),
    "seo": ("Ostrelya Studio", "/journal/website-launch-and-maintenance/", None, 0, 0),
    "maintenance": ("Ostrelya Studio", "/journal/website-launch-and-maintenance/#maintenance-checklist", None, 0, 0),
}

ENQUIRY_COPY = {
    "hr": ("Ime", "Adresa e-pošte", "Što vam treba?", "Pošalji upit", "Šaljemo upit…", "Upit je poslan. Odgovorit ćemo na adresu koju ste unijeli.", "Upit nije poslan. Pokušajte ponovno ili pišite na hello@ostrelya.com.", "Pričekajte minutu prije ponovnog pokušaja."),
    "bs": ("Ime", "E-mail adresa", "Šta vam treba?", "Pošalji upit", "Šaljemo upit…", "Upit je poslan. Odgovorit ćemo na adresu koju ste unijeli.", "Upit nije poslan. Pokušajte ponovo ili pišite na hello@ostrelya.com.", "Sačekajte minutu prije ponovnog pokušaja."),
    "sr-rs": ("Ime", "Imejl adresa", "Šta vam je potrebno?", "Pošalji upit", "Šaljemo upit…", "Upit je poslat. Odgovorićemo na adresu koju ste uneli.", "Upit nije poslat. Pokušajte ponovo ili pišite na hello@ostrelya.com.", "Sačekajte minut pre ponovnog pokušaja."),
    "sr-me": ("Ime", "Adresa e-pošte", "Šta vam je potrebno?", "Pošalji upit", "Šaljemo upit…", "Upit je poslat. Odgovorićemo na adresu koju ste unijeli.", "Upit nije poslat. Pokušajte ponovo ili pišite na hello@ostrelya.com.", "Sačekajte minut prije ponovnog pokušaja."),
    "sl": ("Ime", "E-poštni naslov", "Kaj potrebujete?", "Pošlji povpraševanje", "Pošiljamo povpraševanje…", "Povpraševanje je poslano. Odgovorili bomo na vneseni e-poštni naslov.", "Povpraševanje ni bilo poslano. Poskusite znova ali pišite na hello@ostrelya.com.", "Pred ponovnim poskusom počakajte minuto."),
    "mk": ("Име", "Е-пошта", "Што ви треба?", "Испрати барање", "Го испраќаме барањето…", "Барањето е испратено. Ќе одговориме на внесената адреса.", "Барањето не е испратено. Обидете се повторно или пишете на hello@ostrelya.com.", "Почекајте една минута пред повторно да се обидете."),
    "sq": ("Emri", "Adresa e emailit", "Çfarë ju nevojitet?", "Dërgo kërkesën", "Po dërgojmë kërkesën…", "Kërkesa u dërgua. Do t’ju përgjigjemi në adresën që vendosët.", "Kërkesa nuk u dërgua. Provoni përsëri ose shkruani në hello@ostrelya.com.", "Prisni një minutë para se të provoni përsëri."),
}


def regional_enquiry(key, *, seo_review=False):
    name, email, message, submit, pending, success, failure, rate = map(escape, ENQUIRY_COPY[key])
    website = ""
    fields = f'<label>{message}<textarea name="message" rows="4" required maxlength="1500"></textarea></label>'
    if seo_review:
        website = """
        <label>Javni URL web stranice
          <input name="website" type="text" inputmode="url" autocomplete="url" autocapitalize="none" spellcheck="false"
                 placeholder="vasa-domena.hr" required maxlength="500" aria-describedby="seo-url-hint">
        </label>
        <small id="seo-url-hint">Možete unijeti adresu sa ili bez https://.</small>
        """
        fields = """
        <label>Što želite provjeriti? (neobavezno)
          <textarea name="message" rows="4" maxlength="950"></textarea>
        </label>
        """
        submit = "Pošaljite URL za SEO pregled"
    return f"""
    <form method="post" action="/api/enquiry" data-enquiry-form data-locale="{key}" hidden
          data-pending="{pending}" data-success="{success}" data-failure="{failure}" data-rate="{rate}">
      <input type="text" name="companyWebsite" hidden tabindex="-1" autocomplete="off">
      {website}
      <label>{name}<input name="name" autocomplete="name" required maxlength="100"></label>
      <label>{email}<input name="email" type="email" autocomplete="email" required maxlength="160"></label>
      {fields}
          <p role="status"></p>
      <button type="submit" class="btn-primary">{submit} <span aria-hidden="true">↗</span></button>
    </form>
    """


def read_regions(root):
    regions = json.loads((root / "content/regional.json").read_bytes())
    additional = json.loads((root / "content/regional-web-services.json").read_bytes())
    if additional.keys() != regions.keys():
        raise ValueError("Regional web services must cover every market.")
    for key, services in additional.items():
        if set(services) != {"development", "seo", "maintenance"}:
            raise ValueError(f"Incomplete web services for {key}")
        regions[key]["services"].update(services)
    return regions


def region_path(key, region, service=None):
    return f"/{key}/{region['services'][service]['slug']}/" if service else f"/{key}/"


def region_routes(regions):
    return {
        region_path(key, region, service): (key, service)
        for key, region in regions.items()
        for service in (None, *region["services"])
    }


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
            <p class="services-kicker">Ostrelya Studio / Hrvatska i regija</p>
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
        <a class="web-service-project-image" href="/work/orbit-architecture/" hreflang="en" aria-label="Otvori Orbit Architecture, studijski koncept na engleskom">
          <img src="/assets/project-4-640.webp" srcset="/assets/project-4-640.webp 640w, /assets/project-4-800.webp 800w, /assets/project-4-1200.webp 1200w" sizes="(max-width: 760px) 90vw, 46vw" width="640" height="480" alt="Kuća uz planinsko jezero iz koncepta Orbit Architecture" loading="lazy" decoding="async">
        </a>
        <div>
          <p class="services-kicker">02 / Studijski koncept</p>
          <h2 class="editorial-heading" data-editorial-reveal>Orbit<br>Architecture.</h2>
          <p>Za koncept arhitektonskog portfolija osmislili smo put od naslovne fotografije do detalja projekta. Posjetitelj može pregledati tlocrt, materijale i fotografije prostora prije nego što kontaktira studio.</p>
          <a class="web-service-text-link" href="/work/orbit-architecture/" hreflang="en">Pogledajte studiju Orbit (EN) <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      {markets}
      <section class="services-disciplines web-service-faq" id="pitanja">
        <div class="page-container">
          <div class="services-section-head"><div><p class="services-kicker">04 / Prije upita</p><h2 class="editorial-heading" data-editorial-reveal>Česta pitanja.</h2></div>
          <p>Trošak, rok, uređivanje sadržaja i rad na više jezika.</p></div>
          <div class="service-accordions">{faq}</div>
          <p class="region-guide-link"><a class="web-service-text-link" href="{PRICE_GUIDE}">Pročitajte vodič o cijeni izrade web stranice <span aria-hidden="true">↗</span></a></p>
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


def croatian_seo_main(headline, intro, active, service_links, markets):
    checks = (
        ("Dostupnost i indeksiranje", "Provjeravamo važne URL-ove, sitemap, preusmjerenja i kanonske adrese. Uz pristup Search Consoleu pregledamo kako Google vidi odabrane stranice."),
        ("Upiti i odredišne stranice", "Uspoređujemo što kupci traže s naslovima, sadržajem i internim poveznicama. Izdvajamo stranice koje treba doraditi i teme koje traže zasebnu stranicu."),
        ("Plan popravaka", "Uz svaki nalaz dobivate pogođene URL-ove, prioritet, prijedlog izmjene i način provjere. Ako dogovorimo provedbu, ponavljamo provjere nakon objave."),
    )
    check_items = "".join(
        f'<li><h3>{escape(heading)}</h3><p>{escape(copy)}</p></li>' for heading, copy in checks
    )
    guides = "".join(
        f'<li><a class="web-service-text-link" href="{href}">{escape(label)} <span aria-hidden="true">↗</span></a></li>'
        for label, href in SERVICE_GUIDES_HR["seo"]
    )
    return f"""
    <section class="services-editorial-hero web-service-hero" aria-labelledby="seo-offer-title">
      <div class="page-container services-hero-layout">
        <div>
          <p class="services-kicker">Ostrelya Studio / Hrvatska</p>
          <h1 class="editorial-heading" id="seo-offer-title">{headline}<span>.</span></h1>
        </div>
        <div class="services-hero-aside">
          <p>{intro}</p>
          <a class="btn-primary" href="#contact">Pošaljite URL za SEO pregled <span aria-hidden="true">↗</span></a>
        </div>
        <nav class="guide-topics seo-offer-nav" aria-label="Sadržaj SEO ponude">
          <a href="#usluge">Što pregled obuhvaća</a>
          <a href="#projekti">Primjer nalaza</a>
          <a href="#pitanja">Česta pitanja</a>
        </nav>
      </div>
    </section>
    <div class="page-container">
      <section class="region-split seo-offer-section" id="usluge" aria-labelledby="seo-scope-title">
        <div>
          <h2 class="editorial-heading" id="seo-scope-title">Što pregled obuhvaća</h2>
          <p>Počinjemo sa stranicama koje bi trebale dovoditi kupce. Ako pripremate redizajn, popisujemo postojeće adrese koje vrijedi zadržati ili preusmjeriti.</p>
        </div>
        <ol class="seo-offer-checks">{check_items}</ol>
      </section>
      <section class="region-split seo-offer-section" id="projekti" aria-labelledby="seo-example-title">
        <div>
          <h2 class="editorial-heading" id="seo-example-title">Kako izgleda nalaz</h2>
          <p>Iz pregleda Ostrelyina weba od <time datetime="2026-11-13">13. studenoga 2026.</time> Provjerili smo 132 adrese iz sitemapa i uobičajene varijante starih URL-ova.</p>
          <a class="web-service-text-link" href="/blog/redizajn-web-stranice-bez-gubitka-seo">Pročitajte vodič o preusmjerenjima <span aria-hidden="true">↗</span></a>
        </div>
        <article class="seo-offer-sample">
          <h3>Stara adresa vodiča vraćala je privremeni 307</h3>
          <dl>
            <dt>URL</dt><dd><a href="/blog/koliko-ko%C5%A1ta-web-stranica-2026.html">/blog/koliko-košta-web-stranica-2026.html</a></dd>
            <dt>Prioritet</dt><dd>Srednji. Stara adresa već je vodila čitatelja na vodič, ali je odgovor označavao preseljenje kao privremeno.</dd>
            <dt>Izmjena</dt><dd>Stare .html adrese i varijante sa završnom kosom crtom sada trajno preusmjeravamo na kanonski URL. Tako preusmjerenje i sitemap upućuju na istu adresu.</dd>
            <dt>Provjera</dt><dd>Stara adresa vraća 301 u jednom koraku. <a href="/blog/koliko-ko%C5%A1ta-web-stranica-2026">Odredišni vodič</a> vraća 200 i navodi vlastiti URL kao kanonski.</dd>
          </dl>
        </article>
      </section>
      <section class="region-split seo-offer-section" id="pitanja" aria-labelledby="seo-faq-title">
        <div>
          <h2 class="editorial-heading" id="seo-faq-title">{escape(active["faq_heading"])}</h2>
          <ul class="seo-offer-guides">{guides}</ul>
        </div>
        <div class="service-accordions web-service-faq">{faq_details(active["faq"])}</div>
      </section>
    </div>
    {markets}
    <section class="page-container region-services" id="ostale-usluge">
      <h2 class="editorial-heading">Ostale usluge</h2>
      <div class="region-service-grid">{service_links}</div>
    </section>
    """


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
    seo_offer_layout = key == "hr" and service == "seo"
    social_image = (EXAMPLES[service][2] if service else None) or "/assets/hero-metal-emblem.webp"
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
    page_class = "page-services region-page region-web" if web_service_layout or seo_offer_layout else "page-editorial region-page"
    header, footer = site_chrome(root, croatian=key == "hr")
    header = header.replace('>Region</a>', f' lang="{lang}">{escape(nav["languages"])}</a>')
    header = header.replace("<span>Let's talk</span>", f'<span lang="{lang}">{escape(labels["enquiry"])}</span>')
    privacy_link = ('<a href="/hr/politika-privatnosti/#privacy-contact">Kako obrađujemo upite</a>' if key == "hr"
                    else '<a href="/privacy-policy/#privacy-contact" lang="en">How we handle enquiries</a>')
    market_links = "".join(switches)
    guide_index = "/blog" if key == "hr" else f"/{key}/blog"
    guide_index += SERVICE_GUIDE_TOPICS.get(service, "")
    markets = (
        '<section class="page-container region-market" id="trzista">'
        f'<p class="services-kicker">{"03 / Rad u regiji" if web_service_layout else escape(nav["languages"])}</p>'
        f'<h2 class="editorial-heading">{escape(nav["languages"])}.</h2>'
        + ('<p>S timovima iz Hrvatske i regije radimo na daljinu, od prvog razgovora do primopredaje. Odaberite verziju ove usluge za svoje tržište.</p>' if web_service_layout else "")
        + f'<ul>{market_links}<li><a href="{"/services/" if service else "/?lang=en"}" lang="en" hreflang="en" data-locale="en"><strong>English</strong><span>{"Services overview" if service else "International"}</span></a></li></ul>'
        f'<p class="region-guide-link"><a class="web-service-text-link" href="{guide_index}">{escape(GUIDE_INDEX_LABELS[key])} <span aria-hidden="true">↗</span></a></p></section>'
    )
    if web_service_layout:
        main = croatian_web_main("".join(service_links), markets)
    elif seo_offer_layout:
        main = croatian_seo_main(headline, intro, active, "".join(service_links), markets)
    else:
        main = default_main(active, headline, intro, market, labels, nav, service, "".join(service_links)) + markets
        if service:
            guide_links = "".join(
                f'<p class="region-guide-link"><a class="web-service-text-link" href="{href}">{escape(label)} <span aria-hidden="true">↗</span></a></p>'
                for label, href in SERVICE_GUIDES_HR.get(service, ())
            ) if key == "hr" else ""
            main += (
                '<section class="page-container services-disciplines web-service-faq" id="pitanja">'
                f'<h2 class="editorial-heading">{escape(active["faq_heading"])}.</h2>'
                f'<div class="service-accordions">{faq_details(active["faq"])}</div>{guide_links}</section>'
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

    contact_title = "Pošaljite URL za SEO pregled" if seo_offer_layout else escape(labels["contact"])
    contact_brief = (
        "Unesite javnu adresu weba. Ako već imate konkretan problem, navedite stranicu, uslugu ili tržište koje želite provjeriti. Odgovorit ćemo s prijedlogom opsega pregleda."
        if seo_offer_layout else escape(labels["brief"])
    )
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
  <link rel="stylesheet" href="/styles.css?v=regional-services">
  <link rel="stylesheet" href="/assets/regional.css?v=8">
  <script src="/assets/region-language.js?v=10" defer></script>
  <script src="/script.js?v={"seo-audit" if seo_offer_layout else "regional-services"}" defer></script>
</head>
<body id="top" class="{page_class}">
  {header}
  <main id="main-content">
    {breadcrumbs}
    {main}
    <section class="editorial-contact" id="contact" aria-labelledby="regional-contact-title">
      <div class="page-container">
        <p class="services-kicker">{escape(nav["contact"])}</p>
        <h2 class="editorial-heading" id="regional-contact-title" data-editorial-reveal>{contact_title}</h2>
        <p>{contact_brief}</p>
        {regional_enquiry(key, seo_review=seo_offer_layout)}
        <div class="editorial-contact-links">
          <a href="mailto:hello@ostrelya.com">hello@ostrelya.com <span aria-hidden="true">→</span></a>
        </div>
        <p class="regional-privacy-link">{privacy_link}</p>
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
        project_type = f'<p class="services-kicker">{escape(labels["concept"])}</p>' if service in {"web", "brand", "development"} else ""
        example_link = ""
        if link_text := active.get("example_link"):
            example_link = f'<a class="web-service-text-link" href="{demo}" hreflang="en">{escape(link_text)} (EN) <span aria-hidden="true">↗</span></a>'
        image = (
            f'<a class="region-cover" href="{demo}" hreflang="en" aria-label="{escape(project)} (English)">'
            f'<img src="{cover}" alt="" width="{width}" height="{height}" loading="lazy"><span aria-hidden="true">↗</span></a>'
        ) if cover else ""
        detail = f"""
        <section id="usluge" class="region-split">
          <div><p class="services-kicker">01 / {escape(labels["process"])}</p>
          <h2 class="editorial-heading">{escape(labels["process"])}</h2><p>{escape(active["process"])}</p></div>
          <div><h3>{escape(labels["deliverables"])}</h3><ul>{items}</ul></div>
        </section>
        <section class="region-split" id="projekti">
          <div><p class="services-kicker">02 / {escape(labels["example"])}</p>
          <h2 class="editorial-heading">{escape(project)}</h2>{project_type}<p>{escape(active["example"])}</p>{example_link}</div>
          {image}
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
        <div class="region-emblem">
          <img src="/assets/hero-metal-emblem-640.webp"
               srcset="/assets/hero-metal-emblem-640.webp 640w, /assets/hero-metal-emblem.webp 1254w"
               sizes="(max-width: 690px) min(55vw, 212px), min(29vw, 351px)"
               width="640" height="640" alt="" fetchpriority="high">
        </div>
      </section>
      {detail}
      <section class="region-services" id="{ 'ostale-usluge' if service else 'usluge' }">
        <p class="services-kicker">Ostrelya Studio</p>
        <h2 class="editorial-heading">{escape(labels["other"] if service else nav["services"])}</h2>
        <div class="region-service-grid">{service_links}</div>
      </section>
    </div>
"""
