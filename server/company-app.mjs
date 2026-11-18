/**
 * DKASU company site — Vercel / Node fetch handler.
 * Active production runtime (Supabase RPCs). Cloudflare Worker source under worker/ is reference only.
 */
import {
  SITE_CSS,
  SITE_LOGO_LIGHT,
  SITE_LOGO_DARK,
  SITE_ICON,
  PUBLIC_JS,
  ADMIN_JS,
} from './generated-assets.mjs';
import { createHmac, createHash, randomUUID } from 'node:crypto';
import {
  buildSeoHead,
  notFoundPage,
  robotsTxt,
  sitemapXml,
  resolvePageMeta,
} from './seo.mjs';
import {
  isWhatsAppShortLink,
  normalizeWhatsAppDigits,
  WHATSAPP_DEFAULT_DIGITS,
} from '../lib/whatsapp.mjs';

const services = [
  { id: 'Dkasu Computer Arena', slug: 'computer-arena', eyebrow: 'COMPUTERS & ACCESSORIES', title: 'Computers for every next step.', summary: 'Shop refurbished and new laptops, desktops and computer accessories through DKASU Computer Arena.', icon: 'monitor', status: 'Current', websiteUrl: 'https://computer.dkasu.com' },
  { id: 'DkasuPOS', slug: 'pos', eyebrow: 'BUSINESS SOFTWARE', title: 'DKASU POS — run your business with clarity.', summary: 'Offline-first POS and business management for retail, restaurants, pharmacies and supermarkets — sales, inventory, staff, reporting and loyalty.', icon: 'panels', status: 'Current', websiteUrl: 'https://pos.dkasu.com' },
  { id: 'DkasuLoyalty', slug: 'loyalty', eyebrow: 'BUSINESS SOFTWARE', title: 'Stay connected to your customers.', summary: 'Loyalty software for customer engagement.', icon: 'gift', status: 'Current', websiteUrl: 'https://loyalty.dkasu.com' },
  // No independent website confirmed for Vision — omit websiteUrl until verified.
  { id: 'DkasuVision', slug: 'vision', eyebrow: 'CCTV SERVICES', title: 'A clearer view of what matters.', summary: 'CCTV installation services for homes and businesses.', icon: 'camera', status: 'Current', websiteUrl: '' },
  { id: 'DkasuLogistic', slug: 'logistic', eyebrow: 'SHIPPING & LOGISTICS', title: 'Logistics that keeps business moving.', summary: 'DkasuLogistic provides shipping and logistics services.', icon: 'truck', status: 'In production' },
  { id: 'Dkasu Global', slug: 'global', eyebrow: 'STUDY & TRAVEL', title: 'Study and travel guidance for Europe.', summary: 'European study and travel consultancy. Overseas job placement is not offered.', icon: 'globe', status: 'Planning' },
  { id: 'Dkasu Digital', slug: 'digital', eyebrow: 'DIGITAL SERVICES', title: 'Websites and digital services.', summary: 'Website design, development and related digital services.', icon: 'code', status: 'Planning' },
];
const publicServiceIds = new Set(['Dkasu Computer Arena', 'DkasuPOS', 'DkasuLoyalty', 'DkasuVision', 'DkasuLogistic']);
const defaults = {
  heroKicker: 'DKASU SOFTWARE & BUSINESS SOLUTIONS',
  heroTitle: 'Business software, computers and IT for Uganda.',
  heroText: 'DKASU develops practical technology for shops and growing businesses — POS software, computers, website development and IT services — with a contact location in Rome, Italy.',
  heroImage: '',
  aboutTitle: 'Technology for people and business.',
  aboutText: 'DKASU is the commercial brand of Waka Marketplace Limited. We deliver business software and POS systems, computer hardware and IT services, website development, digital loyalty tools and related technology services across Uganda and Italy.',
  contactTitle: 'What can we help you find?',
  contactText: 'Tell us what you need and the DKASU team can follow up.',
  contactWhatsApp: '+256 765 146 177',
  contactWhatsAppLink: '',
  contactEmail: 'support@waka.ug',
  contactInternationalEmail: 'intl@dkasu.com',
  contactItalyPhone: '+39 353 207 6882',
  contactItalyAddress: 'Via Bernardino Alimena 31B, 00173 Roma (RM), Italy',
  contactAddress: 'Namasuba, Entebbe Road, Kampala, Uganda',
  contactPostal: 'P.O. Box 209034, Namasuba, Entebbe Road, Kampala, Uganda',
  contactHours: 'Monday–Friday 8:00 AM–6:00 PM · Saturday 10:00 AM–4:00 PM · Sunday closed',
  footerText: 'DKASU is the commercial brand of Waka Marketplace Limited.',
  linksVersion: 1,
  services: services.filter((s) => publicServiceIds.has(s.id)),
  sections: [],
};
const legacyCopy = {
  heroKicker: 'CONNECTED BY PURPOSE',
  heroTitle: 'Technology, service and opportunity in motion.',
  heroText: 'Dkasu brings computers and accessories, CCTV installation and business management software together under WAKA Marketplace Limited, serving Italy and Uganda.',
  aboutTitle: 'Built around the needs of real business.',
  aboutText: 'Dkasu is a connected group of technology and service offerings under WAKA Marketplace Limited. Our work spans computers and accessories, CCTV installation, and business management software across Italy and Uganda.',
  contactTitle: 'Let’s talk about what you need.',
  contactText: 'Tell us what you are looking for and the Dkasu team can follow up.',
  footerText: 'Dkasu is part of WAKA Marketplace Limited.',
};
const legacyServices = {
  'Dkasu Computer Arena': ['Technology for the way you work.', 'Explore computers and accessories through Dkasu Computer Arena.'],
  DkasuPOS: ['A point of sale experience for business.', 'DkasuPOS is part of our business management software offering.'],
  DkasuLoyalty: ['Make every customer connection count.', 'DkasuLoyalty is part of our business management software offering.'],
  DkasuVision: ['See what matters. Protect what matters.', 'CCTV installation services for customers in our markets.'],
  DkasuLogistic: ['The next route forward.', 'Future shipping and logistics operations are in planning.'],
};
const siteFieldKeys = [
  'heroKicker', 'heroTitle', 'heroText', 'heroImage', 'aboutTitle', 'aboutText', 'contactTitle', 'contactText',
  'contactWhatsApp', 'contactWhatsAppLink', 'contactEmail', 'contactInternationalEmail', 'contactItalyPhone',
  'contactItalyAddress', 'contactAddress', 'contactPostal', 'contactHours', 'footerText',
];

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });

const htmlPage = (script, { pathname = '/' } = {}) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${buildSeoHead(
    { pathname, isAdmin: script === 'admin' },
  )}<meta name="theme-color" content="#fffaf5"><link rel="icon" href="${SITE_ICON}"><style>${SITE_CSS}</style></head><body><div id="app"></div><script>const SITE_LOGO_LIGHT=${JSON.stringify(
    SITE_LOGO_LIGHT,
  )},SITE_LOGO_DARK=${JSON.stringify(SITE_LOGO_DARK)},SITE_ICON=${JSON.stringify(SITE_ICON)};${
    script === 'admin' ? ADMIN_JS : PUBLIC_JS
  }</script></body></html>`;

const textResponse = (body, contentType, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'content-type': contentType,
      'cache-control': contentType.includes('xml') || contentType.includes('plain') ? 'public, max-age=300' : 'no-store',
      ...SECURITY_HEADERS,
    },
  });

const isPublicHtmlPath = (path) => {
  if (path === '/' || path === '/products' || path === '/about' || path === '/contact') return true;
  const match = path.match(/^\/services\/([a-z0-9-]+)$/);
  if (!match) return false;
  return services.some((s) => s.slug === match[1] && publicServiceIds.has(s.id));
};

const POS_COOKIE = 'dkasu_pos_admin';

export function getEnv(env = process.env) {
  return {
    POS_SUPABASE_URL: env.POS_SUPABASE_URL || '',
    POS_SUPABASE_ANON_KEY: env.POS_SUPABASE_ANON_KEY || '',
    COMPANY_INQUIRY_HMAC_SECRET: env.COMPANY_INQUIRY_HMAC_SECRET || '',
    ADMIN_EMAIL: env.ADMIN_EMAIL || '',
  };
}

const posToken = (req) => {
  const part = (req.headers.get('cookie') || '')
    .split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${POS_COOKIE}=`));
  return part ? decodeURIComponent(part.slice(POS_COOKIE.length + 1)) : '';
};

const supabaseReady = (env) =>
  !!(env.POS_SUPABASE_URL && env.POS_SUPABASE_ANON_KEY && String(env.POS_SUPABASE_URL).startsWith('https://'));
const hmacReady = (env) =>
  !!(env.COMPANY_INQUIRY_HMAC_SECRET && String(env.COMPANY_INQUIRY_HMAC_SECRET).length >= 32);
const chatGptAdmin = (req, env) => {
  const email = req.headers.get('oai-authenticated-user-email');
  return !!(email && env.ADMIN_EMAIL && email.trim().toLowerCase() === String(env.ADMIN_EMAIL).trim().toLowerCase());
};

const sha256Hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const hmacHex = (secret, message) => createHmac('sha256', secret).update(message, 'utf8').digest('hex');

export async function rpc(env, { name, args = {}, token = null, timeoutMs = 10000, fetchImpl = fetch }) {
  const endpoint = new URL(`/rest/v1/rpc/${name}`, env.POS_SUPABASE_URL);
  if (endpoint.protocol !== 'https:') throw Error('Invalid Supabase URL');
  const headers = {
    apikey: env.POS_SUPABASE_ANON_KEY,
    'content-type': 'application/json',
    accept: 'application/json',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  else headers.authorization = `Bearer ${env.POS_SUPABASE_ANON_KEY}`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const msg = data?.message || data?.error_description || data?.error || text || `RPC ${name} failed`;
    const err = Error(String(msg));
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data;
}

const posAdmin = async (token, env, fetchImpl = fetch) => {
  if (!token || token.length > 8192 || !/^[-\w]+\.[-\w]+\.[-\w]+$/.test(token) || !supabaseReady(env)) return false;
  try {
    const rows = await rpc(env, { name: 'waka_internal_me', args: {}, token, timeoutMs: 5000, fetchImpl });
    return Array.isArray(rows) && rows.some((row) => row?.active === true && ['super_admin', 'operations_admin'].includes(row.role));
  } catch {
    return false;
  }
};

const pageAdmin = async (req, env, fetchImpl) => chatGptAdmin(req, env) || posAdmin(posToken(req), env, fetchImpl);
const apiAdmin = async (req, env, fetchImpl) => posAdmin(posToken(req), env, fetchImpl);
const deny = (msg = 'Admin access required') => json({ error: msg }, 403);

const normalizeDivision = (d) => {
  const base = services.find((s) => s.id === d.id || s.slug === d.slug) || {};
  return {
    id: d.id || base.id,
    slug: d.slug || base.slug || '',
    eyebrow: d.eyebrow || base.eyebrow || '',
    title: d.title || base.title || '',
    summary: d.summary || base.summary || '',
    icon: d.icon || base.icon || '',
    status: d.status || base.status || 'Current',
    websiteUrl: d.websiteUrl ?? d.website_url ?? base.websiteUrl ?? '',
    showcaseTier: d.showcaseTier || d.showcase_tier || base.showcaseTier || 'standard',
    sortOrder: d.sortOrder ?? d.sort_order ?? 0,
  };
};

const mergeSite = (saved = {}, divisionRows = null) => {
  const next = { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) };
  for (const [key, old] of Object.entries(legacyCopy)) if (next[key] === old) next[key] = defaults[key];
  const catalog =
    Array.isArray(divisionRows) && divisionRows.length
      ? divisionRows.map(normalizeDivision)
      : services.filter((s) => publicServiceIds.has(s.id));
  const edits = Array.isArray(saved.services) ? saved.services : [];
  next.services = catalog.map((s) => {
    const edit = edits.find((x) => x.id === s.id) || {};
    const old = legacyServices[s.id];
    return {
      ...s,
      title: edit.title && edit.title !== old?.[0] ? String(edit.title).slice(0, 120) : s.title,
      summary: edit.summary && edit.summary !== old?.[1] ? String(edit.summary).slice(0, 500) : s.summary,
      websiteUrl: saved.linksVersion ? edit.websiteUrl ?? s.websiteUrl : edit.websiteUrl || s.websiteUrl,
      eyebrow: s.eyebrow,
      icon: s.icon,
      status: s.status,
      slug: s.slug,
    };
  });
  if (!Array.isArray(next.sections)) next.sections = [];
  return next;
};

/** Prefer Vercel / proxy client IP. Never trust for auth — used only for soft fingerprinting. */
const clientIp = (req) => {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim() || 'unknown';
  return req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
};

/**
 * Edge Cache API rate limiting is Cloudflare-specific and not reliable across Vercel instances.
 * Authoritative limits live in company_worker_create_inquiry (email + client_fp throttles + nonce replay).
 * This soft gate is intentionally a no-op pass-through so security does not depend on in-memory Maps.
 */
const rateLimitSoft = async () => true;

const validUrl = (value) => !value || /^https:\/\//i.test(value);

const publicBootstrap = async (env, fetchImpl) => {
  const data = await rpc(env, { name: 'company_public_get_bootstrap', args: {}, fetchImpl });
  if (!data || data.ok === false) throw Error(data?.error || 'Public content unavailable');
  const site = mergeSite(data.site || {}, data.divisions || []);
  const items = Array.isArray(data.items) ? data.items : [];
  return { site, items, divisions: data.divisions || [] };
};

const ensureDefaultSite = async (env, token, currentSite, fetchImpl) => {
  const empty =
    !currentSite ||
    !Object.keys(currentSite).length ||
    (!currentSite.heroTitle && !currentSite.footerText);
  if (!empty) return false;
  const seed = {
    ...defaults,
    services: services.map((s) => ({ id: s.id, title: s.title, summary: s.summary, websiteUrl: s.websiteUrl || '' })),
    linksVersion: 1,
  };
  await rpc(env, { name: 'company_admin_upsert_site_content', args: { p_value: seed }, token, fetchImpl });
  return true;
};

const adminBootstrap = async (env, token, fetchImpl) => {
  let data = await rpc(env, { name: 'company_admin_get_bootstrap', args: {}, token, fetchImpl });
  if (!data || data.ok === false) throw Error(data?.error || 'Admin data unavailable');
  if (await ensureDefaultSite(env, token, data.site, fetchImpl)) {
    data = await rpc(env, { name: 'company_admin_get_bootstrap', args: {}, token, fetchImpl });
  }
  const divisionRows = Array.isArray(data.divisions) ? data.divisions.map(normalizeDivision) : services;
  const site = mergeSite(data.site || {}, divisionRows);
  return {
    site,
    items: Array.isArray(data.items) ? data.items : [],
    records: Array.isArray(data.records) ? data.records : [],
    profiles: Array.isArray(data.profiles) ? data.profiles : [],
    inquiries: Array.isArray(data.inquiries) ? data.inquiries : [],
    divisions: divisionRows,
  };
};

const createInquiry = async (request, env, body, fetchImpl) => {
  if (!hmacReady(env)) return json({ error: 'Inquiry service is not configured.' }, 503);
  if (!(await rateLimitSoft(request))) return json({ error: 'Too many inquiries from this network. Please try again later.' }, 429);
  if (body.website) return json({ ok: true });
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const message = String(body.message || '').trim().slice(0, 2000);
  const interest = String(body.interest || '').trim().slice(0, 100);
  const market = String(body.market || '').trim().slice(0, 50);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10) {
    return json({ error: 'Please add your name, a valid email and a message of at least 10 characters.' }, 400);
  }
  const ts = Math.floor(Date.now() / 1000);
  const nonce = randomUUID();
  const ip = clientIp(request);
  const ua = request.headers.get('user-agent') || '';
  const client_fp = sha256Hex(`${ip}|${ua}`);
  const payload = `v1|${ts}|${nonce}|${name}|${email}|${message}|${interest}|${market}|${client_fp}`;
  const signature = hmacHex(String(env.COMPANY_INQUIRY_HMAC_SECRET), payload);
  try {
    const result = await rpc(env, {
      name: 'company_worker_create_inquiry',
      args: {
        p_name: name,
        p_email: email,
        p_message: message,
        p_interest: interest,
        p_market: market,
        p_honeypot: null,
        p_ts: ts,
        p_nonce: nonce,
        p_signature: signature,
        p_client_fp: client_fp,
      },
      fetchImpl,
    });
    if (result?.ok) return json({ ok: true });
    if (result?.error === 'rate_limited') return json({ error: 'Too many inquiries. Please try again later.' }, 429);
    if (result?.error === 'validation') return json({ error: result.message || 'Please check your inquiry details.' }, 400);
    if (result?.error === 'server_misconfigured') return json({ error: 'Inquiry service is not configured.' }, 503);
    if (['unauthorized', 'expired', 'replay'].includes(result?.error)) return json({ error: 'Unable to submit inquiry right now.' }, 403);
    return json({ error: result?.message || result?.error || 'Unable to submit inquiry.' }, 400);
  } catch {
    return json({ error: 'Unable to submit inquiry right now.' }, 502);
  }
};

const htmlResponse = (body, { admin = false, status = 200 } = {}) =>
  new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      ...SECURITY_HEADERS,
      ...(admin || status === 404 ? { 'x-robots-tag': 'noindex, nofollow' } : {}),
    },
  });

const authDeniedHtml = (css, title, message, showChatGpt) =>
  `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dkasu Admin</title><meta name="robots" content="noindex,nofollow"><style>${css}</style><main class="auth-page"><div class="auth-card"><a href="/" class="wordmark">D<span>·</span>kasu</a><p class="kicker">ADMIN WORKSPACE</p><h1>${title}</h1><p>${message}</p>${
    showChatGpt
      ? `<a class="primary-btn" href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top">Sign in with ChatGPT →</a>`
      : ''
  }<a class="text-link" href="/">Return to website</a></div></main>`;

/**
 * @param {Request} request
 * @param {Record<string, string>} [env]
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export async function handleCompanyRequest(request, envInput = process.env, options = {}) {
  const env = getEnv(envInput);
  const fetchImpl = options.fetchImpl || fetch;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/robots.txt' && request.method === 'GET') {
    return textResponse(robotsTxt(), 'text/plain; charset=utf-8');
  }
  if (path === '/sitemap.xml' && request.method === 'GET') {
    return textResponse(sitemapXml(), 'application/xml; charset=utf-8');
  }

  if (isPublicHtmlPath(path)) {
    return htmlResponse(htmlPage('public', { pathname: path }));
  }

  if (path.startsWith('/services/') || (!path.startsWith('/api') && !path.startsWith('/admin') && request.method === 'GET')) {
    // Unknown public paths: HTML 404 (do not leak API JSON to browsers / crawlers).
    if (!path.startsWith('/api') && path !== '/favicon.ico') {
      return htmlResponse(notFoundPage({ css: SITE_CSS, logoSrc: SITE_LOGO_LIGHT }), {
        admin: true,
        status: 404,
      });
    }
  }

  if (path === '/admin/pos-login' && request.method === 'POST') {
    const form = await request.formData();
    const token = String(form.get('access_token') || '');
    if (!(await posAdmin(token, env, fetchImpl))) {
      return new Response(
        'DkasuPOS administrator access could not be verified. Return to DkasuPOS and try again.',
        {
          status: 403,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store',
            'x-robots-tag': 'noindex, nofollow',
            ...SECURITY_HEADERS,
          },
        },
      );
    }
    const secure = url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    const cookie = `${POS_COOKIE}=${encodeURIComponent(token)}; HttpOnly; ${
      secure ? 'Secure; ' : ''
    }SameSite=Lax; Path=/; Max-Age=3600`;
    return new Response(null, {
      status: 303,
      headers: {
        location: '/admin',
        'set-cookie': cookie,
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
        ...SECURITY_HEADERS,
      },
    });
  }

  if (path === '/admin') {
    const allowed = await pageAdmin(request, env, fetchImpl);
    const hasPos = await posAdmin(posToken(request), env, fetchImpl);
    const oaiEmail = request.headers.get('oai-authenticated-user-email');
    if (!allowed) {
      return htmlResponse(
        authDeniedHtml(
          SITE_CSS,
          oaiEmail ? 'Access restricted' : 'Sign in to manage Dkasu',
          oaiEmail
            ? 'This account is not configured as the Dkasu administrator.'
            : 'Open this dashboard from the DkasuPOS admin menu, or sign in with the Dkasu administrator ChatGPT account.',
          !oaiEmail,
        ),
        { admin: true },
      );
    }
    if (chatGptAdmin(request, env) && !hasPos) {
      return htmlResponse(
        authDeniedHtml(
          SITE_CSS,
          'POS administrator session required',
          'Company data now uses the DkasuPOS Supabase company schema. Open this dashboard from the DkasuPOS admin menu while signed in as Super Admin or Operations Admin.',
          false,
        ),
        { admin: true },
      );
    }
    return htmlResponse(htmlPage('admin'), { admin: true });
  }

  // Public readiness probe — boolean flags only, never secret values.
  if (path === '/api/health' && request.method === 'GET') {
    return json({
      ok: supabaseReady(env) && hmacReady(env),
      runtime: 'vercel',
      backend: 'supabase',
      supabaseConfigured: supabaseReady(env),
      hmacConfigured: hmacReady(env),
      d1UsedForBusiness: false,
      rateLimitMode: 'database',
    });
  }

  if (!supabaseReady(env)) {
    return json(
      {
        error: 'Supabase is not configured for this Site.',
        code: 'supabase_not_configured',
        hint: 'Set POS_SUPABASE_URL and POS_SUPABASE_ANON_KEY on the Vercel project (Production and Preview), then redeploy.',
      },
      500,
    );
  }

  try {
    if (path === '/api/public' && request.method === 'GET') return json(await publicBootstrap(env, fetchImpl));
    if (path === '/api/inquiries' && request.method === 'POST') {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }
      return createInquiry(request, env, body || {}, fetchImpl);
    }
    if (path.startsWith('/api/admin/')) {
      const token = posToken(request);
      if (!(await apiAdmin(request, env, fetchImpl))) {
        return deny('Open this dashboard from DkasuPOS as Super Admin or Operations Admin.');
      }
      if (request.method !== 'GET') {
        const origin = request.headers.get('origin');
        if (origin && origin !== url.origin) return deny();
      }
      if (path === '/api/admin/status' && request.method === 'GET') {
        return json({
          ok: true,
          backend: 'supabase',
          runtime: 'vercel',
          supabaseConfigured: supabaseReady(env),
          hmacConfigured: hmacReady(env),
          d1Bound: false,
          d1UsedForBusiness: false,
          rateLimitMode: 'database',
          adminRoleGate: ['super_admin', 'operations_admin'],
        });
      }
      if (path === '/api/admin/data' && request.method === 'GET') return json(await adminBootstrap(env, token, fetchImpl));
      if (path === '/api/admin/content' && request.method === 'POST') {
        const body = await request.json();
        const next = { ...defaults, ...body };
        next.services = services.map((s) => {
          const edit = (Array.isArray(body.services) ? body.services : []).find((x) => x.id === s.id) || {};
          return {
            ...s,
            title: String(edit.title || s.title).slice(0, 120),
            summary: String(edit.summary || s.summary).slice(0, 500),
            websiteUrl: validUrl(edit.websiteUrl) ? String(edit.websiteUrl || '').slice(0, 500) : '',
          };
        });
        next.sections = Array.isArray(body.sections)
          ? body.sections.slice(0, 12).map((x) => ({
              id: String(x.id || randomUUID()),
              title: String(x.title || '').slice(0, 120),
              text: String(x.text || '').slice(0, 1000),
            }))
          : [];
        for (const key of siteFieldKeys) next[key] = String(body[key] ?? defaults[key]).slice(0, 2000);
        next.linksVersion = 1;
        if (!validUrl(next.heroImage)) next.heroImage = '';
        if (!isWhatsAppShortLink(next.contactWhatsAppLink)) next.contactWhatsAppLink = '';
        {
          const rawDigits = String(next.contactWhatsApp || '').replace(/\D/g, '');
          if (rawDigits.length < 10 || rawDigits.length > 15) next.contactWhatsApp = defaults.contactWhatsApp;
        }
        const result = await rpc(env, { name: 'company_admin_upsert_site_content', args: { p_value: next }, token, fetchImpl });
        if (!result?.ok) return json({ error: result?.error || 'Could not save content' }, 400);
        return json({ ok: true });
      }
      if (path === '/api/admin/items' && request.method === 'POST') {
        const body = await request.json();
        const payload = {
          id: body.id || undefined,
          service: String(body.service || ''),
          name: String(body.name || ''),
          category: String(body.category || ''),
          condition: String(body.condition || ''),
          summary: String(body.summary || ''),
          imageUrl: String(body.imageUrl || ''),
          websiteUrl: String(body.websiteUrl || ''),
          status: String(body.status || 'Available'),
          featured: !!body.featured,
          published: !!body.published,
          priceAmount: body.priceAmount ?? '',
          priceCurrency: body.priceCurrency ?? '',
          stockQty: body.stockQty ?? '',
          specs: body.specs && typeof body.specs === 'object' ? body.specs : {},
          sku: body.sku || '',
          warrantyInfo: body.warrantyInfo || '',
          serialNumber: body.serialNumber || '',
        };
        if (!payload.name || !payload.service) return json({ error: 'Name and service required' }, 400);
        if (!validUrl(payload.websiteUrl) || !validUrl(payload.imageUrl)) return json({ error: 'Links must start with https://' }, 400);
        const result = await rpc(env, { name: 'company_admin_upsert_catalog_item', args: { p_item: payload }, token, fetchImpl });
        if (!result?.ok) return json({ error: result?.error || 'Could not save item' }, 400);
        return json({ ok: true, id: result.id });
      }
      if (path === '/api/admin/items' && request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'ID required' }, 400);
        const result = await rpc(env, { name: 'company_admin_delete_catalog_item', args: { p_id: id }, token, fetchImpl });
        if (!result?.ok) return json({ error: result?.error || 'Could not delete item' }, 400);
        return json({ ok: true });
      }
      if (path === '/api/admin/inquiries' && request.method === 'POST') {
        const b = await request.json();
        const result = await rpc(env, {
          name: 'company_admin_update_inquiry',
          args: { p_patch: { id: b.id, status: b.status, owner: b.owner, followUp: b.followUp } },
          token,
          fetchImpl,
        });
        if (!result?.ok) return json({ error: result?.error || 'Could not update inquiry' }, 400);
        return json({ ok: true });
      }
      if (path === '/api/admin/records' && request.method === 'POST') {
        const b = await request.json();
        const payload = {
          id: b.id || undefined,
          service: b.service,
          kind: b.kind,
          title: b.title,
          status: b.status,
          owner: b.owner,
          market: b.market,
          notes: b.notes,
          pricing: b.pricing,
          technicalLink: b.technicalLink,
          customerFollowUp: b.customerFollowUp,
          readiness: b.readiness,
          nextAction: b.nextAction,
          dueDate: b.dueDate,
        };
        if (!payload.service || !payload.kind || !payload.title) return json({ error: 'Service, type and title required' }, 400);
        const result = await rpc(env, { name: 'company_admin_upsert_work_record', args: { p_record: payload }, token, fetchImpl });
        if (!result?.ok) return json({ error: result?.error || 'Could not save record' }, 400);
        return json({ ok: true, id: result.id });
      }
      if (path === '/api/admin/records' && request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'ID required' }, 400);
        const result = await rpc(env, { name: 'company_admin_delete_work_record', args: { p_id: id }, token, fetchImpl });
        if (!result?.ok) return json({ error: result?.error || 'Could not delete record' }, 400);
        return json({ ok: true });
      }
      if (path === '/api/admin/profiles' && request.method === 'POST') {
        const b = await request.json();
        const payload = {
          service: b.service,
          status: b.status,
          owner: b.owner,
          notes: b.notes,
          pricing: b.pricing,
          technicalLink: b.technicalLink,
          customerFollowUp: b.customerFollowUp,
          readiness: b.readiness,
        };
        if (!payload.service) return json({ error: 'Service required' }, 400);
        const result = await rpc(env, { name: 'company_admin_upsert_service_profile', args: { p_profile: payload }, token, fetchImpl });
        if (!result?.ok) return json({ error: result?.error || 'Could not save profile' }, 400);
        return json({ ok: true });
      }
      return json({ error: 'Not found' }, 404);
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    return json({ error: String(error.message || error) }, status === 401 || status === 403 ? 403 : status);
  }
}

export const __test = {
  sha256Hex,
  hmacHex,
  mergeSite,
  supabaseReady,
  hmacReady,
  services,
  publicServiceIds,
  POS_COOKIE,
  isPublicHtmlPath,
  resolvePageMeta,
  isWhatsAppShortLink,
  normalizeWhatsAppDigits,
  WHATSAPP_DEFAULT_DIGITS,
};
