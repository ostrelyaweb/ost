(() => {
  const storageKey = 'ostrelya-locale';
  const dismissedKey = 'ostrelya-locale-dismissed';
  const locales = new Set(['en', 'hr', 'bs', 'sr-rs', 'sr-me', 'sl', 'mk', 'sq']);
  const countryStatus = document.querySelector('[data-country-status]');
  const refreshButton = document.querySelector('[data-refresh-locale]');
  const croatian = document.documentElement.lang === 'hr';
  const popup = document.querySelector('[data-locale-options]');
  const options = popup ? JSON.parse(popup.dataset.localeOptions) : [];
  const root = document.documentElement;
  let detectedLocale = 'en';
  let dismissed = false;
  let refreshing = false;
  try { dismissed = sessionStorage.getItem(dismissedKey) === '1'; } catch { /* Use in-memory state. */ }
  const read = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Links still work with storage disabled. */ }
  };
  const savedLocale = () => {
    const prefix = `${storageKey}=`;
    const cookie = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
    return cookie?.slice(prefix.length) ?? read(storageKey);
  };
  const setLocaleCookie = (locale, maxAge) => {
    if (location.protocol === 'https:') {
      document.cookie = `${storageKey}=${locale}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`;
    }
  };
  const rememberLocale = (locale) => {
    write(storageKey, locale);
    setLocaleCookie(locale, 31536000);
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[data-locale]');
    if (link && locales.has(link.dataset.locale)) {
      rememberLocale(link.dataset.locale);
    }
  });

  const reset = document.querySelector('[data-reset-locale]');
  reset?.addEventListener('click', () => {
    const status = document.querySelector('#locale-reset-status');
    try {
      setLocaleCookie('', 0);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(dismissedKey);
      sessionStorage.removeItem(dismissedKey);
      status.textContent = reset.dataset.resetMessage;
    } catch {
      status.textContent = reset.dataset.resetError;
    }
  });

  async function detectLocation() {
    try {
      const response = await fetch('/api/locale', {
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error'
      });
      if (response.ok) {
        const result = await response.json();
        return {
          locale: locales.has(result.locale) ? result.locale : 'en',
          country: /^[A-Z]{2}$/.test(result.country ?? '') && !['XX', 'ZZ'].includes(result.country)
            ? result.country : null
        };
      }
    } catch { /* The English page remains available. */ }
    return { locale: 'en', country: null };
  }

  function showLanguageSuggestion() {
    if (typeof popup?.showModal !== 'function' || dismissed || document.hidden ||
        root.classList.contains('studio-intro') || document.querySelector('dialog[open]')) return;
    const selected = options.find((item) => item.key === detectedLocale);
    if (!selected || locales.has(savedLocale()) || new URLSearchParams(location.search).get('lang') === 'en') return;

    popup.lang = selected.lang;
    popup.querySelector('#locale-prompt').textContent = selected.prompt;
    const action = popup.querySelector('.locale-dialog-primary');
    action.textContent = selected.choose;
    action.href = selected.href;
    action.hreflang = selected.lang;
    action.dataset.locale = selected.key;
    popup.querySelector('[data-keep-english]').textContent = selected.stay;
    popup.showModal();
  }

  if (popup) {
    popup.querySelector('[data-keep-english]').addEventListener('click', () => {
      rememberLocale('en');
      popup.close();
    });
    popup.addEventListener('close', () => {
      dismissed = true;
      try { sessionStorage.setItem(dismissedKey, '1'); } catch { /* Use in-memory state. */ }
    });

    if (root.classList.contains('studio-intro')) {
      const observer = new MutationObserver(() => {
        if (root.classList.contains('studio-intro')) return;
        observer.disconnect();
        showLanguageSuggestion();
      });
      observer.observe(root, { attributeFilter: ['class'] });
    }
  }

  function showCountry(country) {
    if (!countryStatus) return;
    let name = country;
    if (country) {
      try { name = new Intl.DisplayNames([croatian ? 'hr' : 'en'], { type: 'region' }).of(country); }
      catch { /* The country code remains readable in older browsers. */ }
    }
    const locationLabel = croatian
      ? (name ? 'Lokacija veze: ' + name : 'Lokacija veze nije dostupna')
      : (name ? 'Connection location: ' + name : 'Connection location unavailable');
    countryStatus.textContent = locationLabel;
    countryStatus.closest('[data-locale-connection]').hidden = false;
  }

  async function refreshLocation() {
    if (refreshing) return;
    refreshing = true;
    if (refreshButton) refreshButton.disabled = true;
    try {
      const result = await detectLocation();
      detectedLocale = result.locale;
      showCountry(result.country);
      showLanguageSuggestion();
    } finally {
      refreshing = false;
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  if (refreshButton) {
    refreshButton.textContent = croatian ? 'Provjeri lokaciju' : 'Check location';
    refreshButton.addEventListener('click', refreshLocation);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshLocation();
  });
  window.addEventListener('online', refreshLocation);
  refreshLocation();
})();
