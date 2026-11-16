# Company backend adapter design

**Status:** Phase 3 Supabase adapters ported to Vercel (`server/company-app.mjs` + `api/index.mjs`). `worker/core.js` remains Cloudflare reference only. D1 is not used for company business operations.

## Goal

Keep current public/admin HTTP shapes while using Supabase company RPCs as the authoritative store.

## Implementation

All routing and Supabase access live in `server/company-app.mjs`, served by Vercel via `api/index.mjs` (`vercel.json` rewrites). Assets are embedded by `scripts/build-company.mjs`.

## Mapping

| Endpoint | Supabase path |
| --- | --- |
| `GET /api/public` | `company_public_get_bootstrap` + Worker default merge |
| `POST /api/inquiries` | Worker rate limit + honeypot + HMAC → `company_worker_create_inquiry` |
| `GET /api/admin/data` | `company_admin_get_bootstrap` (Bearer POS JWT); seeds defaults if empty |
| `GET /api/admin/status` | Config flags only (no secret values) |
| `POST /api/admin/content` | `company_admin_upsert_site_content` |
| `POST/DELETE /api/admin/items` | catalog admin RPCs |
| `POST /api/admin/inquiries` | `company_admin_update_inquiry` |
| `POST/DELETE /api/admin/records` | work record admin RPCs |
| `POST /api/admin/profiles` | `company_admin_upsert_service_profile` |

## Auth

- Admin APIs require POS cookie JWT for active `super_admin` or `operations_admin`.
- Worker re-checks role via `waka_internal_me`; RPCs re-check `is_waka_internal_admin()`.
- ChatGPT `ADMIN_EMAIL` alone cannot perform Supabase CRUD.

## Secrets

| Name | Use |
| --- | --- |
| `POS_SUPABASE_URL` | Existing |
| `POS_SUPABASE_ANON_KEY` | Public RPCs + user JWT |
| `COMPANY_INQUIRY_HMAC_SECRET` | Worker-only; must match `company.runtime_secrets.inquiry_hmac_secret` |
| `ADMIN_EMAIL` | Optional HTML break-glass only |

**Never** put `service_role` in the Sites Worker or any browser bundle.

## Failure mode

Supabase RPC failures return HTTP 4xx/5xx. There is no silent fallback to D1 (avoids split-brain).
