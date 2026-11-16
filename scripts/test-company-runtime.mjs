#!/usr/bin/env node
/**
 * Local verification for the Vercel company runtime.
 * Does not mutate production data. Mocks Supabase RPC where needed.
 * Never prints secret values.
 */
import assert from 'node:assert/strict';
import { createHmac, createHash, randomUUID } from 'node:crypto';
import { handleCompanyRequest, __test, rpc } from '../server/company-app.mjs';

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
  }
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
