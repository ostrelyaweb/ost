(() => {
  const storageKey = 'ostrelya-locale';
  const dismissedKey = 'ostrelya-locale-dismissed';
  const locales = new Set(['en', 'hr', 'bs', 'sr-rs', 'sr-me', 'sl', 'mk', 'sq']);
  const countryStatus = document.querySelector('[data-country-status]');
  const refreshButton = document.querySelector('[data-refresh-locale]');
  const croatian = document.documentElement.lang === 'hr';
  let refreshing = false;
  const read = (key, session = false) => {
    try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; }
  };
  const write = (key, value, session = false) => {
    try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* Links still work with storage disabled. */ }
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

  function showLanguageSuggestion(locale) {
    const banner = document.querySelector('[data-locale-options]');
    if (!banner) return;
    banner.hidden = true;
    if (read(dismissedKey, true) === '1') return;
    if (new URLSearchParams(location.search).get('lang') === 'en') return;
    const options = JSON.parse(banner.dataset.localeOptions);
    const preferred = savedLocale();
    if (preferred === 'en') return;

    if (locale === preferred) return;
    const selected = options.find((item) => item.key === locale);
    if (!selected) return;

    banner.lang = selected.lang;
    banner.querySelector('p').textContent = selected.prompt;
    const action = banner.querySelector('a');
    action.textContent = selected.choose;
    action.href = selected.href;
    action.hreflang = selected.lang;
    action.dataset.locale = selected.key;
    const dismiss = banner.querySelector('button');
    dismiss.textContent = selected.stay;
    dismiss.onclick = () => {
      if (banner.hasAttribute('data-remember-english')) {
        rememberLocale('en');
      } else {
        write(dismissedKey, '1', true);
      }
      banner.hidden = true;
    };
    banner.hidden = false;
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
      showCountry(result.country);
      showLanguageSuggestion(result.locale);
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
