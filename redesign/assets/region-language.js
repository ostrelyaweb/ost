(() => {
  const storageKey = 'ostrelya-locale';
  const dismissedKey = 'ostrelya-locale-dismissed';
  const locales = new Set(['en', 'hr', 'bs', 'sr-rs', 'sr-me', 'sl', 'mk', 'sq']);
  const countryStatus = document.querySelector('[data-country-status]');
  const refreshButton = document.querySelector('[data-refresh-locale]');
  const croatian = document.documentElement.lang === 'hr';
  let refreshing = false;
  const setLocaleCookie = (locale, maxAge) => {
    if (location.protocol === 'https:') {
      document.cookie = `${storageKey}=${locale}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`;
    }
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[data-locale]');
    if (link && locales.has(link.dataset.locale)) {
      setLocaleCookie(link.dataset.locale, 31536000);
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

  async function detectCountry() {
    try {
      const response = await fetch('/api/locale', {
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error'
      });
      if (response.ok) {
        const { country } = await response.json();
        if (/^[A-Z]{2}$/.test(country ?? '') && !['XX', 'ZZ'].includes(country)) return country;
      }
    } catch { /* The English page remains available. */ }
    return null;
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
    if (!countryStatus || refreshing) return;
    refreshing = true;
    if (refreshButton) refreshButton.disabled = true;
    try {
      showCountry(await detectCountry());
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
