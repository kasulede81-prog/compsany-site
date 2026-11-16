# DKASU Company — Vercel Migration Report

**Date:** 16 November 2026  
**Status:** Source implementation and local verification complete. **No GitHub push. No Vercel deploy.**  
**Verdict:** **PASS (local release-ready)** — pending owner approval to push and deploy.

## Architecture selected

**Static-capable Vercel project + single Node.js serverless entry (`api/index.mjs`) rewriting all dynamic routes.**

| Layer | Choice |
| --- | --- |
| Hosting | Vercel |
| Runtime | Node.js serverless (`api/index.mjs`) |
| App logic | `server/company-app.mjs` (Web `Request`/`Response`) |
| UI | Existing vanilla `worker/ui/*` (appearance preserved) |
| Data | Existing Supabase project `ljaedextsenbkxzzgxcg` via `public.company_*` RPCs |
| Auth | POS JWT cookie `dkasu_pos_admin` + `waka_internal_me` role gate |
| Inquiry security | Server HMAC + DB nonce/replay + DB email/fp throttles |
| Cloudflare | Left intact as reference under `worker/`; not used by Vercel runtime |

Why this shape: the site is not a React app — forcing vinext/Next for HTML would add complexity without benefit. One Node handler preserves route behaviour and response formats.

## Phase A — Security audit findings

| Finding | Action |
| --- | --- |
| `.env.example` contained real URL / anon key / HMAC values | Replaced with placeholders immediately |
| Those values were **not** in Git history (`.env*` was ignored) | No force history rewrite needed |
| `.gitignore` ignored `.env.example` | Fixed: ignore `.env*` but `!.env.example` |
| Missing `.vercel` ignore | Added |
| Prior screenshot / local paste of HMAC | **Treat as exposed** — owner must ensure the live HMAC is a **new** secret (not the previously exposed value). Do not reuse. Agent did not print values. |

## Files created / modified

### Created
- `server/company-app.mjs` — production request handler
- `api/index.mjs` — Vercel Node adapter
- `scripts/build-company.mjs` — asset embed builder
- `scripts/dev-company.mjs` — local Node server
- `scripts/test-company-runtime.mjs` — mocked route/HMAC/auth tests
- `scripts/scan-secrets.mjs` — secret pattern scanner
- `vercel.json` — rewrites, headers, build settings
- `public/.gitkeep` — Vercel output directory placeholder
- `docs/COMPANY_VERCEL_MIGRATION_REPORT.md` (this file)
- `docs/COMPANY_GITHUB_RELEASE_CHECKLIST.md`
- `docs/COMPANY_VERCEL_DEPLOYMENT_GUIDE.md`

### Modified
- `.env.example` — placeholders only
- `.gitignore` — safer env / Vercel / generated asset rules
- `package.json` — Vercel-first scripts (`build`, `dev`, `test`, secret checks)
- `scripts/build-worker.mjs` — delegates to `build-company.mjs`
- `scripts/verify-company-secrets.mjs` — Vercel-oriented comments
- `worker/core.js` — marked deprecated reference for Cloudflare rollback

### Unchanged (intentionally)
- Supabase migrations / POS merchant code
- Cloudflare deployment / D1
- DNS / custom domains

## Routes preserved

| Route | Method | Behaviour |
| --- | --- | --- |
| `/`, `/products`, `/about`, `/contact`, `/services/*` | GET | Public HTML SPA shell |
| `/api/public` | GET | `company_public_get_bootstrap` |
| `/api/inquiries` | POST | Honeypot + validate + HMAC → `company_worker_create_inquiry` |
| `/admin` | GET | HTML; POS Super/Operations Admin required for data UI |
| `/admin/pos-login` | POST | Sets HttpOnly cookie after `waka_internal_me` check |
| `/api/admin/status` | GET | Config flags only (no secret values) |
| `/api/admin/data` | GET | `company_admin_get_bootstrap` (+ default CMS seed) |
| `/api/admin/content` | POST | CMS upsert |
| `/api/admin/items` | POST/DELETE | Catalog CRUD |
| `/api/admin/inquiries` | POST | Inquiry follow-up |
| `/api/admin/records` | POST/DELETE | Work records |
| `/api/admin/profiles` | POST | Service profiles |

## Divisions

- Seven divisions remain in code catalog.
- Public responses still only surface DB `public_listed` rows (Global / Digital stay unpublished until approved).
- No fake products or prices created.

## Inquiry security (Phase E)

| Control | Implementation |
| --- | --- |
| Validation | Name / email / message length |
| Honeypot | `website` field → fake success |
| HMAC | Node `crypto.createHmac` over canonical `v1|…` payload |
| Timestamp / nonce | Sent to RPC; DB verifies |
| Replay | `company.inquiry_nonces` unique nonce |
| Rate limit | **Database-backed** email (1h) + client_fp (10 / 10m). Cloudflare Cache API removed. No in-memory Map relied upon across Vercel instances. |
| Errors | Soft messages; no secret leakage |

## Admin authentication (Phase F)

- API mutations require POS cookie JWT and active `super_admin` or `operations_admin`.
- `ADMIN_EMAIL` / ChatGPT header alone **cannot** call admin RPCs.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=3600`, `Secure` when HTTPS / `x-forwarded-proto=https`.
- Origin check retained on non-GET admin APIs.

## GitHub remote status

| Item | Status |
| --- | --- |
| Target | `https://github.com/kasulede81-prog/compsany-site.git` |
| `git ls-remote` | Empty (no commits / no refs) — safe to push main without force |
| Local repo | Existing `main` history from Sites starter |
| Push | **Not performed** (awaiting owner approval) |

## Build / test results

| Check | Result |
| --- | --- |
| `node scripts/build-company.mjs` | PASS |
| `node --check server/company-app.mjs` | PASS |
| `node --check api/index.mjs` | PASS |
| `node scripts/test-company-runtime.mjs` | PASS (14/14) |
| `node scripts/scan-secrets.mjs` | PASS (0 hits) |

## Environment configuration (Vercel)

Set for Production (and Preview if desired):

| Name | Required | Notes |
| --- | --- | --- |
| `POS_SUPABASE_URL` | Yes | `https://ljaedextsenbkxzzgxcg.supabase.co` |
| `POS_SUPABASE_ANON_KEY` | Yes | Anon key from POS / Supabase (not service_role) |
| `COMPANY_INQUIRY_HMAC_SECRET` | Yes | ≥32 chars; must match DB `inquiry_hmac_secret` |
| `ADMIN_EMAIL` | Optional | HTML break-glass only |

Never put secrets in `vercel.json`, client JS, or GitHub.

## Remaining manual steps (owner)

1. Confirm HMAC in DB is **not** the previously exposed value; rotate if needed (SQL + Vercel env together).
2. Approve GitHub push of local commit.
3. Import repo in Vercel; set env vars; deploy.
4. Smoke-test public pages, inquiry, POS admin open.
5. Point DNS later (out of scope here).

## Blockers before publication

| Blocker | Severity |
| --- | --- |
| Owner confirmation that live HMAC ≠ previously exposed key | High (security) |
| GitHub push not yet approved | Process |
| Vercel project / env not yet created | Process |
| End-to-end production smoke test not run by agent | Expected |

## Explicit non-actions

- No push, deploy, DNS, migrations, Edge Functions, or production data mutations.
- No POS merchant / hospitality code changes.
- Cloudflare Site / D1 not deleted.
