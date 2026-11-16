# DKASU Company Platform — Architecture Audit (Phase 1)

**Audit date:** 16 November 2026  
**Phase:** 1 — Read-only architecture and security audit  
**Status:** Complete. No migrations applied. No deployments. No production mutations.  
**Primary blueprint (source of truth):** `/Users/denis/Documents/ChatGPT/dkasu company/DKASU_SITE_BLUEPRINT.md`  
**Companion plan:** `docs/DKASU_COMPANY_IMPLEMENTATION_PLAN.md`

### Evidence legend

| Label | Meaning |
| --- | --- |
| **Verified** | Confirmed from repository files, Git metadata, or blueprint statements that match source |
| **Blueprint-reported** | Stated in the blueprint; not independently re-verified against hosted runtime in this audit |
| **Assumed** | Inference required for planning; must be validated before cutover |

---

## 1. Repository structure and Git status

### 1.1 Company website (primary implementation project)

| Item | Value |
| --- | --- |
| Path | `/Users/denis/Documents/ChatGPT/dkasu company/sites/dkasu-workspace` |
| Git | **Verified:** inside work tree; branch `main`; working tree **clean** |
| HEAD | **Verified:** `42e1076593a814d5f40662c6e2bd32429eca5017` — “Update Site source” |
| Remote | **Verified:** no `git remote` configured |
| Parent folder | `/Users/denis/Documents/ChatGPT/dkasu company` is **not** a Git repository |
| Blueprint | `/Users/denis/Documents/ChatGPT/dkasu company/DKASU_SITE_BLUEPRINT.md` (outside the Site Git root) |
| Sites project ID | **Blueprint-reported / hosting.json:** `appgprj_6afab231f69481919dc77804570f2846` |
| Live Site | **Blueprint-reported:** `https://dkasu-company-workspace.honedbadge32.chatgpt.site/` |
| Published version | **Blueprint-reported:** Site version 9 at commit `42e1076…` |

**Top-level structure (verified):**

- `worker/` — production Site Worker source (`core.js`, `ui/public.js`, `ui/admin.js`, `ui/style.css`, brand assets)
- `scripts/build-worker.mjs` — assembles `dist/server/index.js` for Sites publication
- `drizzle/` — D1 schema history (`0000`–`0002`)
- `db/schema.ts` — Drizzle mirror of D1 tables
- `.openai/hosting.json` — D1 binding `DB`
- `app/`, `components/`, `vite.config.ts`, `worker/index.ts` — vinext/Sites starter scaffolding (local/dev path; production Site content is the custom Worker build)

### 1.2 DKASU POS (infrastructure and admin handoff)

| Item | Value |
| --- | --- |
| Path | `/Users/denis/Developer/DkasuPOS-Mac` |
| Accessible | **Verified:** yes |
| Branch | **Verified:** `feature/hospitality-v2` @ `ddce7d1a` |
| Remote | **Verified:** `origin` → `https://github.com/kasulede81-prog/pos-waka.git` |
| Working tree | **Verified:** **dirty** — many unstaged hospitality changes + untracked hospitality docs/migrations + **uncommitted** company dashboard button in `AdminShell.tsx` |
| Tracks | ahead/behind vs remote not re-fetched in this audit (**Assumed** local-only dirty work) |

**Do not overwrite or bundle unrelated hospitality work into a company-platform release.**

### 1.3 Related non-canonical copy

| Path | Status |
| --- | --- |
| `/Users/denis/Documents/ChatGPT/dkasu company/pos-admin-release` | **Verified:** present; **not** a Git repo. Blueprint: temporary clean packaging copy; not canonical |
| Empty Vercel project `pos-admin-release` | **Blueprint-reported:** created inadvertently; deployment removed; project still exists — delete only with explicit owner approval |

### 1.4 Supabase project identity

| Item | Evidence |
| --- | --- |
| Linked project_id | **Verified** in `supabase/config.toml`: `ljaedextsenbkxzzgxcg` |
| Production URL pattern | **Verified** in `.env.production.example`: `https://ljaedextsenbkxzzgxcg.supabase.co` |
| Auth site_url (local config) | **Verified:** `https://pos.dkasu.com` |
| Hosted Auth URL list | **Verified comment in config:** dashboard is authoritative; local `config.toml` is not |

Secrets and anon/service keys were **not** read or copied into this report.

---

## 2. Existing company website architecture

### 2.1 Runtime model

**Verified:** Production Site is a custom Cloudflare Worker assembled by `scripts/build-worker.mjs`:

1. Reads `worker/ui/style.css`, `public.js`, `admin.js`, `core.js`, and PNG assets
2. Embeds CSS/JS/assets as constants
3. Writes `dist/server/index.js`

The vinext `worker/index.ts` + Next `app/` tree remains the Sites starter path; the published Dkasu portfolio is the custom Worker in `worker/core.js`.

**Hosting bindings (verified):** `.openai/hosting.json` binds D1 as `DB`; R2 is `null`.

### 2.2 Public routes and APIs

**Verified in `worker/core.js`:**

| Surface | Method | Behavior |
| --- | --- | --- |
| `/`, `/products`, `/about`, `/contact`, `/services/{slug}` | GET | HTML shell + client JS |
| `/api/public` | GET | Published site content + published catalog |
| `/api/inquiries` | POST | Creates inquiry (honeypot `website` field returns fake OK) |
| `/admin` | GET | Admin UI if authorized; else ChatGPT sign-in / denial |
| `/admin/pos-login` | POST | POS token handoff → HttpOnly cookie → redirect `/admin` |
| `/api/admin/*` | GET/POST/DELETE | Content, items, inquiries, records, profiles |

Admin page is **not** linked from the public UI (**Verified** blueprint + public JS structure).

### 2.3 Service divisions currently coded

**Verified hardcoded list (five divisions only):**

1. Dkasu Computer Arena — `computer-arena` — Current — `https://computer.dkasu.com`
2. DkasuPOS — `pos` — Current — `https://pos.dkasu.com`
3. DkasuLoyalty — `loyalty` — Current — `https://loyalty.dkasu.com`
4. DkasuVision — `vision` — Current — `https://vision.dkasu.com`
5. DkasuLogistic — `logistic` — **In production** — no `websiteUrl`

**Missing vs target seven divisions:**

6. **DKASU Global** — not present in `services` array, admin `serviceIds`, or public routes  
7. **DKASU Digital** — not present

Adding them requires coordinated updates to `worker/core.js`, `worker/ui/public.js`, `worker/ui/admin.js`, and any saved `public_content` JSON so published content is not broken.

### 2.4 D1 schema (authoritative company store today)

**Verified from `drizzle/*.sql` + `db/schema.ts`:**

| Table | Purpose | Key columns |
| --- | --- | --- |
| `public_content` | Site CMS JSON (`key='site'`) | `key`, `value`, `updated_at` |
| `catalog_items` | Public catalog | `id`, `service`, `name`, `category`, `condition`, `summary`, `image_url`, `website_url`, `status`, `featured`, `published`, `updated_at` |
| `inquiries` | Leads | `id`, `name`, `email`, `interest`, `market`, `message`, `status`, `owner`, `follow_up`, `created_at`, `updated_at` |
| `service_profiles` | Internal division ops profile | `service` PK + status/owner/notes/pricing/links/readiness |
| `records` | Internal work items | service/kind/title/status/owner/market/notes/pricing/links/follow-up/readiness/next_action/due_date |

**Catalog gaps vs stated public requirements (verified absent):**

- No `price` / currency fields  
- No stock quantity / availability beyond free-text `status`  
- No structured specifications (CPU, RAM, storage, etc.)  
- No SKU / serial / warranty columns  

Computer conditions allowed in API: `'' | 'Brand new' | 'UK used' | 'Dubai used'` (**Verified**). Non–Computer Arena items force empty condition.

**Blueprint-reported:** catalog currently empty of published inventory; do not invent products or prices.

### 2.5 Branding and contact

**Verified defaults in `worker/core.js`:** Uganda WhatsApp, `support@waka.ug`, Kampala address, Italy phone/address, `intl@dkasu.com`, legal footer “WAKA Marketplace Limited”, Manrope/DM Sans styling in CSS, Computer Arena + POS large spotlights.

WhatsApp is **link-only** (no Business API messaging) — **Verified** blueprint + code (wa.me links only).

### 2.6 SEO / accessibility notes

**Verified:** viewport meta, theme-color, favicon, description meta, `lang="en"`, lazy images, admin `noindex`.  
**Gaps (verified / partial):** single static description for all public pages; product images use empty `alt=""`; SPA-style client routing without distinct per-route meta beyond shell.

---

## 3. Existing DKASU POS database architecture

### 3.1 Scale and layout

| Item | Verified fact |
| --- | --- |
| Migration files under `supabase/migrations` | ~361 files |
| Numbered early migrations | ~196 (`001_`… style) |
| Timestamped 2026 migrations | ~163 |
| Edge Functions directory | 25 function folders + `_shared` |
| Schemas searched for company tables | **No** `company_*`, `public_content`, or `catalog_items` company tables in migrations |

### 3.2 Merchant tenant model (must preserve)

**Verified `003_organizations_and_shops.sql`:**

- `organizations` — billing/tenant anchor  
- `organization_members` — owner/admin/billing/staff  
- `shops` — locations under org  
- `shop_members` — manager/cashier/viewer  

**Verified `004_product_catalog_inventory.sql`:**

- `products`, `product_categories`, `inventory_movements` are **`shop_id`-scoped** merchant POS inventory  

**Conclusion:** Company Computer Arena catalog must **not** reuse `public.products` / merchant shops as division tenants.

### 3.3 Internal administration

**Verified `018_internal_ops_foundation.sql` + `021_internal_admins_schema.sql`:**

Table `public.internal_admins`:

- Links to `auth.users` (`user_id` / `auth_user_id`)  
- Roles check includes: `super_admin`, `operations_admin`, `support_admin`, `field_agent`, plus legacy `finance_admin`, `subscriptions_admin`  
- `active` / `is_active`, district assignments, email  

Related ops tables: `districts`, `admin_assignments`, `support_requests`, `field_visits`, shop/subscription extensions.

### 3.4 Auth helpers and RPCs (company-relevant)

| Function | Verified behavior |
| --- | --- |
| `is_waka_internal_staff()` | Active internal admin for `auth.uid()`; anon-inert short-circuit in hygiene migration |
| `is_waka_internal_role(text[])` | Role-gated staff check |
| `is_waka_internal_admin()` | **`super_admin` OR `operations_admin` only** (`20261009120000_define_is_waka_internal_admin.sql`) |
| `waka_internal_me()` | Returns active admin row(s) for caller; **EXECUTE granted to `authenticated`**, revoked from `public` |

Company Site already aligns company access with the same two roles as `is_waka_internal_admin()`.

### 3.5 RLS pattern (merchant isolation)

**Verified pattern:** RLS enabled on internal and merchant tables; policies use `user_can_access_shop` / org helpers **or** `is_waka_internal_staff()` for staff visibility. Mutations for sensitive admin actions use **SECURITY DEFINER RPCs** with explicit role arrays — not UI-only gates.

### 3.6 Adjacent domains (do not conflate with company divisions)

| POS domain | Relation to company divisions |
| --- | --- |
| Loyalty tables (`loyalty_programs`, `loyalty_accounts`, …) | Merchant loyalty under POS subscriptions — **not** the company marketing page for DKASU Loyalty |
| `shop_vision_settings` | Merchant POS “Vision” feature flags — **not** DKASU Vision CCTV sales/install CRM |
| Billing / subscriptions / printers / hospitality / sales | Unrelated merchant operations — preserve untouched |

### 3.7 Storage

**Verified sample:** support attachment bucket + policies in `20260917090000_support_phase25_realtime_attachments.sql`.  
**Assumed for company:** new company media should use a dedicated bucket (e.g. `company-public-media`) with published-read / admin-write policies — none exists yet for company catalog.

### 3.8 Hosted metadata

This Phase 1 audit inspected **source migrations and config only**. Live row counts, applied migration versions on the hosted project, and dashboard Auth redirect lists were **not** queried (**Assumed** until owner-run verification).

---

## 4. Current authentication and admin integration

### 4.1 Company admin authorization paths

**Verified `worker/core.js`:**

1. **ChatGPT Sites auth:** header `oai-authenticated-user-email` must match secret `ADMIN_EMAIL`  
2. **POS bridge:** cookie `dkasu_pos_admin` holds Supabase access JWT; each check calls `POST {POS_SUPABASE_URL}/rest/v1/rpc/waka_internal_me` with `apikey: POS_SUPABASE_ANON_KEY` and `Authorization: Bearer <token>`; requires `active === true` and role ∈ `{super_admin, operations_admin}`

POS login flow:

1. POS posts `access_token` form field to `/admin/pos-login` (not in URL)  
2. Server validates via `waka_internal_me`  
3. Sets `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600` cookie  
4. Redirects to `/admin`  
5. Admin API mutations additionally deny when `Origin` is present and ≠ site origin  

Secrets expected at runtime: `ADMIN_EMAIL`, `POS_SUPABASE_URL`, `POS_SUPABASE_ANON_KEY` (Sites secrets; **not** in source). `.env.example` only documents `ADMIN_EMAIL=`.

### 4.2 POS UI handoff

**Verified local change in** `DkasuPOS-Mac/src/components/internal-admin/v2/AdminShell.tsx` (**Not Committed Yet**):

- `canManageCompany` for `super_admin` / `operations_admin` outside preview mode  
- Posts session access token to the Sites `/admin/pos-login` URL  

**Blueprint-reported / Verified dirty tree:** button is **not** live on `pos.dkasu.com`; lives only in local POS source mixed with hospitality dirty work.

### 4.3 Session / revocation behavior

| Topic | Assessment |
| --- | --- |
| JWT expiry | POS `config.toml` `jwt_expiry = 3600` matches cookie Max-Age 3600 (**Verified** config + code) |
| Role recheck | Every admin page/API re-invokes `waka_internal_me` (**Verified**) — revocation after deactivate should fail closed on next request |
| Token storage | Full access token in company-site cookie — scoped to company Site origin; still a high-value credential if XSS or cookie theft occurs |
| ChatGPT ADMIN_EMAIL | Parallel superuser path independent of POS roles (**Verified**) |

---

## 5. D1-to-Supabase migration mapping

| D1 table / field | Proposed Supabase target | Notes |
| --- | --- | --- |
| `public_content` (`key`,`value`,`updated_at`) | `company.site_content` or `company_site_content` | Keep JSON initially for parity; later normalize contact/services |
| `catalog_items.*` | `company.catalog_items` | Add nullable price/currency/stock/specs columns **additively** without inventing data |
| `inquiries.*` | `company.inquiries` | PII — restrict select to company admins; no anon read |
| `service_profiles.*` | `company.service_profiles` | Key by division slug/id |
| `records.*` | `company.work_records` | Avoid bare name `records` in Postgres |
| Hardcoded `services[]` | `company.divisions` seed rows | Seven divisions; preserve five existing IDs/slugs |
| — | `company.audit_events` | New; not in D1 |
| — | `company.quotes`, installations, shipments, etc. | Phase 6+; not required for D1 parity cutover |

**ID strategy:** preserve existing UUID strings from D1 where present; store `migrated_from = 'd1'` and original timestamps (ms → `timestamptz`).

**Out of scope for company migration:** merchant `products`, `shops`, `subscriptions`, loyalty ledgers, hospitality tables.

---

## 6. Proposed company database schema

### 6.1 Placement recommendation

**Recommendation (evidence-based):** create a dedicated PostgreSQL schema **`company`** inside the **existing** project `ljaedextsenbkxzzgxcg`, with tables such as:

- `company.divisions`
- `company.site_content`
- `company.catalog_items`
- `company.inquiries`
- `company.service_profiles`
- `company.work_records`
- `company.audit_events`
- (later) `company.branches`, `company.quotes`, `company.installations`, `company.shipments`, `company.media`

**Why not `public` merchant tables:** merchant RLS and `shop_id` ownership are incompatible with company catalog semantics (**Verified** product model).  
**Why not new Supabase project:** owner decision + blueprint — single existing POS project.  
**Why schema separation:** namespace clarity and grant hygiene; **schema alone is not access control** — RLS + RPCs still required.

Alternative acceptable if schema grants are operationally painful: `company_*` tables in `public` with identical RLS. Prefer `company` schema unless hosted tooling blocks it.

### 6.2 Minimal Phase 2 table sketch (design only — not applied)

```text
company.divisions (
  id text pk,              -- e.g. 'Dkasu Computer Arena'
  slug text unique,        -- computer-arena, pos, ..., global, digital
  eyebrow, title, summary, icon, status, website_url,
  sort_order int, showcase_tier text,  -- 'primary' for Computer Arena & POS
  created_at, updated_at
)

company.site_content (
  key text pk,             -- 'site'
  value jsonb not null,
  updated_at timestamptz,
  updated_by uuid null
)

company.catalog_items (
  id uuid pk,
  division_id text references company.divisions,
  name, category, condition, summary,
  image_url, website_url,
  status text,             -- availability label
  featured bool, published bool,
  -- additive future columns (null until real data exists):
  price_amount numeric null, price_currency text null,
  stock_qty numeric null, specs jsonb null default '{}',
  updated_at, created_at
)

company.inquiries (... mirror D1 + assigned_admin_id null ...)
company.service_profiles (division_id pk, ...)
company.work_records (... mirror D1 records ...)
company.audit_events (id, actor_user_id, action, entity_type, entity_id, payload jsonb, created_at)
```

### 6.3 Explicit non-goals

- Do **not** create organizations/shops for Computer Arena / Vision / Logistics / Global / Digital  
- Do **not** write company inquiries into merchant `support_requests` without a separate, reviewed bridge  
- Do **not** grant company website purchases the ability to mutate POS licences

---

## 7. Proposed RLS and role-permission model

### 7.1 Identity

Reuse Supabase Auth users already linked in `internal_admins`. Company membership for v1 = **active** `super_admin` or `operations_admin` via existing `is_waka_internal_admin()`.

Optional later: `company.staff_assignments (admin_id, division_id, capability[])` for finer division scope — **not** required for D1 parity.

### 7.2 Policy sketch

| Audience | Access |
| --- | --- |
| `anon` | No direct table access, **or** SELECT-only on a published catalog **view**/RPC that filters `published = true` |
| Merchant authenticated users | **No** company table access |
| Internal staff other roles | **No** company write; read only if explicitly granted later |
| `is_waka_internal_admin()` | Full CRUD on company tables via RLS |
| Service role | Server-only Worker/Edge — never in browser |

Prefer **SECURITY DEFINER RPCs** for public reads (`company_public_get_site`, `company_public_list_catalog`) to avoid broad anon table grants — matches POS patterns.

Admin writes from the company Worker should use the **caller JWT** (POS session) against RLS, or a server-side Edge Function that re-validates `waka_internal_me` / `is_waka_internal_admin` before service-role writes. Prefer JWT+RLS so revoked admins fail closed without trusting only the Worker cookie.

### 7.3 ChatGPT ADMIN_EMAIL path

Today this bypasses POS roles. After Supabase cutover, either:

- Map ADMIN_EMAIL to a known `internal_admins` user and require POS/Auth session, or  
- Keep Sites header check **only** as emergency break-glass with audit logging  

**Recommendation:** break-glass only; primary path = POS roles.

---

## 8. Public website and company admin API design

### 8.1 Keep current route shapes during migration

Preserve existing paths for zero public breakage:

- Public: `/api/public`, `/api/inquiries`  
- Admin: `/api/admin/data|content|items|inquiries|records|profiles`  
- Auth: `/admin`, `/admin/pos-login`

### 8.2 Target backend

| Option | Pros | Cons |
| --- | --- | --- |
| A. Company Worker talks to Supabase REST/RPC with user JWT / limited anon RPCs | Least new infra; fits current Worker | Worker must hold project URL + anon key (already does for POS) |
| B. New Edge Functions under POS project (`company-public-*`, `company-admin-*`) | Centralizes authz next to DB | More deploy surface; owner applies manually |

**Recommendation:** Phase 3 start with **A** behind a feature flag (`DATA_BACKEND=d1|supabase`), add **B** only for privileged bulk ops or media uploads.

### 8.3 Admin UX placement

- Keep **separate** `/admin` on company Site (current)  
- POS Internal Admin remains launchpad via “Dkasu Company” button  
- Long-term: optional embedded company ops panels inside POS internal admin **reading company schema** — only after RLS proven; do not merge public Site into POS SPA

---

## 9. Integration strategy for all seven divisions

| Division | Public Site | Dedicated URL | Company DB / ops | POS coupling |
| --- | --- | --- | --- | --- |
| Computer Arena | Large showcase + catalog | `computer.dkasu.com` | Catalog, stock, leads, quotes | None to merchant `products` |
| DKASU POS | Large showcase | `pos.dkasu.com` | Marketing content + subscription **leads** only | Existing merchant system remains SoT for licences |
| DKASU Loyalty | Service page | `loyalty.dkasu.com` | Marketing + eligible-plan messaging | Merchant loyalty tables remain SoT for cards/points |
| DKASU Vision | Service page | `vision.dkasu.com` (**Blueprint:** DNS did not resolve) | Installations CRM (Phase 6) | Do not use `shop_vision_settings` |
| DKASU Logistics | Service page, In production | URL TBD | Shipments/ops (Phase 6) | None |
| DKASU Global | **Add** page | URL TBD | Consultancy leads; **exclude** overseas job placement in copy and inquiry interests | None |
| DKASU Digital | **Add** page | URL TBD | Web/design service leads & packages | None |

Preserve five existing division IDs/slugs when inserting Global/Digital so saved D1 `public_content.services` edits continue to merge correctly (`services.map` merge logic in `core.js`).

---

## 10. Security risks and compatibility issues

| ID | Risk | Severity | Evidence / notes |
| --- | --- | --- | --- |
| S1 | POS access JWT stored in company Site cookie | High | Full bearer token; mitigate with short TTL (done), HttpOnly/Secure/SameSite (done), consider exchanging for opaque company session server-side |
| S2 | ChatGPT `ADMIN_EMAIL` bypass of POS RBAC | Medium | Dual auth path |
| S3 | Origin check skipped when `Origin` header absent | Medium | CSRF residual on cookie-authenticated POSTs |
| S4 | Accidental POS deploy of hospitality + company button together | High operational | Dirty `feature/hospitality-v2` tree |
| S5 | Reusing merchant `products`/`shops` for company stock | Critical if done | Incompatible RLS/tenancy |
| S6 | Confusing `shop_vision_settings` with DKASU Vision CRM | High if done | Different domain |
| S7 | Publishing invented catalog prices/images | Business/legal | Blueprint forbids; catalog empty |
| S8 | `vision.dkasu.com` / company domain cutover | Ops | Blueprint DNS notes; `dkasu.com` currently POS-associated |
| S9 | Service-role key in Worker | Critical if introduced | Must never ship to Sites frontend; prefer user JWT + RPC |
| S10 | Unrelated empty Vercel project leftover | Low | Blueprint |
| S11 | Company Site Git has no remote | Medium ops | Backup/publish process depends on Sites tooling |
| S12 | Anon execute of staff helpers | Managed | Hygiene migration documents intentional anon grant only for inert `is_waka_internal_staff` |

---

## 11. Recommended implementation phases

Aligned with owner sequence; adjusted only where evidence requires:

| Phase | Scope | Gate |
| --- | --- | --- |
| **1** | This audit + implementation plan | **Complete — await approval** |
| **2** | Draft additive `company` schema + RLS + RPCs in POS repo source only | Owner reviews SQL before apply |
| **3** | Worker/API dual-read flag; admin dashboard still on D1 writes | Staging/local verification |
| **4** | D1 export → staging import → compare → cutover with D1 rollback | Owner applies migration + cutover |
| **5** | Add Global + Digital; expand public IA without inventing inventory | Content review |
| **6** | Computer Arena inventory fields, leads/quotes, Vision installs, logistics ops tables | Real data only |
| **7** | Full validation, POS button release from clean baseline, controlled production | Owner visual QA |

Do **not** auto-start Phase 2.

---

## 12. Rollback and production cutover strategy

### 12.1 Database

- Phase 2 migrations must be **additive only** (CREATE schema/tables/policies/functions; no DROP of merchant objects)  
- Rollback = keep D1 authoritative; ignore unused company tables or DROP company schema in a reviewed reverse migration **only after** confirming zero production reads  

### 12.2 Site cutover

1. Feature flag `DATA_BACKEND=d1` (default)  
2. Shadow-read Supabase and compare hashes/counts (**Assumed** tooling to build in Phase 4)  
3. Freeze admin writes briefly → final D1 delta import → switch flag to `supabase`  
4. On failure: flip flag back to `d1` within minutes; no DNS change required for Sites URL  

### 12.3 POS button release

1. Cherry-pick **only** `AdminShell.tsx` company handoff onto a clean release branch from production baseline  
2. Exclude hospitality uncommitted files  
3. Deploy POS separately from company Site  
4. Verify `pos.dkasu.com` still serves prior merchant features  

### 12.4 Domain move (`dkasu.com`)

Separate runbook later: Auth redirect allowlists, POS callbacks, and company Site host must be coordinated. **Do not** repoint casually (**Blueprint**).

---

## 13. Exact files that would need modification

### 13.1 Company Site (Phase 2–5)

| File | Why |
| --- | --- |
| `worker/core.js` | Services list, data access, Supabase client/RPC, feature flag |
| `worker/ui/public.js` | Seven divisions, catalog UI for price/specs when columns exist |
| `worker/ui/admin.js` | Admin forms for new fields/divisions |
| `worker/ui/style.css` | Layout for new sections if needed |
| `db/schema.ts` / `drizzle/*` | D1 parity while D1 remains; freeze after cutover |
| `scripts/build-worker.mjs` | Unchanged unless asset set grows |
| `.env.example` | Document `POS_SUPABASE_*` names only (no values) |
| `docs/*` | This audit + plan (created now) |

### 13.2 POS repo (Phase 2–3, careful isolation)

| File / area | Why |
| --- | --- |
| `supabase/migrations/YYYYMMDDHHMMSS_company_*.sql` | **New** additive migrations only |
| `supabase/functions/company-*` | Optional later |
| `src/components/internal-admin/v2/AdminShell.tsx` | Company button — release via clean cherry-pick |
| **Do not touch** hospitality, sales, printer, billing files for company work |

### 13.3 Out of scope / do not modify casually

- Merchant RLS on `shops` / `products` / `subscriptions`  
- Loyalty ledger migrations except explicit future integration RPCs  
- `pos-admin-release` copy as if it were canonical  

---

## 14. Tests and verification required

### 14.1 Already reported completed (blueprint)

- Site Worker build / JS syntax for published v9  
- Local role handoff: allow Super/Operations; deny Support/Field; ChatGPT fallback  
- Anonymous `waka_internal_me` returns no admin rows  
- POS TypeScript check after local AdminShell change  
- `pos.dkasu.com` still on prior deployment after aborted release attempt  

### 14.2 Required before Phase 2 apply

- [ ] Owner review of this audit + plan  
- [ ] Confirm hosted migration head includes `is_waka_internal_admin` and current `waka_internal_me`  
- [ ] Confirm Sites secrets `POS_SUPABASE_URL` / `POS_SUPABASE_ANON_KEY` / `ADMIN_EMAIL` present (values not logged)  

### 14.3 Required before D1 cutover (Phase 4)

- [ ] Row-count equality for all five D1 tables  
- [ ] Content hash of `public_content` JSON  
- [ ] Spot-check N inquiries (PII handled securely)  
- [ ] Public `/api/public` parity  
- [ ] Admin denied for support_admin / field_agent / anon  
- [ ] Admin allowed for super_admin / operations_admin  
- [ ] Rollback drill: flag back to D1  

### 14.4 Required before POS button production

- [ ] Clean branch without hospitality dirty files  
- [ ] Manual visual QA by owner  
- [ ] Confirm production Auth redirects unchanged  

### 14.5 Required before seven-division public launch (Phase 5)

- [ ] Global/Digital copy approved (no overseas job placement)  
- [ ] Logistics remains “In production”  
- [ ] Vision URL/DNS decision documented  
- [ ] No fabricated catalog rows  

---

## 15. Phase 1 conclusion

**Verified:** Live company Site runs on Sites + D1 with five divisions, empty-ready catalog, inquiry CRM, and POS role handoff implemented on the Site. POS Supabase already has a strong internal admin RBAC surface (`is_waka_internal_admin`) suitable to gate a new **`company`** schema. No company tables exist yet. POS local tree is dirty; company button is uncommitted and not production.

**Recommended first implementation task after approval:** Phase 2 — draft additive `company` schema + RLS/RPC SQL files in the POS repository **without applying them**, plus a Site-side design note for the `DATA_BACKEND` flag.

**STOP.** Awaiting owner approval before any Phase 2 work.
