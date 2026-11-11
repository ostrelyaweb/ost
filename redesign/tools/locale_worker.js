const countryLocales = new Map([
  ['HR', 'hr'],
  ['BA', 'bs'],
  ['RS', 'sr-rs'],
  ['ME', 'sr-me'],
  ['SI', 'sl'],
  ['MK', 'mk'],
  ['XK', 'sq']
]);
const locales = new Set(['en', ...countryLocales.values()]);
const preferenceCookie = 'ostrelya-locale';
const privateHeaders = { 'Cache-Control': 'private, no-store' };

function savedLocale(request) {
  const cookies = request.headers.get('Cookie') ?? '';
  for (const cookie of cookies.split(';')) {
    const [name, value] = cookie.trim().split('=');
    if (name === preferenceCookie && locales.has(value)) return value;
  }
}

function isCrawler(request) {
  return request.cf?.botManagement?.verifiedBot === true ||
    /(?:bot\b|crawler|spider|Google-InspectionTool)/i.test(request.headers.get('User-Agent') ?? '');
}

async function home(request, env, url) {
  const chooseEnglish = url.searchParams.get('lang') === 'en';
  const isInternalNavigation = request.headers.get('Sec-Fetch-Site') === 'same-origin';
  const locale = chooseEnglish || isInternalNavigation || isCrawler(request)
    ? 'en'
    : savedLocale(request) ?? 'en';

  if (locale !== 'en') {
    url.pathname = `/${locale}/`;
    return new Response(null, {
      status: 302,
      headers: { ...privateHeaders, Location: url.toString() }
    });
  }

  const asset = await env.ASSETS.fetch(request);
  const response = new Response(asset.body, asset);
  response.headers.set('Cache-Control', privateHeaders['Cache-Control']);
  if (chooseEnglish && request.method === 'GET' && response.ok) {
    response.headers.append('Set-Cookie', `${preferenceCookie}=en; Path=/; Max-Age=31536000; Secure; SameSite=Lax`);
  }
  return response;
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/locale') {
      const headers = { ...privateHeaders, 'X-Content-Type-Options': 'nosniff' };
      if (request.method !== 'GET') {
        return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } });
      }
      const detectedCountry = request.cf?.country;
      const locale = countryLocales.get(detectedCountry) ?? 'en';
      const country = /^[A-Z]{2}$/.test(detectedCountry ?? '') && !['XX', 'ZZ'].includes(detectedCountry)
        ? detectedCountry
        : null;
      return Response.json({ locale, country }, { headers });
    }

    if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
      return home(request, env, url);
    }
    return env.ASSETS.fetch(request);
  }
};
