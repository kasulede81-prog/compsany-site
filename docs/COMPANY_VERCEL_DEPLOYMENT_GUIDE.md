# DKASU Company — Vercel Deployment Guide

**Do not deploy until the owner approves GitHub push and this guide’s checklist.**

## Exact Vercel import settings

| Setting | Value |
| --- | --- |
| Git repository | `kasulede81-prog/compsany-site` |
| Framework Preset | **Other** (project sets `"framework": null`) |
| Root Directory | repository root (this site) |
| Build Command | `npm run build` |
| Output Directory | `public` |
| Install Command | `npm install` |
| Node.js Version | **22.x** (matches `package.json` engines) |

`vercel.json` already defines rewrites so all dynamic paths go to `/api` (`api/index.mjs`).

## Environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Name | Environments | Value source |
| --- | --- | --- |
| `POS_SUPABASE_URL` | Production (+ Preview optional) | `https://ljaedextsenbkxzzgxcg.supabase.co` |
| `POS_SUPABASE_ANON_KEY` | Production (+ Preview optional) | Supabase anon / public key (same project as POS) |
| `COMPANY_INQUIRY_HMAC_SECRET` | Production (+ Preview optional) | Same value as DB `company.runtime_secrets.inquiry_hmac_secret` (≥32 chars) |
| `ADMIN_EMAIL` | Optional | ChatGPT break-glass email for HTML gate only |

Rules:

- Do **not** add `NEXT_PUBLIC_*` or `VITE_*` variants of the HMAC secret.
- Do **not** use the Supabase **service_role** key.
- Do **not** put secrets in `vercel.json` or GitHub Actions logs.
- After changing HMAC, update **both** Vercel and Supabase SQL in the same window.

Verify presence without printing values (local shell with vars exported, or Vercel CLI pull into a gitignored file):

```bash
npm run verify:secrets
```

## Database prerequisite

Owner has already applied Phase 2 / 2.1 migrations and configured `inquiry_hmac_secret`.

Read-only check in Supabase SQL Editor (no secret value shown):

```sql
select
  key,
  char_length(value) as secret_length,
  (char_length(value) >= 32) as meets_minimum_length,
  updated_at
from company.runtime_secrets
where key = 'inquiry_hmac_secret';
```

## Deploy steps (after GitHub has the code)

1. Create / open Vercel project linked to `compsany-site`.
2. Confirm import settings above.
3. Set environment variables.
4. Deploy **Preview** first.
5. Smoke test Preview URL:
   - `/`, `/products`, `/about`, `/contact`, `/services/pos`
   - `GET /api/public` returns JSON with site + items
   - Contact form (expect success only if HMAC matches)
   - `/admin` without POS cookie → denied
   - Open from POS Super Admin / Operations Admin → dashboard loads
6. Promote / redeploy **Production**.
7. Custom domain / DNS — **later**, not part of this migration step.

## Local development (no Vercel deploy required)

```bash
npm run build
npm run dev:company
# http://127.0.0.1:3456
```

Export the three required env vars in the shell first for live Supabase calls. Without them, HTML still serves; `/api/*` returns configuration errors.

## Rate limiting note

Vercel functions are multi-instance. Inquiry throttling is enforced in Postgres (`company_worker_create_inquiry`): per-email and per-client-fingerprint limits plus nonce replay protection. Do not reintroduce an in-memory-only limiter as the sole control.

## Rollback

- Cloudflare Worker source remains under `worker/` for reference; Cloudflare deploy was not deleted by this migration.
- Vercel rollback: redeploy previous Deployment in the Vercel dashboard.
- Data remains in Supabase regardless of host.
