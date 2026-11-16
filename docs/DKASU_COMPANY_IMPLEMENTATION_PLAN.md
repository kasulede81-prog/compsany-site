# DKASU Company Platform — Implementation Plan

**Date:** 16 November 2026  
**Depends on:** `docs/DKASU_COMPANY_ARCHITECTURE_AUDIT.md`  
**Blueprint:** `/Users/denis/Documents/ChatGPT/dkasu company/DKASU_SITE_BLUEPRINT.md`  
**Rule:** Owner manually applies database migrations and Edge Function deployments. Owner performs visual testing. Agents must not deploy or mutate production without explicit approval.

---

## Goal

Unify company website content and operations onto the **existing** DKASU POS Supabase project (`ljaedextsenbkxzzgxcg`), while:

- Preserving merchant tenant isolation and all unrelated POS features  
- Keeping the public Site and `/admin` separate from the POS merchant UI  
- Extending from five published divisions to seven without breaking live content  
- Migrating D1 → Supabase with a proven rollback path  

---

## Phase 1 — Read-only architecture and security audit

**Status: COMPLETE (this document pair).**

Deliverables:

- [x] `DKASU_COMPANY_ARCHITECTURE_AUDIT.md`
- [x] `DKASU_COMPANY_IMPLEMENTATION_PLAN.md`

**Exit criteria:** Owner approves findings and authorizes Phase 2 drafting only.

**Do not proceed automatically.**

---

## Phase 2 — Prepare additive Supabase company tables, RLS, authorization

### Objectives

- Design and commit **source-only** SQL migrations under POS `supabase/migrations/`
- No `supabase db push`, no Dashboard SQL apply, no Edge deploy in this phase unless owner explicitly runs them

### Work items

1. **Create schema `company`** (preferred) or `company_*` tables in `public` if schema tooling is blocked.
2. **Tables for D1 parity:**
   - `divisions` (seed five existing + two new Global/Digital as unpublished or `Planning` until Phase 5 copy is approved)
   - `site_content`
   - `catalog_items` (include nullable price/currency/stock/specs columns; leave null)
   - `inquiries`
   - `service_profiles`
   - `work_records`
   - `audit_events`
3. **RLS:**
   - Enable RLS on all company tables
   - Deny merchant access
   - Allow `is_waka_internal_admin()` for full access
   - Public reads only via SECURITY DEFINER RPCs filtering published rows
4. **RPCs (draft):**
   - `company_public_get_bootstrap()` — site JSON + published catalog
   - `company_public_create_inquiry(...)` — validated insert; rate-limit guidance in comments
   - Admin mutations either via RLS + authenticated client or dedicated RPCs that re-check `is_waka_internal_admin()`
5. **Grants:** revoke anon/authenticated defaults as needed; grant execute on public RPCs deliberately.
6. **Documentation:** migration README section: “Owner apply checklist”.

### Files expected (new)

- `DkasuPOS-Mac/supabase/migrations/<timestamp>_company_schema_foundation.sql`
- `DkasuPOS-Mac/supabase/migrations/<timestamp>_company_rls_and_rpcs.sql`
- Optional: `DkasuPOS-Mac/docs/COMPANY_SCHEMA.md`

### Explicit non-goals

- No changes to hospitality migrations  
- No edits to merchant `products` / `shops` policies  
- No data import yet  

### Exit criteria

- [ ] Owner reviews SQL  
- [ ] Owner applies to **staging** or linked project when ready  
- [ ] `waka_internal_me` / merchant smoke tests still pass post-apply  

---

## Phase 3 — Company APIs and admin dashboard integration

### Objectives

- Teach the company Worker to read/write company data through Supabase **behind a flag**, defaulting to D1  
- Keep POS AdminShell handoff working against Sites `/admin/pos-login`

### Work items

1. Add Worker config flag: `DATA_BACKEND=d1|supabase` (Sites secret/env).
2. Implement Supabase access module in Worker (URL + anon key already used for POS role checks).
3. Map existing endpoints:
   - `GET /api/public` → `company_public_get_bootstrap` when flag=supabase  
   - `POST /api/inquiries` → public inquiry RPC  
   - `/api/admin/*` → authenticated Supabase calls using POS JWT from cookie (preferred)  
4. Preserve ChatGPT `ADMIN_EMAIL` break-glass; log usage to `company.audit_events` when on Supabase.
5. Add server-side audit rows for admin mutations.
6. **POS button release track (parallel, isolated):**
   - Create clean branch from production-tracking baseline  
   - Cherry-pick **only** company button changes from `AdminShell.tsx`  
   - Do not include hospitality dirty work  
   - Owner deploys POS when ready  

### Files expected

- `sites/dkasu-workspace/worker/core.js` (data adapters)
- Possibly split helpers into `worker/data/*.js` if maintainability requires (keep build-worker compatible)
- `sites/dkasu-workspace/scripts/build-worker.mjs` if multiple modules need bundling
- POS `AdminShell.tsx` on a **clean** release branch only

### Exit criteria

- [ ] Local/staging: D1 mode unchanged  
- [ ] Staging Supabase mode: public + admin CRUD works  
- [ ] support_admin / field_agent denied  
- [ ] super_admin / operations_admin allowed  
- [ ] No service-role key in client bundles  

---

## Phase 4 — D1 → Supabase migration with rollback

### Objectives

Move authoritative company data from Sites D1 to Supabase without public downtime beyond a short write freeze.

### Steps

1. **Export** D1 tables (owner/tooling): `public_content`, `catalog_items`, `inquiries`, `service_profiles`, `records`.
2. **Import** into staging `company.*` with ID preservation.
3. **Verify:**
   - Row counts  
   - SHA-256 of `site_content.value`  
   - Random sample of inquiries and catalog rows  
4. Enable **shadow read** (optional): respond from D1; async compare to Supabase.
5. **Cutover window:**
   - Freeze admin writes (maintenance banner on `/admin`)  
   - Re-export delta  
   - Import delta  
   - Set `DATA_BACKEND=supabase`  
   - Unfreeze  
6. **Rollback:** set `DATA_BACKEND=d1`; investigate; company tables remain for retry.

### Exit criteria

- [ ] Public Site identical for content and catalog  
- [ ] New inquiries land in Supabase  
- [ ] Rollback drill documented as successful at least once in staging  

---

## Phase 5 — Expand public website to seven divisions

### Objectives

Add **DKASU Global** and **DKASU Digital** without breaking the five live services.

### Work items

1. Extend hardcoded `services` / `serviceIds` / directory cards with stable new IDs and slugs:
   - Global — study/travel consultancy; **explicitly exclude overseas job placement**
   - Digital — website design/development services  
2. Seed `company.divisions` rows; keep Logistics `In production`.
3. Update about/contact interest pickers.
4. Resolve Vision URL/DNS (content may show “coming soon” if DNS still down).
5. SEO: per-service titles/descriptions where feasible in Worker HTML shell.
6. Accessibility: meaningful image `alt` text when catalog images exist.

### Exit criteria

- [ ] Seven divisions visible and linked  
- [ ] Existing five URLs/slugs unchanged  
- [ ] Owner visual QA passed  

---

## Phase 6 — Computer Arena inventory, leads, installations, operations

### Objectives

Deepen operations beyond D1 parity using **real** business data only.

### Work items (incremental)

1. **Catalog enrichment UI** for price, currency, stock, specs — fields remain optional.  
2. **Quotes / follow-ups** tables + admin workflows.  
3. **Vision installations** (sites, equipment lists, service visits) — separate from `shop_vision_settings`.  
4. **Logistics** shipments/events when operational process is defined.  
5. **Team assignments** per division (optional RBAC refinement).  
6. **Marketing content** blocks beyond single JSON blob (normalize gradually).  
7. **Reports** from `audit_events` + inquiry funnels.  
8. Loyalty/POS: link **leads** and eligible-plan messaging only; do not duplicate merchant loyalty ledgers.

### Exit criteria

- [ ] Computer Arena can publish a real product with image + condition + availability  
- [ ] No invented SKUs/prices in production  
- [ ] Merchant POS regression suite / smoke still green  

---

## Phase 7 — Validate complete platform and controlled production release

### Checklist

- [ ] Supabase is sole authoritative company store; D1 read-only or unbound  
- [ ] POS “Dkasu Company” button live from clean release  
- [ ] Role matrix retested in production  
- [ ] Domain cutover plan for `dkasu.com` (if scheduled) reviewed with Auth redirect list  
- [ ] Backup/export of company schema documented  
- [ ] Monitoring: error rates on `/api/public`, `/api/inquiries`, `/admin/pos-login`  
- [ ] Owner sign-off  

---

## Recommended first task after approval

**Phase 2 drafting only:** author additive `company` schema + RLS + public/admin RPC SQL files in `/Users/denis/Developer/DkasuPOS-Mac/supabase/migrations/`, isolated from hospitality work, **without applying**.

Optionally in the same approval:

- Sketch Worker `DATA_BACKEND` adapter interfaces in a short design note (still no cutover).

---

## Coordination constraints (standing)

| Constraint | Action |
| --- | --- |
| Dirty POS hospitality tree | Never commit company work mixed with hospitality unless owner requests |
| Secrets | Never commit `POS_SUPABASE_ANON_KEY`, service role, or `ADMIN_EMAIL` values |
| Inventory | Never seed fake products/prices |
| Divisions as merchants | Forbidden |
| New Supabase project | Forbidden |
| Production apply/deploy | Owner-only |

---

## Approval gate

Phase 1 is finished. **Stop here.**

Reply with approval to begin Phase 2 SQL drafting (source only), or with requested changes to the audit/plan.
