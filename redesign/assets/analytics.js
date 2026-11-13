(() => {
  const config = document.querySelector('meta[name="ostrelya-analytics"]');
  const panel = document.querySelector('.analytics-consent');
  const settings = document.querySelector('[data-analytics-settings]');
  if (!config || !panel || !settings) return;

  const id = config.content;
  const disableKey = `ga-disable-${id}`;
  const storageKey = 'ostrelya-analytics-consent-v1';
  const choiceLifetime = 180 * 86400000;
  let choice = savedChoice();
  let tag;
  let pageReported = false;
  let startedForms = new WeakSet();

  function savedChoice() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored?.expires > Date.now() && ['granted', 'denied'].includes(stored.choice)) {
        return stored.choice;
      }
    } catch {
      // A blocked store leaves the choice scoped to the current page.
    }
    return null;
  }

  function pageLocation() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const path = canonical ? new URL(canonical.href).pathname : location.pathname;
    const url = new URL(path, location.origin);
    const parameters = new URLSearchParams(location.search);
    for (const name of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term']) {
      const value = parameters.get(name);
      if (value && /^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value)) {
        url.searchParams.set(name, value);
      }
    }
    return url.href;
  }

  function pageReferrer() {
    if (!document.referrer) return '';
    return new URL(document.referrer).origin;
  }

  function track(name, fields = {}) {
    if (choice !== 'granted' || !tag) return;
    tag('event', name, { ...fields, send_to: id });
  }

  function applyChoice() {
    window[disableKey] = choice !== 'granted';
    if (choice !== 'granted') {
      for (const name of ['_ga', `_ga_${id.slice(2)}`]) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      }
      startedForms = new WeakSet();
      return;
    }
    if (!tag) {
      window.dataLayer = window.dataLayer || [];
      tag = function () { window.dataLayer.push(arguments); };
      tag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      tag('js', new Date());
      tag('config', id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: 'none',
        cookie_expires: choiceLifetime / 1000,
        cookie_update: false,
        page_location: pageLocation(),
        page_referrer: pageReferrer(),
      });
      const script = document.createElement('script');
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.append(script);
    }
    if (!pageReported) {
      pageReported = true;
      track('page_view');
      if (config.dataset.group === 'service') track('view_service');
      if (config.dataset.group === 'guide') track('view_guide');
    }
  }

  function showPanel(open, moveFocus = false) {
    panel.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
    if (moveFocus) {
      (open ? panel.querySelector('h2') : settings).focus();
    }
  }

  settings.hidden = false;
  settings.setAttribute('aria-controls', panel.id);
  settings.addEventListener('click', () => showPanel(panel.hidden, true));
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') showPanel(false, true);
  });
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-analytics-choice]');
    if (!button) return;
    choice = button.dataset.analyticsChoice;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ choice, expires: Date.now() + choiceLifetime }));
    } catch {
      // The choice still applies to this page.
    }
    applyChoice();
    showPanel(false, event.detail === 0);
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    choice = savedChoice();
    applyChoice();
    showPanel(!choice);
  });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    choice = savedChoice();
    applyChoice();
    showPanel(!choice);
  });

  document.addEventListener('input', (event) => {
    const form = event.target.closest('[data-enquiry-form]');
    if (!form || event.target.name === 'companyWebsite' || choice !== 'granted' || startedForms.has(form)) return;
    startedForms.add(form);
    track('enquiry_start');
  });
  document.addEventListener('ostrelya:enquiry-accepted', (event) => {
    if (!event.target.matches('[data-enquiry-form]')) return;
    startedForms.delete(event.target);
    track('generate_lead');
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('main [data-analytics-service-link]');
    if (link) track('guide_to_service');
  });

  applyChoice();
  showPanel(!choice);
})();
