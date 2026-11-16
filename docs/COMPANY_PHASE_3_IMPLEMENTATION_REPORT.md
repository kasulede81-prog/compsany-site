# DKASU Company Platform — Phase 3 Implementation Report

**Date:** 16 November 2026  
**Status:** Source implementation complete. **Not published / not deployed by the agent.**  
**Backend:** Existing Supabase project `ljaedextsenbkxzzgxcg` via `public.company_*` RPCs  
**Owner confirmation used:** No D1 business data requires migration.

## Summary

The company Site Worker now uses Supabase as the primary production database for public content, catalog, inquiries, service profiles, work records and CMS. Cloudflare D1 remains bound for platform compatibility but is **not** read or written for company business operations.

No D1→Supabase migration pipeline, dual-write, shadow-read or comparison workflow was built.

## Files changed

| File | Change |
| --- | --- |
| `worker/core.js` | Replaced D1 SQL with Supabase RPC client, HMAC inquiries, rate limiting, default CMS seed |
| `worker/ui/admin.js` | Added `Dkasu Global` and `Dkasu Digital` to admin service list |
| `scripts/build-worker.mjs` | Unchanged (still bundles core + UI) |
| `dist/server/index.js` | Rebuilt locally for syntax verification (publish artifact) |
| `.env.example` | Documents required secret names (no values) |
| `cloudflare-env.d.ts` | Declares Supabase/HMAC env bindings |
| `scripts/verify-company-secrets.mjs` | Presence/format check without printing secret values |
| `docs/COMPANY_BACKEND_ADAPTER_DESIGN.md` | Marked Phase 3 implemented |
| `docs/COMPANY_PHASE_3_IMPLEMENTATION_REPORT.md` | This report |

## Architecture

### Public

- `GET /api/public` → `company_public_get_bootstrap`
- Worker merges allowlisted site JSON with code defaults when empty
- Divisions come from DB `public_listed` rows (Global/Digital stay unpublished)

### Inquiries

- `POST /api/inquiries` → Worker honeypot + Cache API IP rate limit (10/10m) → HMAC sign → `company_worker_create_inquiry`
- Browser never receives HMAC secret or service_role

### Admin

- Gate: active POS `super_admin` / `operations_admin` via cookie JWT + `waka_internal_me` / admin RPCs
- ChatGPT `ADMIN_EMAIL` alone can no longer mutate Supabase company data (must open from POS)
- `GET /api/admin/data` → `company_admin_get_bootstrap` (seeds default CMS once if empty)
- Content / items / inquiries / records / profiles → corresponding `company_admin_*` RPCs
- `GET /api/admin/status` → boolean config flags only (no secret values)

## Seven divisions

Hardcoded catalog includes all seven. Public responses only expose the five `public_listed` divisions until Global/Digital are approved in DB.

## Required secrets (verify, do not log values)

| Name | Required | Purpose |
| --- | --- | --- |
| `POS_SUPABASE_URL` | Yes | `https://…supabase.co` |
| `POS_SUPABASE_ANON_KEY` | Yes | Public/anon RPC + user JWT Authorization |
| `COMPANY_INQUIRY_HMAC_SECRET` | Yes | ≥32 chars; Worker signer |
| `ADMIN_EMAIL` | Optional | HTML break-glass only; not sufficient for Supabase CRUD |
| DB `company.runtime_secrets.inquiry_hmac_secret` | Yes | Must match Worker HMAC secret |

Local check (after exporting secrets into the shell):

```bash
node scripts/verify-company-secrets.mjs
```

## D1 status

- `env.DB` may still exist on the Sites binding
- Phase 3 code paths do **not** call D1 for business data
- `/api/admin/status` reports `d1UsedForBusiness: false`
- D1 database and historical rows are **not** deleted

## Local verification performed

- `node --check worker/core.js` — pass
- `node scripts/build-worker.mjs` — pass
- `node --check dist/server/index.js` — pass
- Confirmed no `env.DB.prepare` / D1 business SQL in `worker/core.js`
- **Not run against production Supabase or published Site** (restricted)

## Owner test plan before publication

1. Confirm Sites secrets set: URL, anon key, HMAC (≥32), matching DB runtime secret.
2. Publish Site build when ready (owner action).
3. Public: `/`, `/products`, `/services/*`, `/contact` load; Global/Digital not public.
4. Submit inquiry → appears in admin Requests; honeypot ignored; rate limit soft-fails.
5. Unsigned direct RPC inquiry still fails (Phase 2.1).
6. POS Super Admin / Operations Admin open Company dashboard → `/api/admin/data` OK.
7. Support Admin / Field Agent / merchant JWT denied.
8. Admin CRUD: content, catalog item, profile, record, inquiry follow-up.
9. Unpublished catalog item not on `/api/public`.
10. Empty CMS: first admin load seeds defaults; public still shows defaults if empty.
11. Call `/api/admin/status` and confirm flags without secret leakage.

## Remaining risks

| Risk | Notes |
| --- | --- |
| HMAC DB secret mismatch | Inquiries return 503 `Inquiry service is not configured` / unauthorized |
| Publication still pending | Source ready; live Site unchanged until owner publishes |
| ChatGPT-only admin path | Intentionally cannot write Supabase data without POS session |
| Cache API rate limit | Best-effort per edge; DB throttle remains authoritative |
| POS button still local | Company entry on `pos.dkasu.com` may still be unpublished |

## Explicit non-actions

- No migrations applied
- No Edge Function deploys
- No website publish / DNS changes
- No GitHub push
- No hospitality / merchant POS modifications
- No D1 deletion

## Stop

Awaiting owner review, secret confirmation, staging/production smoke tests, and explicit approval to publish the Site.
