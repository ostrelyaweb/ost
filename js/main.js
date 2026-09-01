/* ==========================================================================
   OSTRELYA V4 — dock.hr clone interactions
   Loader · Custom cursor · reveals · counters · service tabs · mobile menu
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var HAS_GS = typeof window.gsap !== "undefined";
  var HAS_TRIG = HAS_GS && typeof window.ScrollTrigger !== "undefined";
  var body = document.body;

  /* ======================================================================
     LOADER
     ====================================================================== */
  var loader = $("#loader");
  var loaderBar = $("#loaderBar");
  var loaderLogo = $("#loaderLogo");
  var loaderTagline = $("#loaderTagline");

  function hideLoader() {
    if (!loader) return;
    if (reduceMotion || !HAS_GS) { loader.style.display = "none"; return; }

    var tl = gsap.timeline();

    /* phase 1: logo fades in */
    tl.to(loaderLogo, { opacity: 1, duration: 0.5, ease: "power2.out" });

    /* phase 2: tagline fades in */
    tl.to(loaderTagline, { opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.2");

    /* phase 3: progress bar appears and fills */
    tl.to(".loader-bar", { opacity: 1, duration: 0.2, ease: "power2.out" }, "-=0.2");
    tl.to(loaderBar, { scaleX: 1, duration: 0.6, ease: "power2.inOut" });

    /* phase 4: everything slides up */
    tl.to(loaderLogo, { y: -30, opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.1");
    tl.to(loaderTagline, { y: -20, opacity: 0, duration: 0.3, ease: "power2.in" }, "-=0.25");
    tl.to(".loader-bar", { y: -10, opacity: 0, duration: 0.25, ease: "power2.in" }, "-=0.2");
    tl.to(loader, {
      yPercent: -101, duration: 0.6, ease: "expo.inOut",
      onComplete: function () { loader.style.display = "none"; }
    }, "-=0.1");
  }
  window.setTimeout(hideLoader, 120);

  /* ======================================================================
     ANCHOR LINKS — smooth scroll
     ====================================================================== */
  var HEAD_OFFSET = 80;
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (href.length < 2) { return; }
      var target = $(href);
      if (!target) { return; }
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      /* close mobile menu if open */
      if (mmenu && mmenu.classList.contains("is-open")) closeMenu(false);
    });
  });

  /* ======================================================================
     SCROLL STATE — sticky header, scrollspy
     ====================================================================== */
  var header = $(".header");
  var navLinks = $$(".head-nav [data-link]");
  var sections = $$("main section[id]");
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || window.scrollY || 0;
    if (header) header.classList.toggle("is-scrolled", y > 10);

    var activeId = null;
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (y >= sec.offsetTop - window.innerHeight / 2 - 40) activeId = sec.id;
    }
    navLinks.forEach(function (link) {
      var on = link.getAttribute("data-link") === activeId;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    ticking = false;
  }
  function onScrollThrottled() {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }
  window.addEventListener("scroll", onScrollThrottled, { passive: true });
  onScroll();

  /* ======================================================================
     MOBILE MENU
     ====================================================================== */
  var burger = $(".head-burger");
  var mmenu = $("#mmenu");
  var main = $("#main");
  var footer = $(".footer");
  var lastFocus = null;

  function closeMenu(returnFocus) {
    if (!burger || !mmenu) return;
    mmenu.classList.remove("is-open");
    mmenu.setAttribute("aria-hidden", "true");
    mmenu.inert = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    body.classList.remove("menu-open");
    if (main) main.inert = false;
    if (footer) footer.inert = false;
    if (returnFocus && lastFocus) lastFocus.focus();
  }
  function openMenu() {
    if (!burger || !mmenu) return;
    lastFocus = document.activeElement;
    mmenu.classList.add("is-open");
    mmenu.setAttribute("aria-hidden", "false");
    mmenu.inert = false;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    body.classList.add("menu-open");
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    var first = $("a", mmenu);
    if (first) first.focus();
  }

  if (burger && mmenu) {
    burger.addEventListener("click", function () {
      if (burger.getAttribute("aria-expanded") === "true") closeMenu(true);
      else openMenu();
    });
    $$("a", mmenu).forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mmenu.classList.contains("is-open")) { closeMenu(true); e.preventDefault(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 940 && mmenu.classList.contains("is-open")) closeMenu(false);
    });
  }

  /* ======================================================================
     REVEALS
     ====================================================================== */
  var revealEls = $$("[data-reveal]");

  /* hero: cascade delays */
  var hero = $(".hero");
  if (hero) {
    $$("[data-reveal]", hero).forEach(function (el, i) {
      el.style.setProperty("--rd", (i * 0.1 + 0.1).toFixed(2) + "s");
    });
  }

  function addIn(el) {
    el.classList.add("is-in");
  }

  if (HAS_TRIG && !reduceMotion) {
    revealEls.forEach(function (el) {
      var isSection = el.tagName === "SECTION";
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: isSection ? 0 : 24 },
        {
          autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.05,
          scrollTrigger: { trigger: el, start: "top 88%" }
        }
      );
    });
  } else {
    revealEls.forEach(addIn);
  }

  /* ======================================================================
     COUNTERS
     ====================================================================== */
  var counters = $$("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var dur = 1500;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toString();
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var counterObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (reduceMotion) { entry.target.textContent = entry.target.getAttribute("data-count"); }
            else animateCount(entry.target);
            counterObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { counterObs.observe(el); });
    } else {
      counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    }
  }

  /* ======================================================================
     SERVICE TABS
     ====================================================================== */
  var svcTabs = $$(".svc-tab");
  var svcPanels = $$(".svc-panel");

  function activateSvcTab(tab) {
    svcTabs.forEach(function (t) {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");

    svcPanels.forEach(function (panel) { panel.classList.remove("is-active"); });
    var target = document.getElementById(tab.getAttribute("aria-controls"));
    if (target) {
      target.classList.add("is-active");
      if (HAS_GS && !reduceMotion) {
        gsap.fromTo(target, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" });
      }
    }
  }

  svcTabs.forEach(function (tab) {
    tab.addEventListener("click", function () { activateSvcTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var idx = svcTabs.indexOf(tab);
      var next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        next = (idx + 1) % svcTabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        next = (idx - 1 + svcTabs.length) % svcTabs.length;
      } else if (e.key === "Home") {
        next = 0;
      } else if (e.key === "End") {
        next = svcTabs.length - 1;
      }
      if (next >= 0) {
        e.preventDefault();
        svcTabs[next].focus();
        activateSvcTab(svcTabs[next]);
      }
    });
  });

  /* ======================================================================
     CALCULATOR — price configurator
     ====================================================================== */
  var calcOpts = $$(".calc-opt");
  var calcAddons = $$(".calc-addon-check");
  var calcBase = $("#calcBase");
  var calcAddonsEl = $("#calcAddons");
  var calcAddonsRow = $("#calcAddonsRow");
  if (calcAddonsRow) calcAddonsRow.style.display = "none";
  var calcTotal = $("#calcTotal");
  var calcMonthly = $("#calcMonthly");
  var calcTerm = $("#calcTerm");
  var calcDelivery = $("#calcDelivery");
  var activePrice = 400;

  function formatCurrency(n) {
    return "€" + n.toLocaleString("en-US");
  }
  function calcInstallment(price) {
    var months = 24;
    var monthly = Math.ceil(price / months);
    return { monthly: monthly, term: months };
  }
  function getAddonsTotal() {
    var total = 0;
    calcAddons.forEach(function (cb) {
      if (cb.checked) total += parseInt(cb.getAttribute("data-price"), 10) || 0;
    });
    return total;
  }
  function updateCalc() {
    var addonsTotal = getAddonsTotal();
    var total = activePrice + addonsTotal;
    var result = calcInstallment(total);
    var hasFast = document.querySelector('.calc-addon-check[data-price="120"]');
    var isFast = hasFast && hasFast.checked;

    if (calcBase) calcBase.textContent = formatCurrency(activePrice);
    if (calcAddonsEl) calcAddonsEl.textContent = addonsTotal > 0 ? "+" + formatCurrency(addonsTotal) : "€0";
    if (calcAddonsRow) calcAddonsRow.style.display = addonsTotal > 0 ? "flex" : "none";
    if (calcTotal) calcTotal.textContent = formatCurrency(total);
    if (calcMonthly) calcMonthly.textContent = formatCurrency(result.monthly) + "/mj";
    if (calcTerm) calcTerm.textContent = result.term + " mjeseci";
    if (calcDelivery) calcDelivery.textContent = isFast ? "~5 dana" : "~10 dana";

    if (HAS_GS && !reduceMotion) {
      gsap.fromTo(".calc-result", { scale: 0.97, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(".calc-highlight", { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out", delay: 0.05 });
    }
  }
  calcOpts.forEach(function (opt) {
    opt.addEventListener("click", function () {
      calcOpts.forEach(function (o) { o.classList.remove("is-active"); });
      opt.classList.add("is-active");
      activePrice = parseInt(opt.getAttribute("data-price"), 10) || 0;
      updateCalc();
    });
  });
  calcAddons.forEach(function (cb) {
    cb.addEventListener("change", updateCalc);
  });

  /* ======================================================================
     CONTACT FORM — Netlify when deployed, mailto fallback locally
     ====================================================================== */
  var form = $(".contact-form");
  if (form) {
    var status = $(".form-status", form);
    var honeypot = $(".hp", form);
    function setStatus(msg, type) {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove("is-error", "is-ok");
      if (type) status.classList.add(type);
    }
    function clearFieldErrors() {
      form.querySelectorAll(".form-field").forEach(function (f) {
        f.classList.remove("is-error");
        f.removeAttribute("aria-invalid");
        var err = f.querySelector(".form-field-error");
        if (err) err.textContent = "";
      });
    }
    function setFieldError(field, msg) {
      var wrap = field.closest(".form-field");
      if (wrap) {
        wrap.classList.add("is-error");
        field.setAttribute("aria-invalid", "true");
        var errEl = wrap.querySelector(".form-field-error");
        if (!errEl) {
          errEl = document.createElement("span");
          errEl.className = "form-field-error";
          errEl.setAttribute("role", "alert");
          wrap.appendChild(errEl);
        }
        errEl.textContent = msg;
        field.setAttribute("aria-describedby", errEl.id || (errEl.id = "err-" + field.name));
        errEl.id = errEl.id || "err-" + field.name;
      }
    }
    form.addEventListener("submit", function (e) {
      if (form.getAttribute("netlify") != null && window.location.protocol !== "file:") return;
      e.preventDefault();
      if (honeypot && honeypot.value) return;

      clearFieldErrors();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name) { setFieldError(form.elements.name, "Unesite svoje ime."); setStatus("ISPRAVITE GREŠKE ISPOD.", "is-error"); form.elements.name.focus(); return; }
      if (!emailOk) { setFieldError(form.elements.email, "Unesite valjanu email adresu."); setStatus("ISPRAVITE GREŠKE ISPOD.", "is-error"); form.elements.email.focus(); return; }
      if (!message) { setFieldError(form.elements.message, "Recite nam nešto o svom poslu."); setStatus("ISPRAVITE GREŠKE ISPOD.", "is-error"); form.elements.message.focus(); return; }

      setStatus("OPENING YOUR EMAIL APP — THANKS!", "is-ok");
      var subject = encodeURIComponent("Website inquiry — " + (form.elements.business.value.trim() || name));
      var body = encodeURIComponent(
        "Name: " + name + "\n" +
        "Business: " + (form.elements.business.value.trim() || "-") + "\n" +
        "Email: " + email + "\n\n" + message
      );
      window.location.href = "mailto:hello@ostrelya.com?subject=" + subject + "&body=" + body;
    });
  }

  /* ======================================================================
     FOOTER YEAR
     ====================================================================== */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ======================================================================
     COOKIE CONSENT
     ====================================================================== */
  var cookieBanner = $("#cookieBanner");
  var cookieAccept = $("#cookieAccept");
  if (cookieBanner && cookieAccept) {
    var cookieKey = "ostrelya_cookie_consent";
    function showCookieBanner() {
      if (!localStorage.getItem(cookieKey)) {
        cookieBanner.classList.add("is-visible");
        cookieBanner.setAttribute("aria-hidden", "false");
      }
    }
    cookieAccept.addEventListener("click", function () {
      localStorage.setItem(cookieKey, "accepted");
      cookieBanner.classList.remove("is-visible");
      cookieBanner.setAttribute("aria-hidden", "true");
    });
    setTimeout(showCookieBanner, 2000);
  }

  /* ======================================================================
     REFRESH trigger math once fonts + loader settle
     ====================================================================== */
  window.addEventListener("load", function () {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
