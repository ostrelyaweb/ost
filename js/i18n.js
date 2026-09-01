/* ==========================================================================
   OSTRELYA — i18n engine
   Default content language: ENGLISH (written directly in the HTML).
   Croatian is served automatically to visitors from:
     SI (Slovenia) · HR (Croatia) · BA (Bosnia & Herzegovina)
     RS (Serbia) · ME (Montenegro) · XK (Kosovo) · MK (North Macedonia)
   Visitors can override at any time with the EN/HR toggle in the header.

   The HTML keeps the English text inline as a no-JS fallback. Every
   translatable element carries a data-i18n="KEY" attribute. The English
   string for each KEY may be supplied here (so the same dictionary can be
   swapped consistently); Croatian lookup maps KEY -> Croatian string.
   ========================================================================== */
(function () {
  "use strict";

  var LANG_KEY = "ostrelya_lang";          // explicit user override
  var GEO_KEY = "ostrelya_geo_country";    // last known country code

  /* Countries that should get Croatian by default */
  var HR_COUNTRIES = ["SI", "HR", "BA", "RS", "ME", "XK", "MK"];

  /* --------------------------------------------------------------------
     English dictionary (default content). Keys not listed here stay as the
     inline HTML text (which is already English by construction).
     -------------------------------------------------------------------- */
  var EN = {};
  /* English additions that differ from the inline default text live here.
     We keep the inline HTML as the primary English source, so EN doubles as
     an optional override for strings we intentionally phrase differently. */

  /* --------------------------------------------------------------------
     Croatian dictionary
     -------------------------------------------------------------------- */
  var HR = {
    /* ── Shared UI ── */
    "nav.home": "Početna",
    "nav.services": "Usluge",
    "nav.blog": "Blog",
    "nav.contact": "Kontakt",
    "cta.start": "Započni projekt",
    "cta.phoneLabel": "Email · Odgovor < 24h",

    /* ── Language toggle ── */
    "toggle.en": "EN",
    "toggle.hr": "HR",

    /* ── Hero (index) ── */
    "hero.eyebrow": "OSTRELYA WEB STUDIO — EST. 2026",
    "hero.line1": "Web stranice",
    "hero.line2": "koje <em>donose</em>",
    "hero.line3": "<span class=\"gradient-text\">posao</span>.",
    "hero.sub": "Moderne web stranice za male firme širom Hrvatske, Bosne i Hercegovine, Srbije i šire. <strong>Isporučujemo za ~10 dana.</strong> Plaćate na rate, vlasništvo je zauvijek vaše.",
    "hero.calc": "Izračunaj cijenu",
    "hero.allServices": "Sve usluge →",
    "hero.urgency": "Trenutno primamo 3 nova klijenta za studeni. Rezervirajte svoj termin.",

    /* ── Calculator (index) ── */
    "calc.eyebrow": "Konfigurator",
    "calc.title1": "Složite svoj paket —",
    "calc.title2": "vidite točnu cijenu.",
    "calc.step1title": "Veličina stranice",
    "calc.step2title": "Dodaci",
    "calc.opt.starter": "Starter",
    "calc.opt.starter.desc": "1 stranica, osnovni dizajn",
    "calc.opt.standard": "Standard",
    "calc.opt.standard.desc": "1–3 stranice, prilagođeni dizajn",
    "calc.opt.business": "Business",
    "calc.opt.business.desc": "5 stranica, kompletan nastup",
    "calc.opt.prosirena": "Proširena",
    "calc.opt.prosirena.desc": "8+ stranica, blog, SEO",
    "calc.opt.premium": "Premium",
    "calc.opt.premium.desc": "12+ stranica, napredni features",
    "calc.popular": "Popularno",
    "calc.addon.seo": "SEO optimizacija",
    "calc.addon.seo.desc": "On-page SEO, meta tagovi, Google Business",
    "calc.addon.blog": "Blog sekcija",
    "calc.addon.blog.desc": "Blog stranica s kategorijama i komentarima",
    "calc.addon.shop": "Web shop",
    "calc.addon.shop.desc": "Košarica, plaćanje, upravljanje proizvodima",
    "calc.addon.photo": "Fotografije",
    "calc.addon.photo.desc": "Obrada i optimizacija vaših fotografija",
    "calc.addon.copy": "Copywriting",
    "calc.addon.copy.desc": "Profesionalni tekstovi za vaše stranice",
    "calc.addon.hosting": "Domena + hosting (1 god)",
    "calc.addon.hosting.desc": "Uključeno prvu godinu — kasnije €25/god",
    "calc.addon.fast": "Brza isporuka",
    "calc.addon.fast.desc": "Gotovo za 5 umjesto 10 dana",
    "calc.addon.care": "Održavanje (besplatno 3 mj)",
    "calc.addon.care.desc": "Besplatno 3 mjeseca, zatim €40/mj",
    "calc.free": "Besplatno",
    "calc.result.base": "Bazna cijena",
    "calc.result.addons": "Dodaci",
    "calc.result.total": "Ukupno",
    "calc.result.monthly": "Mjesečna rata",
    "calc.result.term": "Rok otplate",
    "calc.result.delivery": "Rok izrade",
    "calc.result.cta": "Zatraži ponudu →",
    "calc.urgency": "Ponuda vrijedi 14 dana · Besplatna izmjena do 2 put",

    /* ── Stats (index) ── */
    "stats.days": "Dana do lansiranja",
    "stats.ownership": "Vaše vlasništvo",
    "stats.response": "Vrijeme odgovora",
    "stats.markets": "Tržišta na kojima radimo",

    /* ── CTA band (index) ── */
    "ctaband.label": "Sljedeći korak",
    "ctaband.text": "Složi svoj web i vidi točnu ratu.",
    "ctaband.cta": "Zatraži ponudu →",

    /* ── Contact (index + kontakt) ── */
    "contact.eyebrow": "Kontakt",
    "contact.title": "Recite nam o svom poslu.",
    "contact.sub": "Odgovorit ćemo s jasnim planom i točnom cijenom — bez pritiska, bez obveze.",
    "contact.email.label": "Email · Odgovor < 24h",
    "contact.wa": "WhatsApp",
    "contact.wa.label": "Pošalji poruku · Brz odgovor",
    "contact.viber": "Viber",
    "contact.viber.label": "Javite se · Bez obveze",
    "contact.form.name": "Ime *",
    "contact.form.business": "Firma",
    "contact.form.email": "Email *",
    "contact.form.message": "Recite nam o svom poslu *",
    "contact.form.submit": "Pošalji upit →",

    /* ── Footer ── */
    "footer.tagline": "Pretvaramo ideje u web stranice koje rade. Jasno, mjerljivo i pošteno — od prve skice do live stranice.",
    "footer.cta": "Zatraži ponudu →",
    "footer.services": "Usluge",
    "footer.s1": "Izrada web stranica",
    "footer.s2": "Održavanje",
    "footer.s3": "SEO optimizacija",
    "footer.s4": "Konfigurator cijena",
    "footer.solutions": "Rješenja",
    "footer.r1": "Web za apartmane",
    "footer.r2": "Web za firme",
    "footer.r3": "Web shop",
    "footer.r4": "Web aplikacije",
    "footer.contact": "Kontakt",
    "footer.send": "Pošalji upit",
    "footer.locHR": "Hrvatska · BiH · Srbija",
    "footer.locEU": "EU · CA · US",
    "footer.privacy": "Pravila privatnosti",
    "footer.rights": "sva prava pridržana",

    /* ── Cookie banner ── */
    "cookie.text": "Ova stranica koristi kolačiće za poboljšanje vašeg iskustva. Nastavkom korištenja pristajete na uporabu kolačića.",
    "cookie.more": "Saznaj više",
    "cookie.accept": "Prihvaćam"
  };

  /* Dictionary for the current page (empty means page has no custom dict) */
  var HR_EXTRA = window.OSTRELYA_I18N ? (window.OSTRELYA_I18N.HR || {}) : {};
  Object.keys(HR_EXTRA).forEach(function (k) { HR[k] = HR_EXTRA[k]; });

  var dict = { en: EN, hr: HR };

  /* Current active language — read by main.js for dynamic strings */
  var currentLang = "en";

  /* --------------------------------------------------------------------
     Country detection — primary source: lightweight CORS-friendly
     geolocation endpoint (get.geojs.io, no API key). Fallback: brace the
     user's IANA timezone to infer the Balkans if the network call fails
     or is blocked. Result is cached in localStorage.
     -------------------------------------------------------------------- */

  var BALKAN_TZ = [
    "Europe/Belgrade",   /* Serbia, Montenegro, Croatia, Bosnia, Slovenia */
    "Europe/Zagreb",     /* Croatia */
    "Europe/Sarajevo",   /* Bosnia & Herzegovina */
    "Europe/Ljubljana",  /* Slovenia */
    "Europe/Skopje",     /* North Macedonia */
    "Europe/Podgorica",  /* Montenegro */
    "Europe/Pristina",   /* Kosovo */
    "Europe/Tirane"      /* Albania (nearby) */
  ];

  function tzHintsBalkan() {
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    return BALKAN_TZ.indexOf(tz) >= 0;
  }

  function detectCountry(cb) {
    var cached = null;
    try { cached = localStorage.getItem(GEO_KEY); } catch (e) {}

    if (cached) { cb(cached); return; }

    var done = false;
    function finish(loc) {
      if (done) return;
      done = true;
      if (loc) { try { localStorage.setItem(GEO_KEY, loc); } catch (e) {} }
      cb(loc || "");
    }

    var controller = null;
    var timedOut = false;

    try {
      controller = new AbortController();
    } catch (e) { controller = null; }

    var timer = setTimeout(function () {
      timedOut = true;
      if (controller) { try { controller.abort(); } catch (e) {} }
      finish(tzHintsBalkan() ? "BA" : "");
    }, 3500);

    var opts = { mode: "cors", cache: "no-store" };
    if (controller) opts.signal = controller.signal;

    fetch("https://get.geojs.io/v1/ip/geo.json", opts)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        var cc = data && (data.country_code || data.country);
        finish(cc ? String(cc).toUpperCase() : (tzHintsBalkan() ? "BA" : ""));
      })
      .catch(function () {
        clearTimeout(timer);
        finish(tzHintsBalkan() ? "BA" : "");
      });
  }

  function resolveLang(country) {
    return HR_COUNTRIES.indexOf(country) >= 0 ? "hr" : "en";
  }

  /* --------------------------------------------------------------------
     Apply language to the whole page
     -------------------------------------------------------------------- */
  function applyLang(lang) {
    lang = lang === "hr" ? "hr" : "en";
    currentLang = lang;

    var els = document.querySelectorAll("[data-i18n]");
    Array.prototype.forEach.call(els, function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      /* Capture the inline (English) source the first time we see it, so we
         can restore English after a Croatian swap has overwritten the DOM. */
      if (EN[key] === undefined) {
        EN[key] = el.innerHTML;
      }
      var val = dict[lang][key];
      if (val === undefined || val === null) return;
      el.innerHTML = val;
    });

    /* Update <html lang> */
    var h = document.documentElement;
    h.setAttribute("lang", lang === "hr" ? "hr" : "en");

    /* Update toggle button state */
    var btn = document.getElementById("langToggle");
    if (btn) {
      var opp = lang === "hr" ? "en" : "hr";
      btn.setAttribute("data-lang", opp);
      var label = btn.querySelector(".lang-label");
      if (label) label.textContent = (opp === "hr" ? "Hrvatski" : "English");
      btn.setAttribute("aria-label", "Switch to " + (opp === "hr" ? "Croatian" : "English"));
    }

    /* Dispatch event so main.js can refresh dynamic strings (calculator etc.) */
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang: lang } }));
  }

  /* --------------------------------------------------------------------
     Find the saved/desired language
     -------------------------------------------------------------------- */
  function savedLang() {
    try { return localStorage.getItem(LANG_KEY) || ""; } catch (e) { return ""; }
  }

  function setSaved(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function initToggle() {
    var btn = document.getElementById("langToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = currentLang === "hr" ? "en" : "hr";
      setSaved(next);
      applyLang(next);
    });
  }

  /* Expose a small public API for other scripts (e.g. main.js) */
  window.OSTRELYA_I18N = window.OSTRELYA_I18N || {};
  window.OSTRELYA_I18N.currentLang = function () { return currentLang; };

  /* --------------------------------------------------------------------
     Boot
     -------------------------------------------------------------------- */
  function boot() {
    initToggle();

    var explicit = savedLang();
    if (explicit) {
      applyLang(explicit);
      return;
    }

    /* No explicit preference: detect country, then choose language */
    detectCountry(function (country) {
      var lang = resolveLang(country);
      applyLang(lang);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
