const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const enDir = path.join(srcDir, 'en');

const DICT = {
  /* ── Nav & CTAs ── */
  "nav.home": { en: "Home", hr: "Početna" },
  "nav.services": { en: "Services", hr: "Usluge" },
  "nav.blog": { en: "Blog", hr: "Blog" },
  "nav.contact": { en: "Contact", hr: "Kontakt" },
  "cta.start": { en: "Start a project", hr: "Započni projekt" },
  "cta.phoneLabel": { en: "Email · Reply < 24h", hr: "Email · Odgovor < 24h" },

  /* ── Hero (index) ── */
  "hero.eyebrow": { en: "OSTRELYA WEB STUDIO — EST. 2026", hr: "OSTRELYA WEB STUDIO — EST. 2026" },
  "hero.line1": { en: "Websites", hr: "Web stranice" },
  "hero.line2": { en: "that <em>bring</em>", hr: "koje <em>donose</em>" },
  "hero.line3": { en: "<span class=\"gradient-text\">business</span>.", hr: "<span class=\"gradient-text\">posao</span>." },
  "hero.sub": { 
    en: "Modern, mobile-first websites for small businesses across Croatia, Bosnia, Serbia and beyond. <strong>Delivered in ~10 days.</strong> Pay monthly, own forever.", 
    hr: "Moderne web stranice za male firme širom Hrvatske, Bosne i Hercegovine, Srbije i šire. <strong>Isporučujemo za ~10 dana.</strong> Plaćate na rate, vlasništvo je zauvijek vaše." 
  },
  "hero.calc": { en: "Calculate a price", hr: "Izračunaj cijenu" },
  "hero.allServices": { en: "All services →", hr: "Sve usluge →" },
  "hero.urgency": { 
    en: "We're currently taking 3 new clients for November. Reserve your slot.", 
    hr: "Trenutno primamo 3 nova klijenta za studeni. Rezervirajte svoj termin." 
  },

  /* ── Calculator ── */
  "calc.eyebrow": { en: "Configurator", hr: "Konfigurator" },
  "calc.title1": { en: "Build your package —", hr: "Složite svoj paket —" },
  "calc.title2": { en: "see the exact price.", hr: "vidite točnu cijenu." },
  "calc.step1title": { en: "Page size", hr: "Veličina stranice" },
  "calc.step2title": { en: "Add-ons", hr: "Dodaci" },
  "calc.opt.starter": { en: "Starter", hr: "Starter" },
  "calc.opt.starter.desc": { en: "1 page, basic design", hr: "1 stranica, osnovni dizajn" },
  "calc.opt.standard": { en: "Standard", hr: "Standard" },
  "calc.opt.standard.desc": { en: "1–3 pages, custom design", hr: "1–3 stranice, prilagođeni dizajn" },
  "calc.opt.business": { en: "Business", hr: "Business" },
  "calc.opt.business.desc": { en: "5 pages, complete presence", hr: "5 stranica, kompletan nastup" },
  "calc.opt.prosirena": { en: "Expanded", hr: "Proširena" },
  "calc.opt.prosirena.desc": { en: "8+ pages, blog, SEO", hr: "8+ stranica, blog, SEO" },
  "calc.opt.premium": { en: "Premium", hr: "Premium" },
  "calc.opt.premium.desc": { en: "12+ pages, advanced features", hr: "12+ stranica, napredni features" },
  "calc.popular": { en: "Popular", hr: "Popularno" },
  "calc.addon.seo": { en: "SEO optimization", hr: "SEO optimizacija" },
  "calc.addon.seo.desc": { en: "On-page SEO, meta tags, Google Business", hr: "On-page SEO, meta tagovi, Google Business" },
  "calc.addon.blog": { en: "Blog section", hr: "Blog sekcija" },
  "calc.addon.blog.desc": { en: "Blog page with categories and comments", hr: "Blog stranica s kategorijama i komentarima" },
  "calc.addon.shop": { en: "Web shop", hr: "Web shop" },
  "calc.addon.shop.desc": { en: "Cart, payments, product management", hr: "Košarica, plaćanje, upravljanje proizvodima" },
  "calc.addon.photo": { en: "Photos", hr: "Fotografije" },
  "calc.addon.photo.desc": { en: "Editing and optimization of your photos", hr: "Obrada i optimizacija vaših Fotografija" },
  "calc.addon.copy": { en: "Copywriting", hr: "Copywriting" },
  "calc.addon.copy.desc": { en: "Professional copy for your pages", hr: "Profesionalni tekstovi za vaše stranice" },
  "calc.addon.hosting": { en: "Domain + hosting (1 yr)", hr: "Domena + hosting (1 god)" },
  "calc.addon.hosting.desc": { en: "Included first year — then €25/yr", hr: "Uključeno prvu godinu — kasnije €25/god" },
  "calc.addon.fast": { en: "Fast delivery", hr: "Brza isporuka" },
  "calc.addon.fast.desc": { en: "Done in 5 instead of 10 days", hr: "Gotovo za 5 umjesto 10 dana" },
  "calc.addon.care": { en: "Maintenance (free 3 mo)", hr: "Održavanje (besplatno 3 mj)" },
  "calc.addon.care.desc": { en: "Free for 3 months, then €40/mo", hr: "Besplatno 3 mjeseca, zatim €40/mj" },
  "calc.result.base": { en: "Base price", hr: "Bazna cijena" },
  "calc.result.addons": { en: "Add-ons", hr: "Dodaci" },
  "calc.result.total": { en: "Total", hr: "Ukupno" },
  "calc.result.monthly": { en: "Monthly payment", hr: "Mjesečna rata" },
  "calc.result.term": { en: "Repayment term", hr: "Rok otplate" },
  "calc.result.delivery": { en: "Delivery time", hr: "Rok izrade" },
  "calc.result.cta": { en: "Request a quote →", hr: "Zatraži ponudu →" },
  "calc.urgency": { en: "Quote valid for 14 days · Free revision up to 2 times", hr: "Ponuda vrijedi 14 dana · Besplatna izmjena do 2 put" },

  /* ── Stats ── */
  "stats.days": { en: "Days to launch", hr: "Dana do lansiranja" },
  "stats.ownership": { en: "Your ownership", hr: "Vaše vlasništvo" },
  "stats.response": { en: "Response time", hr: "Vrijeme odgovora" },
  "stats.markets": { en: "Markets served", hr: "Tržišta na kojima radimo" },

  /* ── CTA band ── */
  "ctaband.label": { en: "Next step", hr: "Sljedeći korak" },
  "ctaband.text": { en: "Build your website and see the exact monthly payment.", hr: "Složi svoj web i vidi točnu ratu." },
  "ctaband.cta": { en: "Request a quote →", hr: "Zatraži ponudu →" },

  /* ── Contact ── */
  "contact.eyebrow": { en: "Contact", hr: "Kontakt" },
  "contact.title": { en: "Tell us about your business.", hr: "Recite nam o svom poslu." },
  "contact.sub": { en: "We'll reply with a clear plan and an exact price — no pressure, no obligation.", hr: "Odgovorit ćemo s jasnim planom i točnom cijenom — bez pritiska, bez obveze." },
  "contact.email.label": { en: "Email · Reply < 24h", hr: "Email · Odgovor < 24h" },
  "contact.wa": { en: "WhatsApp", hr: "WhatsApp" },
  "contact.wa.label": { en: "Send a message · Fast reply", hr: "Pošalji poruku · Brz odgovor" },
  "contact.viber": { en: "Viber", hr: "Viber" },
  "contact.viber.label": { en: "Reach out · No obligation", hr: "Javite se · Bez obveze" },
  "contact.form.name": { en: "Name *", hr: "Ime *" },
  "contact.form.business": { en: "Business", hr: "Firma" },
  "contact.form.email": { en: "Email *", hr: "Email *" },
  "contact.form.message": { en: "Tell us about your business *", hr: "Recite nam o svom poslu *" },
  "contact.form.submit": { en: "Send inquiry →", hr: "Pošalji upit →" },

  /* ── Page Hero & Contact Page ── */
  "page.hero.eyebrow": { en: "Services", hr: "Usluge" },
  "page.hero.title": { en: "Choose an area —<br/>see what you get.", hr: "Odaberi područje —<br/>vidi što dobivaš." },
  "page.hero.sub": { en: "Websites, maintenance and growth — all in one place. Custom design, no templates.", hr: "Web stranice, održavanje i rast — sve na jednom mjestu. Dizajn po mjeri, bez šablona." },
  "page.contact.title": { en: "Get in touch", hr: "Recite nam o svom poslu." },
  "page.contact.sub": { en: "Send us a message or email — we reply within 24 hours.", hr: "Odgovorit ćemo s jasnim planom i točnom cijenom — bez pritiska, bez obveze." },

  /* ── Usluge Page Details ── */
  "svc.tab.web": { en: "Web", hr: "Web" },
  "svc.tab.care": { en: "Care", hr: "Care" },
  "svc.tab.grow": { en: "SEO & Grow", hr: "SEO & Grow" },
  "svc.web.headline": { en: "A website that brings inquiries, not just visits.", hr: "Web stranica koja donosi upite, a ne samo posjete." },
  "svc.web.desc": { en: "Presentation website for a company, trade or service — fast, modern and ready for Google. Custom design, no templates.", hr: "Prezentacijska web stranica za firmu, obrt ili uslugu — brza, moderna i spremna za Google. Dizajn po mjeri, bez šablona." },
  "svc.web.from": { en: "from", hr: "od" },
  "svc.web.or": { en: "or", hr: "ili" },
  "svc.web.small": { en: "€11/mo", hr: "€11/mj" },
  "svc.web.cta": { en: "Get a price now →", hr: "Izračunaj cijenu →" },
  "svc.web.f1": { en: "<span class=\"svc-check\">✓</span> Custom design", hr: "<span class=\"svc-check\">✓</span> Dizajn po mjeri" },
  "svc.web.f2": { en: "<span class=\"svc-check\">✓</span> SEO foundations", hr: "<span class=\"svc-check\">✓</span> SEO temelji" },
  "svc.web.f3": { en: "<span class=\"svc-check\">✓</span> Hosting included", hr: "<span class=\"svc-check\">✓</span> Hosting uključen" },
  "svc.web.f4": { en: "<span class=\"svc-check\">✓</span> 24 monthly payments", hr: "<span class=\"svc-check\">✓</span> 24 mjesečne rate" },
  "svc.web.f5": { en: "<span class=\"svc-check\">✓</span> Contact form", hr: "<span class=\"svc-check\">✓</span> Contact forma" },
  "svc.web.f6": { en: "<span class=\"svc-check\">✓</span> Mobile-first", hr: "<span class=\"svc-check\">✓</span> Mobile-first" },

  "svc.care.headline": { en: "Hosting, domain, security — all sorted out.", hr: "Hosting, domain, security — sve riješeno." },
  "svc.care.desc": { en: "Maintenance of your website: security updates, backup, monitoring and small edits on request. One message — done.", hr: "Održavanje vaše web stranice: sigurnosna ažuriranja, backup, monitoring i mali editi na zahtjev. Jedna poruka — gotovo." },
  "svc.care.from": { en: "from", hr: "od" },
  "svc.care.small": { en: "€40/mo", hr: "€40/mj" },
  "svc.care.cta": { en: "Start care plan →", hr: "Start care plan →" },
  "svc.care.f1": { en: "<span class=\"svc-check\">✓</span> Hosting + Domain + SSL", hr: "<span class=\"svc-check\">✓</span> Hosting + Domain + SSL" },
  "svc.care.f2": { en: "<span class=\"svc-check\">✓</span> Security updates", hr: "<span class=\"svc-check\">✓</span> Security updates" },
  "svc.care.f3": { en: "<span class=\"svc-check\">✓</span> Daily backup", hr: "<span class=\"svc-check\">✓</span> Daily backup" },
  "svc.care.f4": { en: "<span class=\"svc-check\">✓</span> Small edits on request", hr: "<span class=\"svc-check\">✓</span> Small edits on request" },

  "svc.grow.headline": { en: "Be first when they search for you.", hr: "Budite prvi kad vas traže." },
  "svc.grow.desc": { en: "Basic SEO and Google Business profile — local customers find you when searching. Add-ons for copy, photos and more.", hr: "Basic SEO i Google Business profil — lokalni kupci vas pronalaze kad traže. Dodaci za copy, fotografije i više." },
  "svc.grow.from": { en: "from", hr: "od" },
  "svc.grow.cta": { en: "Request a quote →", hr: "Zatraži ponudu →" },
  "svc.grow.f1": { en: "<span class=\"svc-check\">✓</span> Basic on-page SEO", hr: "<span class=\"svc-check\">✓</span> Basic on-page SEO" },
  "svc.grow.f2": { en: "<span class=\"svc-check\">✓</span> Google Business Profile", hr: "<span class=\"svc-check\">✓</span> Google Business Profile" },
  "svc.grow.f3": { en: "<span class=\"svc-check\">✓</span> Copywriting add-on", hr: "<span class=\"svc-check\">✓</span> Copywriting add-on" },
  "svc.grow.f4": { en: "<span class=\"svc-check\">✓</span> Photo add-on", hr: "<span class=\"svc-check\">✓</span> Photo add-on" },

  "svc.process.eyebrow": { en: "Method", hr: "Metoda" },
  "svc.process.title": { en: "10 days, 4 steps.", hr: "10 dana, 4 koraka." },
  "svc.step1.title": { en: "Kickoff", hr: "Kickoff" },
  "svc.step1.desc": { en: "We discuss your business, collect copy and photos, agree on pages.", hr: "Razgovaramo o vašem poslu, skupljamo tekst i fotografije, dogovaramo stranice." },
  "svc.step2.title": { en: "Build", hr: "Build" },
  "svc.step2.desc": { en: "We design and build your website, mobile-first, with care. You watch it come alive.", hr: "Dizajniramo i gradimo vašu stranicu, mobile-first, s pažnjom. Gledate kako nastaje." },
  "svc.step3.title": { en: "Review", hr: "Review" },
  "svc.step3.desc": { en: "Two rounds of revisions until it's right — this is your face online.", hr: "Dva kruga revizija dok nije kako treba — to je vaše lice online." },
  "svc.step4.title": { en: "Launch", hr: "Launch" },
  "svc.step4.desc": { en: "Domain, SSL, Google Business, analytics — live and indexed. We stay on support.", hr: "Domain, SSL, Google Business, analytics — live i indeksiran. Mi ostajemo na podršci." },

  "svc.work.eyebrow": { en: "Portfolio", hr: "Reference" },
  "svc.work.title": { en: "Selected projects.", hr: "Odabrani projekti." },
  "svc.work.tag1": { en: "Boutique Hotel", hr: "Boutique Hotel" },
  "svc.work.title1": { en: "V01 — WARM EDITORIAL", hr: "V01 — WARM EDITORIAL" },
  "svc.work.tag2": { en: "Auto Garage", hr: "Auto Garage" },
  "svc.work.title2": { en: "B01 — SWISS BRUTALIST", hr: "B01 — SWISS BRUTALIST" },
  "svc.work.tag3": { en: "Café & Bakery", hr: "Café & Bakery" },
  "svc.work.title3": { en: "V13 — GLASS UI", hr: "V13 — GLASS UI" },
  "svc.work.tag4": { en: "Art Studio", hr: "Art Studio" },
  "svc.work.title4": { en: "V16 — DARK OLED", hr: "V16 — DARK OLED" },
  "svc.cta.label": { en: "Ready?", hr: "Spremni?" },
  "svc.cta.text": { en: "Get in touch for a free quote.", hr: "Javite nam se za besplatnu ponudu." },
  "svc.cta.btn": { en: "Request a quote →", hr: "Zatraži ponudu →" },

  /* ── Footer ── */
  "footer.tagline": { 
    en: "We turn ideas into websites that work. Clear, measurable and fair — from first sketch to live site.", 
    hr: "Pretvaramo ideje u web stranice koje rade. Jasno, mjerljivo i pošteno — od prve skice do live stranice." 
  },
  "footer.cta": { en: "Request a quote →", hr: "Zatraži ponudu →" },
  "footer.services": { en: "Services", hr: "Usluge" },
  "footer.s1": { en: "Website creation", hr: "Izrada web stranica" },
  "footer.s2": { en: "Maintenance", hr: "Održavanje" },
  "footer.s3": { en: "SEO optimization", hr: "SEO optimizacija" },
  "footer.s4": { en: "Price configurator", hr: "Konfigurator cijena" },
  "footer.solutions": { en: "Solutions", hr: "Rješenja" },
  "footer.r1": { en: "Websites for apartments", hr: "Web za apartmane" },
  "footer.r2": { en: "Websites for businesses", hr: "Web za firme" },
  "footer.r3": { en: "Web shop", hr: "Web shop" },
  "footer.r4": { en: "Web apps", hr: "Web aplikacije" },
  "footer.contact": { en: "Contact", hr: "Kontakt" },
  "footer.send": { en: "Send inquiry", hr: "Pošalji upit" },
  "footer.locHR": { en: "Croatia · BiH · Serbia", hr: "Hrvatska · BiH · Srbija" },
  "footer.locEU": { en: "EU · CA · US", hr: "EU · CA · US" },
  "footer.privacy": { en: "Privacy policy", hr: "Pravila privatnosti" },

  /* ============ FAQ ============ */
  "faq.title": { en: "Frequently Asked Questions", hr: "Često postavljana pitanja" },
  "faq.q1": { en: "How long does it take to build a website?", hr: "Koliko dugo traje izrada web stranice?" },
  "faq.a1": { en: "On average, most of our projects are ready and live within 10 to 14 days from the moment we receive all necessary materials from you.", hr: "U prosjeku, većina naših projekata bude gotova i live unutar 10 do 14 dana od trenutka kad dobijemo sve potrebne materijale s vaše strane." },
  "faq.q2": { en: "Who owns the website after it's built?", hr: "Tko je vlasnik stranice nakon izrade?" },
  "faq.a2": { en: "You are the 100% owner of the website, domain, and your content. We don't tie you down with complicated contracts or hidden fees.", hr: "Vi ste 100% vlasnik stranice, domene i svog sadržaja. Ne vežemo vas kompliciranim ugovorima niti skrivenim naknadama." },
  "faq.q3": { en: "What does monthly maintenance include?", hr: "Što uključuje mjesečno održavanje?" },
  "faq.a3": { en: "Maintenance includes fast hosting, SSL certificate, regular backups, system updates, and technical support in case of issues.", hr: "Održavanje uključuje brzi hosting, SSL certifikat, redovne sigurnosne kopije (backup), ažuriranje sustava i tehničku podršku u slučaju problema." },
  "faq.q4": { en: "Do you also build e-commerce sites?", hr: "Radite li i web shopove?" },
  "faq.a4": { en: "Yes, we build online stores optimized for sales and adapted to all devices, with integration of popular payment and shipping systems.", hr: "Da, izrađujemo web trgovine optimizirane za prodaju i prilagođene svim uređajima, uz integraciju popularnih sustava za plaćanje i dostavu." },

  "footer.rights": { en: "all rights reserved", hr: "sva prava pridržana" },

  /* ── Cookie ── */
  "cookie.text": { 
    en: "This site uses cookies to improve your experience. By continuing to browse you agree to the use of cookies.", 
    hr: "Ova stranica koristi kolačiće za poboljšanje vašeg iskustva. Nastavkom korištenja pristajete na uporabu kolačića." 
  },
  "cookie.more": { en: "Learn more", hr: "Saznaj više" },
  "cookie.accept": { en: "Accept", hr: "Prihvaćam" },
  "calc.quoteFor": { hr: "Ponuda za", en: "Quote for" },
  "calc.over": { hr: "na", en: "over" },
  "calc.months": { hr: "mjeseca", en: "months" },
  "calc.ownership": { hr: "Vlasništvo vaše", en: "Fully yours" }
};

const PAGE_META = {
    'index.html': {
        title: { hr: 'Web stranice na mjesečne rate | OSTRELYA WEB STUDIO', en: 'Websites on monthly payments | OSTRELYA WEB STUDIO' },
        description: { hr: 'OSTRELYA WEB STUDIO izrađuje moderne, brze web stranice za male firme u Hrvatskoj, BiH, Srbiji i šire. Isporučujemo za ~10 dana.', en: 'OSTRELYA WEB STUDIO builds modern, fast, mobile-first websites for small businesses in Croatia, Bosnia, Serbia and beyond. Delivered in about 10 days.' },
        ogTitle: { hr: 'Brze, moderne web stranice za male firme | OSTRELYA WEB STUDIO', en: 'Fast, Modern Websites for Small Businesses | OSTRELYA WEB STUDIO' },
        ogDesc: { hr: 'Web stranice za male firme. Uživo za ~10 dana, u vašem 100% vlasništvu.', en: 'Mobile-first websites for small businesses. Live in ~10 days, fully owned by you.' }
    },
    'usluge.html': {
        title: { hr: 'Usluge — OSTRELYA WEB STUDIO', en: 'Services — OSTRELYA WEB STUDIO' },
        description: { hr: 'Web stranice, održavanje i SEO optimizacija za male firme. Dizajn po mjeri, isporuka za ~10 dana.', en: 'Websites, maintenance and SEO optimization for small businesses. Bespoke design, no templates, live in ~10 days.' },
        ogTitle: { hr: 'Usluge — OSTRELYA WEB STUDIO', en: 'Services — OSTRELYA WEB STUDIO' },
        ogDesc: { hr: 'Web stranice, održavanje i SEO optimizacija za male firme.', en: 'Websites, maintenance and SEO optimization for small businesses.' }
    },
    'blog.html': {
        title: { hr: 'Blog — OSTRELYA WEB STUDIO', en: 'Blog — OSTRELYA WEB STUDIO' },
        description: { hr: 'Savjeti, vodiči i članci o izradi web stranica, SEO optimizaciji i digitalnom marketingu za male firme.', en: 'Tips, guides and articles about web development, SEO and digital presence for small businesses.' },
        ogTitle: { hr: 'Blog — OSTRELYA WEB STUDIO', en: 'Blog — OSTRELYA WEB STUDIO' },
        ogDesc: { hr: 'Savjeti i vodiči za izradu web stranica i SEO.', en: 'Tips and guides for web development and SEO.' }
    },
    'kontakt.html': {
        title: { hr: 'Kontakt — OSTRELYA WEB STUDIO', en: 'Contact — OSTRELYA WEB STUDIO' },
        description: { hr: 'Javite nam se za izradu web stranice. Odgovaramo unutar 24 sata s jasnim planom i točnom cijenom.', en: 'Get in touch for web development. We reply within 24 hours with a clear plan and exact price.' },
        ogTitle: { hr: 'Kontakt — OSTRELYA WEB STUDIO', en: 'Contact — OSTRELYA WEB STUDIO' },
        ogDesc: { hr: 'Javite se za besplatne konzultacije i ponudu.', en: 'Get in touch for free consultation and a quote.' }
    },
    'pravila-privatnosti.html': {
        title: { hr: 'Pravila privatnosti — OSTRELYA WEB STUDIO', en: 'Privacy Policy — OSTRELYA WEB STUDIO' },
        description: { hr: 'Pravila privatnosti i zaštita osobnih podataka na stranici OSTRELYA WEB STUDIO.', en: 'Privacy policy and data protection guidelines for OSTRELYA WEB STUDIO.' },
        ogTitle: { hr: 'Pravila privatnosti — OSTRELYA WEB STUDIO', en: 'Privacy Policy — OSTRELYA WEB STUDIO' },
        ogDesc: { hr: 'Pravila privatnosti.', en: 'Privacy Policy.' }
    },
    '404.html': {
        title: { hr: '404 — Stranica nije pronađena', en: '404 — Page Not Found' },
        description: { hr: 'Stranica koju tražite ne postoji ili je premještena.', en: 'The page you are looking for does not exist or has been moved.' },
        ogTitle: { hr: '404 — Stranica nije pronađena', en: '404 — Page Not Found' },
        ogDesc: { hr: 'Stranica nije pronađena.', en: 'Page Not Found.' }
    }
};

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
ensureDir(enDir);

function getHtmlFiles(dir, relativePath = '') {
    let results = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (item === 'dist' || item === 'node_modules' || item === 'en' || item.startsWith('_') || item === 'output' || item === 'build.js' || item === '.git') continue;
        
        const fullPath = path.join(dir, item);
        const rel = path.join(relativePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(getHtmlFiles(fullPath, rel));
        } else if (item.endsWith('.html')) {
            results.push(rel);
        }
    }
    return results;
}

function getRelPath(fromFileAbsolutePath, targetPathFromRoot) {
    const fromDir = path.dirname(fromFileAbsolutePath);
    const targetAbs = path.join(srcDir, targetPathFromRoot);
    let rel = path.relative(fromDir, targetAbs).replace(/\\/g, '/');
    return rel || './';
}

function replaceI18nContent(html, key, newContent) {
    const attrStr = `data-i18n="${key}"`;
    let idx = html.indexOf(attrStr);
    while (idx !== -1) {
        let openStart = html.lastIndexOf('<', idx);
        let openEnd = html.indexOf('>', idx);
        if (openStart === -1 || openEnd === -1) break;

        const tagMatch = html.substring(openStart + 1, openEnd).match(/^([a-z0-9]+)/i);
        if (!tagMatch) break;
        const tagName = tagMatch[1].toLowerCase();

        let cursor = openEnd + 1;
        let depth = 1;
        let closeStart = -1;
        let pos = cursor;

        while (pos < html.length) {
            let nextOpen = html.indexOf(`<${tagName}`, pos);
            let nextClose = html.indexOf(`</${tagName}>`, pos);

            if (nextClose === -1) break;

            if (nextOpen !== -1 && nextOpen < nextClose) {
                let charAfter = html.charAt(nextOpen + 1 + tagName.length);
                if (charAfter === ' ' || charAfter === '>' || charAfter === '\n' || charAfter === '\r' || charAfter === '\t') {
                    depth++;
                    pos = html.indexOf('>', nextOpen) + 1;
                    continue;
                }
            }

            depth--;
            if (depth === 0) {
                closeStart = nextClose;
                break;
            }
            pos = nextClose + `</${tagName}>`.length;
        }

        if (closeStart !== -1) {
            html = html.substring(0, openEnd + 1) + newContent + html.substring(closeStart);
        }

        idx = html.indexOf(attrStr, openEnd + 1 + newContent.length);
    }
    return html;
}

function fixPathsForFile(html, currentFileAbs, isEn) {
    return html.replace(/(href|src|srcset)="([^"]+)"/gi, (match, attr, val) => {
        if (val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('viber:') || val.startsWith('tel:') || val.startsWith('#') || val.startsWith('data:')) {
            return match;
        }

        if (attr === 'srcset') {
            const parts = val.split(',').map(p => {
                const trimmed = p.trim();
                const [pUrl, pDescriptor] = trimmed.split(/\s+/);
                if (pUrl.startsWith('http') || pUrl.startsWith('data:')) return trimmed;
                const cleanUrl = pUrl.replace(/^\//, '').replace(/^(\.\.\/|\.\/)+/, '');
                const relUrl = getRelPath(currentFileAbs, cleanUrl);
                return pDescriptor ? `${relUrl} ${pDescriptor}` : relUrl;
            });
            return `srcset="${parts.join(', ')}"`;
        }

        let cleanVal = val.replace(/^\//, '').replace(/^(\.\.\/|\.\/)+/, '');

        if (isEn && cleanVal.includes('.html') && !cleanVal.startsWith('en/')) {
            const hashIndex = cleanVal.indexOf('#');
            if (hashIndex !== -1) {
                const beforeHash = cleanVal.substring(0, hashIndex);
                const afterHash = cleanVal.substring(hashIndex);
                if (beforeHash.endsWith('.html')) {
                    cleanVal = 'en/' + beforeHash + afterHash;
                }
            } else if (cleanVal.endsWith('.html')) {
                cleanVal = 'en/' + cleanVal;
            }
        }

        const rel = getRelPath(currentFileAbs, cleanVal);
        return `${attr}="${rel}"`;
    });
}

// Build the canonical + hreflang block for a page in a given language.
function seoHeadBlock(normalizedFile, lang) {
    const pageName = normalizedFile.replace('index.html', '');
    const hrUrl = `https://ostrelya.com/${pageName}`;
    const enUrl = `https://ostrelya.com/en/${pageName}`;
    const canonical = lang === 'en' ? enUrl : hrUrl;
    return (
        `<link rel="canonical" href="${canonical}" />\n` +
        `<link rel="alternate" hreflang="hr" href="${hrUrl}" />\n` +
        `<link rel="alternate" hreflang="en" href="${enUrl}" />\n` +
        `<link rel="alternate" hreflang="x-default" href="${hrUrl}" />`
    );
}

// Remove any pre-existing canonical / hreflang "alternate" link tags from the head
// so each generated page ends up with exactly one canonical + one hreflang set.
function stripSeoHeadLinks(html) {
    return html
        .replace(/\s*<link rel="canonical" href="[^"]*" *\/?>/gi, '')
        .replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" *\/?>/gi, '')
        .replace(/\s*<link rel="alternate" hreflang="x-default" href="[^"]*" *\/?>/gi, '');
}

const htmlFiles = getHtmlFiles(srcDir);

htmlFiles.forEach(file => {
    const srcPath = path.join(srcDir, file);
    let content = fs.readFileSync(srcPath, 'utf-8');
    const normalizedFile = file.replace(/\\/g, '/');

    const hrDestAbs = path.join(srcDir, file);
    const enDestAbs = path.join(enDir, file);

    const toggleLinkForHr = getRelPath(hrDestAbs, 'en/' + normalizedFile);
    const toggleLinkForEn = getRelPath(enDestAbs, normalizedFile);

    const hrDropdownHtml = `<div class="lang-dropdown">
        <button type="button" class="lang-dropdown-toggle" aria-expanded="false" aria-label="Odaberi jezik">
          <span class="lang-flag">🇭🇷</span>
          <span class="lang-label">HR</span>
          <svg class="lang-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="lang-dropdown-menu">
          <a href="#" class="lang-dropdown-item is-active">
            <span class="lang-flag">🇭🇷</span>
            <span class="lang-name">Hrvatski</span>
            <span class="lang-check">✓</span>
          </a>
          <a href="${toggleLinkForHr}" class="lang-dropdown-item">
            <span class="lang-flag">🇬🇧</span>
            <span class="lang-name">English</span>
          </a>
        </div>
      </div>`;

    const enDropdownHtml = `<div class="lang-dropdown">
        <button type="button" class="lang-dropdown-toggle" aria-expanded="false" aria-label="Select language">
          <span class="lang-flag">🇬🇧</span>
          <span class="lang-label">EN</span>
          <svg class="lang-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="lang-dropdown-menu">
          <a href="${toggleLinkForEn}" class="lang-dropdown-item">
            <span class="lang-flag">🇭🇷</span>
            <span class="lang-name">Hrvatski</span>
          </a>
          <a href="#" class="lang-dropdown-item is-active">
            <span class="lang-flag">🇬🇧</span>
            <span class="lang-name">English</span>
            <span class="lang-check">✓</span>
          </a>
        </div>
      </div>`;

    const langPattern = /<div class="lang-dropdown">[\s\S]*?<\/div>\s*<\/div>/i;

    let meta = PAGE_META[normalizedFile]; // Extract local dictionary from the HTML file if present (useful for blog posts)
    let localEnDict = null;
    let localHrDict = null;
    const hrMatch = content.match(/window\.OSTRELYA_I18N(?:\.HR)?\s*=\s*(\{[\s\S]*?\});/);
    if (hrMatch) {
        try {
            // Using eval to parse JS object string which might have unquoted keys
            localHrDict = eval('(' + hrMatch[1] + ')');
        } catch(e) {}
    }
    const enMatch = content.match(/window\.OSTRELYA_I18N\.EN\s*=\s*(\{[\s\S]*?\});/);
    if (enMatch) {
        try {
            localEnDict = eval('(' + enMatch[1] + ')');
        } catch(e) {}
    }

    // 1. Prepare English Version
    let enContent = content
        .replace(/<html lang="[^"]*">/i, '<html lang="en">')
        .replace(/<meta http-equiv="Content-Language" content="[^"]*" \/>/i, '<meta http-equiv="Content-Language" content="en" />')
        .replace(langPattern, enDropdownHtml);

    // Apply global dictionary
    Object.keys(DICT).forEach(key => {
        if (DICT[key].en) {
            enContent = replaceI18nContent(enContent, key, DICT[key].en);
        }
    });
    
    // Apply local English dictionary if available
    if (localEnDict) {
        Object.keys(localEnDict).forEach(key => {
            enContent = replaceI18nContent(enContent, key, localEnDict[key]);
        });
    }

    if (meta) {
        if (meta.title && meta.title.en) {
            enContent = enContent.replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title.en}</title>`);
        }
        if (meta.description && meta.description.en) {
            enContent = enContent.replace(/<meta name="description" content="[^"]*" \/>/i, `<meta name="description" content="${meta.description.en}" />`);
        }
        if (meta.ogTitle && meta.ogTitle.en) {
            enContent = enContent.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${meta.ogTitle.en}" />`);
        }
        if (meta.ogDesc && meta.ogDesc.en) {
            enContent = enContent.replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${meta.ogDesc.en}" />`);
            enContent = enContent.replace(/<meta name="twitter:title" content="[^"]*" \/>/i, `<meta name="twitter:title" content="${meta.ogTitle.en}" />`);
            enContent = enContent.replace(/<meta name="twitter:description" content="[^"]*" \/>/i, `<meta name="twitter:description" content="${meta.ogDesc.en}" />`);
            enContent = enContent.replace(/<meta property="og:locale" content="[^"]*" \/>/i, `<meta property="og:locale" content="en_US" />`);
        }
    }

    enContent = enContent
        .replace(/<meta property="og:locale" content="[^"]*" \/>/i, `<meta property="og:locale" content="en_US" />`)
        .replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="https://ostrelya.com/en/${normalizedFile.replace('index.html', '')}" />`);
    if (!/<meta property="og:locale"/i.test(enContent)) {
        enContent = enContent.replace('</head>', `    <meta property="og:locale" content="en_US" />\n</head>`);
    }

    enContent = stripSeoHeadLinks(enContent);
    enContent = enContent.replace('</head>',
        `\n${seoHeadBlock(normalizedFile, 'en')}\n</head>`);

    enContent = enContent.replace(/<script src="(\.\.\/)*js\/i18n\.js"><\/script>/i, '');
    enContent = enContent.replace(/<script>\s*window\.OSTRELYA_I18N[\s\S]*?<\/script>/i, ''); // Strip dict script
    enContent = fixPathsForFile(enContent, enDestAbs, true);

    // 2. Prepare Croatian Version
    let hrContent = content
        .replace(/<html lang="[^"]*">/i, '<html lang="hr">')
        .replace(/<meta http-equiv="Content-Language" content="[^"]*" \/>/i, '<meta http-equiv="Content-Language" content="hr" />')
        .replace(langPattern, hrDropdownHtml);

    // Apply Croatian global dictionary
    Object.keys(DICT).forEach(key => {
        if (DICT[key].hr) {
            hrContent = replaceI18nContent(hrContent, key, DICT[key].hr);
        }
    });
    
    // Apply local Croatian dictionary if available
    if (localHrDict) {
        Object.keys(localHrDict).forEach(key => {
            hrContent = replaceI18nContent(hrContent, key, localHrDict[key]);
        });
    }

    if (meta) {
        if (meta.title && meta.title.hr) {
            hrContent = hrContent.replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title.hr}</title>`);
        }
        if (meta.description && meta.description.hr) {
            hrContent = hrContent.replace(/<meta name="description" content="[^"]*" \/>/i, `<meta name="description" content="${meta.description.hr}" />`);
        }
        if (meta.ogTitle && meta.ogTitle.hr) {
            hrContent = hrContent.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${meta.ogTitle.hr}" />`);
        }
        if (meta.ogDesc && meta.ogDesc.hr) {
            hrContent = hrContent.replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${meta.ogDesc.hr}" />`);
            hrContent = hrContent.replace(/<meta name="twitter:title" content="[^"]*" \/>/i, `<meta name="twitter:title" content="${meta.ogTitle.hr}" />`);
            hrContent = hrContent.replace(/<meta name="twitter:description" content="[^"]*" \/>/i, `<meta name="twitter:description" content="${meta.ogDesc.hr}" />`);
            hrContent = hrContent.replace(/<meta property="og:locale" content="[^"]*" \/>/i, `<meta property="og:locale" content="hr_HR" />`);
        }
    }

    hrContent = hrContent
        .replace(/<meta property="og:locale" content="[^"]*" \/>/i, `<meta property="og:locale" content="hr_HR" />`);
    if (!/<meta property="og:locale"/i.test(hrContent)) {
        hrContent = hrContent.replace('</head>', `    <meta property="og:locale" content="hr_HR" />\n</head>`);
    }

    hrContent = stripSeoHeadLinks(hrContent);
    hrContent = hrContent.replace('</head>',
        `\n${seoHeadBlock(normalizedFile, 'hr')}\n</head>`);

    hrContent = hrContent.replace(/<script src="(\.\.\/)*js\/i18n\.js"><\/script>/i, '');
    hrContent = hrContent.replace(/<script>\s*window\.OSTRELYA_I18N[\s\S]*?<\/script>/i, ''); // Strip dict script
    hrContent = fixPathsForFile(hrContent, hrDestAbs, false);

    ensureDir(path.dirname(enDestAbs));
    fs.writeFileSync(enDestAbs, enContent);

    ensureDir(path.dirname(hrDestAbs));
    fs.writeFileSync(hrDestAbs, hrContent);
});

console.log("Build complete! Both Croatian and English static pages generated with 100% full translations.");
