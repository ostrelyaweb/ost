const MAX_BODY_BYTES = 8192;
const EMAIL = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i;
const LOCALES = new Set(["en", "hr", "bs", "sr-rs", "sr-me", "sl", "mk", "sq"]);
const responseHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function fail(status, error, headers = {}) {
  return Response.json({ error }, { status, headers: { ...responseHeaders, ...headers } });
}

async function readFields(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  }
}

async function handleEnquiry(request, env, url) {
  if (request.method !== "POST") return fail(405, "method", { Allow: "POST" });
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if ((!local && url.hostname !== "ostrelya.com") || request.headers.get("Origin") !== url.origin) {
    return fail(403, "origin");
  }
  if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") {
    return fail(415, "content_type");
  }
  if (!env.CONTACT_MAIL || !env.CONTACT_TO || !env.CONTACT_LIMIT || !env.CONTACT_BUDGET) {
    return fail(503, "unavailable");
  }

  const fields = await readFields(request);
  if (!fields || typeof fields !== "object") return fail(400, "invalid");
  const { name, email, message, page, locale, companyWebsite } = fields;
  if (typeof name !== "string" || !name.trim() || name.length > 100 || /[\r\n\x00]/.test(name) ||
      typeof email !== "string" || email.length > 160 || !EMAIL.test(email) ||
      typeof message !== "string" || !message.trim() || message.length > 1500 || message.includes("\x00") ||
      typeof page !== "string" || page.length > 180 || !/^\/[a-z0-9/-]*$/.test(page) ||
      !LOCALES.has(locale) || companyWebsite !== "") {
    return fail(400, "invalid");
  }

  const client = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const [perClient, overall] = await Promise.all([
      env.CONTACT_LIMIT.limit({ key: "ip:" + client }),
      env.CONTACT_BUDGET.limit({ key: "all" }),
    ]);
    if (!perClient.success || !overall.success) return fail(429, "rate_limit", { "Retry-After": "60" });

    const result = await env.CONTACT_MAIL.send({
      to: env.CONTACT_TO,
      from: "hello@ostrelya.com",
      replyTo: email,
      subject: `Ostrelya website enquiry [${locale}]`,
      text: `Page: ${page}\nLanguage: ${locale}\nName: ${name.trim()}\nEmail: ${email}\n\n${message.trim()}`,
    });
    if (!result?.messageId) return fail(502, "delivery");
    return Response.json({ accepted: true }, { status: 202, headers: responseHeaders });
  } catch (error) {
    console.error("Enquiry transport error", String(error?.code || "unavailable").slice(0, 64));
    return fail(502, "delivery");
  }
}

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

    if (url.pathname === '/api/enquiry') return handleEnquiry(request, env, url);

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
