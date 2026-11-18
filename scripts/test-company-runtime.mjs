#!/usr/bin/env node
/**
 * Local verification for the Vercel company runtime.
 * Does not mutate production data. Mocks Supabase RPC where needed.
 * Never prints secret values.
 */
import assert from 'node:assert/strict';
import { createHmac, createHash, randomUUID } from 'node:crypto';
import { handleCompanyRequest, __test, rpc } from '../server/company-app.mjs';
import {
  WHATSAPP_DEFAULT_DIGITS,
  WHATSAPP_GENERIC_MESSAGE,
  buildPrefillMessage,
  buildWhatsAppUrl,
  isWhatsAppShortLink,
  normalizeWhatsAppDigits,
  resolveDivisionKey,
  sanitizePageUrl,
} from '../lib/whatsapp.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error.message || error) });
  }
};
const checkAsync = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error.message || error) });
  }
};

const mockEnv = {
  POS_SUPABASE_URL: 'https://example.supabase.co',
  POS_SUPABASE_ANON_KEY: 'test-anon-key',
  COMPANY_INQUIRY_HMAC_SECRET: 'a'.repeat(64),
  ADMIN_EMAIL: 'owner@example.com',
};

check('seven divisions present', () => {
  assert.equal(__test.services.length, 7);
  assert.ok(__test.publicServiceIds.has('DkasuPOS'));
  assert.equal(__test.publicServiceIds.has('Dkasu Global'), false);
  assert.equal(__test.publicServiceIds.has('Dkasu Digital'), false);
});

check('hmac helpers', () => {
  const msg = 'v1|1|nonce|n|e@x.com|hello world!!|i|m|fp';
  const a = __test.hmacHex(mockEnv.COMPANY_INQUIRY_HMAC_SECRET, msg);
  const b = createHmac('sha256', mockEnv.COMPANY_INQUIRY_HMAC_SECRET).update(msg, 'utf8').digest('hex');
  assert.equal(a, b);
  assert.equal(__test.sha256Hex('x'), createHash('sha256').update('x', 'utf8').digest('hex'));
});

check('config gates', () => {
  assert.equal(__test.supabaseReady(mockEnv), true);
  assert.equal(__test.hmacReady(mockEnv), true);
  assert.equal(__test.hmacReady({ COMPANY_INQUIRY_HMAC_SECRET: 'short' }), false);
  assert.equal(__test.supabaseReady({ POS_SUPABASE_URL: 'http://insecure', POS_SUPABASE_ANON_KEY: 'x' }), false);
});

await checkAsync('public HTML routes', async () => {
  for (const path of ['/', '/products', '/about', '/contact', '/services/pos']) {
    const res = await handleCompanyRequest(new Request(`https://site.test${path}`), mockEnv, {
      fetchImpl: async () => {
        throw new Error('should not call supabase for static html');
      },
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    const body = await res.text();
    assert.match(body, /id="app"/);
    assert.match(body, /rel="canonical"/);
    assert.match(body, /application\/ld\+json/);
    assert.match(body, /og:title/);
    assert.match(body, /twitter:card/);
    assert.match(body, /lang="en"/);
  }
});

await checkAsync('homepage SEO title and organization graph', async () => {
  const res = await handleCompanyRequest(new Request('https://www.dkasu.com/'), mockEnv, {
    fetchImpl: async () => {
      throw new Error('no supabase for html');
    },
  });
  const body = await res.text();
  assert.match(body, /<title>DKASU \| Business Software, POS Systems &amp; IT Solutions Uganda<\/title>|<title>DKASU \| Business Software, POS Systems & IT Solutions Uganda<\/title>/);
  assert.match(body, /Waka Marketplace Limited/);
  assert.match(body, /https:\/\/www\.dkasu\.com\/#organization/);
  assert.match(body, /https:\/\/pos\.dkasu\.com\/#software/);
  assert.match(body, /"@type":"SoftwareApplication"/);
  assert.match(body, /Denis Kasule/);
  assert.match(body, /foundingDate":"2025-12"/);
  assert.doesNotMatch(body, /vision\.dkasu\.com/);
});

await checkAsync('robots and sitemap', async () => {
  const robots = await handleCompanyRequest(new Request('https://www.dkasu.com/robots.txt'), mockEnv);
  assert.equal(robots.status, 200);
  const robotsBody = await robots.text();
  assert.match(robotsBody, /Sitemap: https:\/\/www\.dkasu\.com\/sitemap\.xml/);
  assert.match(robotsBody, /Disallow: \/admin/);
  assert.match(robotsBody, /Disallow: \/api/);
  const sitemap = await handleCompanyRequest(new Request('https://www.dkasu.com/sitemap.xml'), mockEnv);
  assert.equal(sitemap.status, 200);
  const map = await sitemap.text();
  assert.match(map, /<loc>https:\/\/www\.dkasu\.com\/<\/loc>/);
  assert.match(map, /<loc>https:\/\/www\.dkasu\.com\/about<\/loc>/);
  assert.match(map, /\/services\/pos<\/loc>/);
  assert.doesNotMatch(map, /\/admin/);
  assert.doesNotMatch(map, /\/api\//);
});

await checkAsync('unknown public path returns HTML 404', async () => {
  const res = await handleCompanyRequest(new Request('https://www.dkasu.com/not-a-real-page'), mockEnv);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type') || '', /text\/html/);
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
  const body = await res.text();
  assert.match(body, /Page not found/);
});

check('public path helper rejects unknown service slug', () => {
  assert.equal(__test.isPublicHtmlPath('/services/pos'), true);
  assert.equal(__test.isPublicHtmlPath('/services/unknown-division'), false);
  assert.ok(__test.resolvePageMeta('/about'));
  assert.equal(__test.resolvePageMeta('/secret'), null);
});

check('whatsapp default digits and CMS number normalization', () => {
  assert.equal(WHATSAPP_DEFAULT_DIGITS, '256765146177');
  assert.equal(normalizeWhatsAppDigits('+256 765 146 177'), '256765146177');
  assert.equal(normalizeWhatsAppDigits('256765146177'), '256765146177');
  assert.equal(normalizeWhatsAppDigits('+1 (415) 555-0100'), '14155550100');
  assert.equal(normalizeWhatsAppDigits(''), WHATSAPP_DEFAULT_DIGITS);
  assert.equal(normalizeWhatsAppDigits('abc'), WHATSAPP_DEFAULT_DIGITS);
  assert.equal(normalizeWhatsAppDigits('12345'), WHATSAPP_DEFAULT_DIGITS);
  assert.equal(normalizeWhatsAppDigits('++--', '256700000000'), '256700000000');
  assert.equal(__test.normalizeWhatsAppDigits('+256765146177'), '256765146177');
});

check('whatsapp short link validation', () => {
  assert.equal(isWhatsAppShortLink('https://wa.me/message/5KOFXON5IJYMJ1'), true);
  assert.equal(isWhatsAppShortLink('https://wa.me/256765146177'), false);
  assert.equal(isWhatsAppShortLink('http://wa.me/message/5KOFXON5IJYMJ1'), false);
  assert.equal(isWhatsAppShortLink('https://evil.example/message/5KOFXON5IJYMJ1'), false);
  assert.equal(isWhatsAppShortLink(''), false);
  assert.equal(__test.isWhatsAppShortLink('https://wa.me/message/ABC123'), true);
});

check('whatsapp division routing keys', () => {
  assert.equal(resolveDivisionKey('DkasuPOS'), 'pos');
  assert.equal(resolveDivisionKey('pos'), 'pos');
  assert.equal(resolveDivisionKey('Dkasu Computer Arena'), 'computer');
  assert.equal(resolveDivisionKey('computer-arena'), 'computer');
  assert.equal(resolveDivisionKey('DkasuLoyalty'), 'loyalty');
  assert.equal(resolveDivisionKey('DkasuVision'), 'vision');
  assert.equal(resolveDivisionKey('DkasuLogistic'), 'logistic');
  assert.equal(resolveDivisionKey('Dkasu Digital'), 'digital');
  assert.equal(resolveDivisionKey('DKASU services'), 'general');
  assert.equal(resolveDivisionKey(''), 'general');
});

check('whatsapp public CTAs never use wa.me/message short links', () => {
  const brokenShort = 'https://wa.me/message/5KOFXON5IJYMJ1';
  const cfg = {
    contactWhatsApp: '+256 765 146 177',
    contactWhatsAppLink: brokenShort,
  };

  const expectedGeneric =
    `https://wa.me/256765146177?text=${encodeURIComponent(WHATSAPP_GENERIC_MESSAGE)}`;
  assert.equal(WHATSAPP_GENERIC_MESSAGE, 'Hello DKASU, I need assistance.');

  const generic = buildWhatsAppUrl({ ...cfg, mode: 'generic', division: 'general' });
  assert.equal(generic, expectedGeneric);
  assert.doesNotMatch(generic, /wa\.me\/message\//);
  assert.notEqual(generic, brokenShort);

  const pos = buildWhatsAppUrl({ ...cfg, mode: 'contextual', division: 'DkasuPOS' });
  assert.match(pos, /^https:\/\/wa\.me\/256765146177\?text=/);
  assert.match(decodeURIComponent(pos.split('text=')[1]), /DKASU POS/);
  assert.doesNotMatch(pos, /wa\.me\/message\//);

  const computer = buildWhatsAppUrl({
    ...cfg,
    mode: 'contextual',
    division: 'Dkasu Computer Arena',
    pageUrl: 'https://www.dkasu.com/services/computer-arena?utm=1',
  });
  const computerText = decodeURIComponent(computer.split('text=')[1]);
  assert.match(computerText, /Computer Arena|computers and accessories/i);
  assert.match(computerText, /Ref: https:\/\/www\.dkasu\.com\/services\/computer-arena/);
  assert.doesNotMatch(computerText, /utm=/);
  assert.doesNotMatch(computer, /wa\.me\/message\//);

  const product = buildWhatsAppUrl({
    ...cfg,
    mode: 'contextual',
    division: 'Dkasu Computer Arena',
    productName: 'Dell Latitude 5420',
    pageUrl: 'https://computer.dkasu.com/laptops/dell-latitude-5420',
  });
  const productText = decodeURIComponent(product.split('text=')[1]);
  assert.match(productText, /Dell Latitude 5420/);
  assert.match(productText, /Ref: https:\/\/computer\.dkasu\.com\/laptops\/dell-latitude-5420/);
  assert.doesNotMatch(productText, /@|customer|password|token/i);
  assert.doesNotMatch(product, /wa\.me\/message\//);

  const digital = buildWhatsAppUrl({ ...cfg, mode: 'contextual', division: 'Dkasu Digital' });
  assert.match(decodeURIComponent(digital.split('text=')[1]), /Digital/);
  assert.doesNotMatch(digital, /wa\.me\/message\//);

  const cmsAlt = buildWhatsAppUrl({
    contactWhatsApp: '+256700111222',
    contactWhatsAppLink: brokenShort,
    mode: 'generic',
  });
  assert.equal(
    cmsAlt,
    `https://wa.me/256700111222?text=${encodeURIComponent(WHATSAPP_GENERIC_MESSAGE)}`,
  );

  const samples = [generic, pos, computer, product, digital, cmsAlt];
  for (const url of samples) {
    assert.doesNotMatch(url, /wa\.me\/message\//);
    assert.match(url, /^https:\/\/wa\.me\/\d+\?text=/);
  }

  assert.equal(sanitizePageUrl('https://evil.com/phish'), '');
  assert.equal(sanitizePageUrl('/services/pos?interest=x'), '/services/pos');
  assert.match(buildPrefillMessage({ division: 'vision' }), /CCTV/);
});

check('whatsapp helper is embedded in generated public assets', () => {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const generated = readFileSync(path.join(root, '../server/generated-assets.mjs'), 'utf8');
  assert.match(generated, /function buildWhatsAppUrl/);
  assert.match(generated, /waGeneric/);
  assert.match(generated, /waDivision/);
  assert.match(generated, /waProduct/);
  assert.match(generated, /256765146177/);
  assert.match(generated, /Hello DKASU, I need assistance\./);
  assert.doesNotMatch(generated, /Hello Dkasu, I would like to ask about \$\{subject\}/);
  // Defaults / fallbacks must not plant the retired Business short link.
  assert.doesNotMatch(generated, /5KOFXON5IJYMJ1/);
  // Public URL builder must ignore legacy short links even if CMS still stores one.
  assert.match(generated, /_legacyShortLinkIgnored|ignored for URL generation|never use wa\.me\/message/i);
});

await checkAsync('www canonical consistency across SEO surfaces', async () => {
  const { SITE_ORIGIN, sitemapXml, robotsTxt, organizationGraph, BRAND } = await import('../server/seo.mjs');
  assert.equal(SITE_ORIGIN, 'https://www.dkasu.com');
  assert.equal(BRAND.ogImageStatus, 'pending_1200x630');
  assert.deepEqual(BRAND.founderSameAs, ['https://www.linkedin.com/in/kasule-denis-6395b3373']);
  assert.equal(BRAND.italy.formatted, 'Via Bernardino Alimena 31B, 00173 Roma (RM), Italy');
  const map = sitemapXml();
  assert.match(map, /https:\/\/www\.dkasu\.com\//);
  assert.doesNotMatch(map, /<loc>https:\/\/dkasu\.com\//);
  assert.doesNotMatch(map, /market\.dkasu\.com|vision\.dkasu\.com/);
  assert.match(robotsTxt(), /Sitemap: https:\/\/www\.dkasu\.com\/sitemap\.xml/);
  const graph = JSON.stringify(organizationGraph());
  assert.match(graph, /https:\/\/www\.dkasu\.com\/#organization/);
  assert.match(graph, /https:\/\/pos\.dkasu\.com\/#software/);
  assert.match(graph, /kasule-denis-6395b3373/);
  assert.doesNotMatch(graph, /facebook\.com|instagram\.com|twitter\.com|x\.com/);
  const vercel = await import('node:fs').then((fs) =>
    JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')),
  );
  const apexRedirect = (vercel.redirects || []).find(
    (r) => Array.isArray(r.has) && r.has.some((h) => h.value === 'dkasu.com'),
  );
  assert.ok(apexRedirect);
  assert.equal(apexRedirect.destination, 'https://www.dkasu.com/:path*');
  assert.equal(apexRedirect.permanent, true);
});

await checkAsync('GET /api/public uses bootstrap RPC', async () => {
  let called = '';
  const res = await handleCompanyRequest(new Request('https://site.test/api/public'), mockEnv, {
    fetchImpl: async (url, init) => {
      called = String(url);
      assert.match(called, /\/rpc\/company_public_get_bootstrap$/);
      assert.equal(JSON.parse(init.body).constructor, Object);
      return new Response(
        JSON.stringify({
          ok: true,
          site: { heroTitle: 'Hello' },
          items: [],
          divisions: [
            { id: 'DkasuPOS', slug: 'pos', sort_order: 1 },
            { id: 'Dkasu Computer Arena', slug: 'computer-arena', sort_order: 0 },
            { id: 'DkasuLoyalty', slug: 'loyalty', sort_order: 2 },
            { id: 'DkasuVision', slug: 'vision', sort_order: 3 },
            { id: 'DkasuLogistic', slug: 'logistic', sort_order: 4 },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.site);
  assert.equal(data.site.heroTitle, 'Hello');
  assert.ok(Array.isArray(data.site.services));
  assert.ok(!data.site.services.some((s) => s.id === 'Dkasu Global'));
});

await checkAsync('inquiry honeypot short-circuits', async () => {
  const res = await handleCompanyRequest(
    new Request('https://site.test/api/inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Bot',
        email: 'bot@example.com',
        message: 'hello there!!',
        website: 'https://spam.example',
      }),
    }),
    mockEnv,
    {
      fetchImpl: async () => {
        throw new Error('honeypot must not call RPC');
      },
    },
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

await checkAsync('inquiry validation', async () => {
  const res = await handleCompanyRequest(
    new Request('https://site.test/api/inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'bad', message: 'short' }),
    }),
    mockEnv,
    { fetchImpl: async () => new Response('{}', { status: 200 }) },
  );
  assert.equal(res.status, 400);
});

await checkAsync('inquiry signs HMAC and calls worker RPC', async () => {
  let payload = null;
  const res = await handleCompanyRequest(
    new Request('https://site.test/api/inquiries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
        'user-agent': 'test-agent',
      },
      body: JSON.stringify({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Need a CCTV quote please',
        interest: 'DkasuVision',
        market: 'Uganda',
      }),
    }),
    mockEnv,
    {
      fetchImpl: async (url, init) => {
        assert.match(String(url), /\/rpc\/company_worker_create_inquiry$/);
        payload = JSON.parse(init.body);
        const canon = `v1|${payload.p_ts}|${payload.p_nonce}|${payload.p_name}|${payload.p_email}|${payload.p_message}|${payload.p_interest}|${payload.p_market}|${payload.p_client_fp}`;
        const expected = createHmac('sha256', mockEnv.COMPANY_INQUIRY_HMAC_SECRET).update(canon, 'utf8').digest('hex');
        assert.equal(payload.p_signature, expected);
        assert.equal(payload.p_client_fp, createHash('sha256').update('203.0.113.10|test-agent', 'utf8').digest('hex'));
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.ok(payload.p_nonce);
});

await checkAsync('admin APIs require POS session', async () => {
  const res = await handleCompanyRequest(new Request('https://site.test/api/admin/data'), mockEnv, {
    fetchImpl: async () => new Response('[]', { status: 200 }),
  });
  assert.equal(res.status, 403);
});

await checkAsync('admin status with valid POS role', async () => {
  const token = ['aaa', 'bbb', 'ccc'].join('.');
  const res = await handleCompanyRequest(
    new Request('https://site.test/api/admin/status', {
      headers: { cookie: `${__test.POS_COOKIE}=${encodeURIComponent(token)}` },
    }),
    mockEnv,
    {
      fetchImpl: async (url) => {
        if (String(url).includes('waka_internal_me')) {
          return new Response(JSON.stringify([{ active: true, role: 'super_admin' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        throw new Error(`unexpected ${url}`);
      },
    },
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.backend, 'supabase');
  assert.equal(data.runtime, 'vercel');
  assert.equal(data.rateLimitMode, 'database');
  assert.equal(data.d1UsedForBusiness, false);
  assert.equal(typeof data.hmacConfigured, 'boolean');
  assert.ok(!JSON.stringify(data).includes(mockEnv.COMPANY_INQUIRY_HMAC_SECRET));
});

await checkAsync('support_admin denied', async () => {
  const token = ['aaa', 'bbb', 'ccc'].join('.');
  const res = await handleCompanyRequest(
    new Request('https://site.test/api/admin/data', {
      headers: { cookie: `${__test.POS_COOKIE}=${encodeURIComponent(token)}` },
    }),
    mockEnv,
    {
      fetchImpl: async () =>
        new Response(JSON.stringify([{ active: true, role: 'support_admin' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    },
  );
  assert.equal(res.status, 403);
});

await checkAsync('ChatGPT ADMIN_EMAIL alone cannot mutate', async () => {
  const res = await handleCompanyRequest(
    new Request('https://site.test/api/admin/content', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'oai-authenticated-user-email': 'owner@example.com',
        origin: 'https://site.test',
      },
      body: JSON.stringify({ heroTitle: 'x' }),
    }),
    mockEnv,
    {
      fetchImpl: async () => {
        throw new Error('must not reach supabase without POS JWT');
      },
    },
  );
  assert.equal(res.status, 403);
});

await checkAsync('missing supabase config', async () => {
  const res = await handleCompanyRequest(new Request('https://site.test/api/public'), {});
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.code, 'supabase_not_configured');
  assert.ok(!JSON.stringify(body).includes('eyJ'));
});

await checkAsync('public /api/health flags without secrets', async () => {
  const res = await handleCompanyRequest(new Request('https://site.test/api/health'), {});
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.supabaseConfigured, false);
  assert.equal(data.hmacConfigured, false);
  assert.equal(data.ok, false);
  assert.equal(data.runtime, 'vercel');
  const withEnv = await handleCompanyRequest(new Request('https://site.test/api/health'), mockEnv);
  const ready = await withEnv.json();
  assert.equal(ready.supabaseConfigured, true);
  assert.equal(ready.hmacConfigured, true);
  assert.equal(ready.ok, true);
  assert.ok(!JSON.stringify(ready).includes(mockEnv.COMPANY_INQUIRY_HMAC_SECRET));
});

await checkAsync('rpc helper rejects non-https', async () => {
  let threw = false;
  try {
    await rpc(
      { POS_SUPABASE_URL: 'http://evil.example', POS_SUPABASE_ANON_KEY: 'x' },
      { name: 'company_public_get_bootstrap' },
    );
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
});

const failed = results.filter((r) => !r.ok);
console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      passed: results.filter((r) => r.ok).length,
      failed: failed.length,
      results,
      note: 'No production mutations; HMAC tests used mock secret only.',
      nonceSampleShape: randomUUID(),
    },
    null,
    2,
  ),
);
process.exit(failed.length ? 1 : 0);
