# DKASU Company Platform — Phase 2 Implementation Report

**Date:** 16 November 2026  
**Status:** Source preparation complete. **No migrations applied. No deploys. No GitHub push. No live auth changes.**  
**Supabase project (target):** `ljaedextsenbkxzzgxcg`  
**Awaiting:** Owner review and manual apply.

## Documents read

- `/Users/denis/Documents/ChatGPT/dkasu company/DKASU_SITE_BLUEPRINT.md`
- `sites/dkasu-workspace/docs/DKASU_COMPANY_ARCHITECTURE_AUDIT.md`
- `sites/dkasu-workspace/docs/DKASU_COMPANY_IMPLEMENTATION_PLAN.md`
- Existing POS helpers: `is_waka_internal_admin`, `waka_internal_me`, anon EXECUTE hygiene, public RPC grant patterns

## New files

| File | Purpose |
| --- | --- |
| `DkasuPOS-Mac/supabase/migrations/20261116140000_company_schema_foundation.sql` | Schema `company`, seven tables, division seed, grants/default-deny |
| `DkasuPOS-Mac/supabase/migrations/20261116140100_company_rls_and_rpcs.sql` | FORCE RLS policies, public + admin RPCs, audit helper, rate-limit docs |
| `DkasuPOS-Mac/docs/COMPANY_SCHEMA.md` | Schema/authorization reference + D1 mapping |
| `DkasuPOS-Mac/supabase/tests/company_phase2_authorization.sql` | Prepared authorization/behavior tests (**not executed on production**) |
| `sites/dkasu-workspace/docs/COMPANY_SESSION_AND_ADMIN_EMAIL_DESIGN.md` | Safer opaque session design; ADMIN_EMAIL retirement plan |
| `sites/dkasu-workspace/docs/COMPANY_BACKEND_ADAPTER_DESIGN.md` | Phase 3 `DATA_BACKEND` adapter design |
| `sites/dkasu-workspace/docs/COMPANY_PHASE_2_IMPLEMENTATION_REPORT.md` | This report |

### Exact migration filenames

1. `20261116140000_company_schema_foundation.sql`  
2. `20261116140100_company_rls_and_rpcs.sql`

## What was deliberately not touched

- No hospitality source/docs/migrations modified, staged, committed, stashed, reverted, or deployed  
- No merchant table/policy/migration edits  
- No Edge Function deploys  
- No company Site Worker/login changes  
- No DNS / new Supabase project  
- No fake catalog inventory rows  

POS working tree remains dirty with pre-existing hospitality work; only **new** company files were added.

## Security decisions

1. **Schema `company`** inside existing POS project — not merchant tenancy.  
2. **Gate = `is_waka_internal_admin()`** (active `super_admin` \| `operations_admin`).  
3. **RLS + FORCE RLS** on all company tables; policies `to authenticated` using/with-check admin gate.  
4. **Anon:** no schema USAGE, no table grants; public access only via `company_public_*` RPCs.  
5. **Public bootstrap** omits inquiries, profiles, work records, audit, unpublished items, and `public_listed=false` divisions (Global/Digital).  
6. **SECURITY DEFINER** RPCs use `set search_path = company, public` (or `public` for the gate helper), schema-qualified tables, and explicit `revoke all … from public` + narrow EXECUTE grants.  
7. **Admin mutations** audit to `company.audit_events`.  
8. **Inquiry soft throttle** (5/email/hour) plus documented **required** Worker/CDN IP rate limits.  
9. **Optional catalog columns** nullable — no seed prices/stock.  
10. **Session/JWT cookie redesign** documented only; live flow unchanged.

## Division outcomes

- Existing five IDs/slugs preserved exactly (`DkasuLogistic` / `logistic`, etc.).  
- Logistics status: `In production`.  
- Global / Digital: seeded, `Planning`, `public_listed=false`.

## Validation results (Phase 2)

| Check | Result |
| --- | --- |
| Migration files written & readable | **Pass** |
| SQL static parse (`psql` syntax via review; no hosted apply) | **Pass (static)** — files are plpgsql-compatible with project patterns |
| `is_waka_internal_admin` referenced, not redefined | **Pass** |
| No writes to merchant migrations | **Pass** |
| Hospitality dirty files left untouched | **Pass** |
| Prepared test file present | **Pass** |
| Execute tests against production | **Not run** (forbidden) |
| Local `supabase start` full apply | **Not run** (no instruction to start local stack; tests prepared for owner) |

### Static checks performed

```text
# File presence + line counts
20261116140000_company_schema_foundation.sql
20261116140100_company_rls_and_rpcs.sql
# Grep: no DROP of public.shops/products; company schema only
# Division seed strings match worker/core.js IDs/slugs
```

## Unresolved issues / blockers

1. **Owner must apply** migrations manually (staging recommended first).  
2. **PostgREST:** Phase 3 should call `public.company_*` RPCs; exposing schema `company` in API settings is optional and not required.  
3. **Opaque company sessions** and **ADMIN_EMAIL** retirement are design-only until Phase 3+.  
4. **Prepared SQL tests** that stub `request.jwt.claim.sub` need a real JWT harness for full role-matrix proof after apply.  
5. **Untracked hospitality migrations** in the POS tree (`20261115*`) remain unrelated; apply ordering on a clean production baseline should include only reviewed migrations.  
6. Company Site docs / POS new files are **uncommitted**; do not mix into hospitality commits.

## Manual migration application checklist

Use on **staging** first, then production when satisfied.

1. [ ] Backup / snapshot note for project `ljaedextsenbkxzzgxcg` (Dashboard or CLI).  
2. [ ] Confirm `public.is_waka_internal_admin()` exists on the target DB.  
3. [ ] Confirm `public.set_updated_at()` exists.  
4. [ ] Review both SQL files in full.  
5. [ ] Apply `20261116140000_company_schema_foundation.sql`.  
6. [ ] Apply `20261116140100_company_rls_and_rpcs.sql`.  
7. [ ] Verify `\dn company` and `\dt company.*` (7 tables).  
8. [ ] `select id, slug, status, public_listed from company.divisions order by sort_order;` → 7 rows, 5 listed.  
9. [ ] `select count(*) from company.catalog_items;` → 0.  
10. [ ] As anon: `select company_public_get_bootstrap();` → ok, 5 divisions, no inquiries key.  
11. [ ] As anon: `select * from company.inquiries;` → permission denied / empty via API.  
12. [ ] As merchant JWT: `select company_admin_get_bootstrap();` → Forbidden.  
13. [ ] As support_admin / field_agent: admin RPC → Forbidden.  
14. [ ] As super_admin: admin bootstrap OK; upsert site content; row in `company.audit_events`.  
15. [ ] As operations_admin: admin bootstrap OK.  
16. [ ] Merchant smoke: shop/product reads still work.  
17. [ ] Optionally run `supabase/tests/company_phase2_authorization.sql` on staging only.  
18. [ ] Do **not** switch company Site `DATA_BACKEND` yet (Phase 3).  
19. [ ] Do **not** change live `/admin/pos-login` cookie behavior yet.

## Recommended next step (Phase 3 — after your confirmation)

Implement Worker `DATA_BACKEND` adapter (default `d1`) calling the new RPCs in staging, without cutting over production D1 authority.

---

**STOP.** Phase 2 source preparation is complete. Waiting for confirmation before Phase 3.
EOF