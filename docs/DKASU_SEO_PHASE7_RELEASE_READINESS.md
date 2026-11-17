# DKASU SEO — Phase 7 Final Release Readiness

**Date:** 17 November 2026  
**Phase type:** Release **preparation** only — **not** deployment authorization  
**Git / Vercel / DB / Edge:** **No mutations performed** (no commit, push, deploy, branch switch, cherry-pick, stash, reset, migrations, or production data changes)

### Prior reports located

| Report | Path |
|--------|------|
| Corporate Phase 3 | `/Users/denis/Documents/ChatGPT/dkasu company/sites/dkasu-workspace/docs/DKASU_CORPORATE_SEO_PHASE3_REPORT.md` |
| Ecosystem Phase 5 | same repo `docs/DKASU_ECOSYSTEM_SEO_PHASE5_FINAL_AUDIT.md` (+ Computers copy) |
| POS Phase 2 impl | `/Users/denis/Developer/DkasuPOS-Mac/docs/PHASE2_POS_SEO_IMPLEMENTATION_REPORT.md` |
| POS Phase 2 audit | `…/docs/PHASE2_POS_SEO_AUDIT.md` |
| Computers Phase 4 | `/Users/denis/Downloads/dk-computer-arena-main/docs/DKASU_COMPUTERS_SEO_PHASE4_REPORT.md` |
| Computers Phase 6 Jiji | `…/docs/DKASU_JIJI_PRODUCT_SEO_PHASE6_REPORT.md` |

---

## Executive summary

Local SEO packages for Corporate (P3+P5), POS (P2 commit `64f53419`), and Computers (P4+P5+P6) are **build-validated** and schema-aligned to:

- Organization: `https://www.dkasu.com/#organization`  
- Software: `https://pos.dkasu.com/#software`  
- Store: `https://computer.dkasu.com/#store`  

**Production is not ready until owner-approved Git isolation + deploy.** Live POS still publishes apex `dkasu.com` sitemap/canonicals (**BLOCKER** for POS go-live). Computers `origin/main` sitemap has only **1** test product URL; the local tree correctly holds **245** product URLs that must ship (**BLOCKER** if wrong tree is deployed). POS feature branch must **not** be deployed as-is.

**Proposed deploy order (future):** 1) Corporate → 2) POS SEO-only onto `main` → 3) Computers with 245-product sitemap.

---

## Concise release manifest

| | Corporate | POS | Computers |
|--|-----------|-----|-----------|
| **Repository** | `kasulede81-prog/compsany-site` | `kasulede81-prog/pos-waka` | `kasulede81-prog/dk-computer-arena` |
| **Local path** | `…/sites/dkasu-workspace` | `…/DkasuPOS-Mac` | `…/dk-computer-arena-main` |
| **Vercel project** | `compsany-site` | `pos-waka` | `dk-computer-arena` |
| **Current branch** | `main` @ `e6f42d8` (= `origin/main`) | `codex/arena-admin-super-only` @ `64f53419` (**ahead 1** of origin) | `main` — **no commits yet** |
| **Intended production branch** | `main` | `main` (SEO cherry-pick; **not** feature branch) | `main` (first commit / PR from prepared tree) |
| **Included SEO** | Phase 3+5 dirty tree (see §2) | Commit `64f53419` only | Phase 4+5+6 working tree + **245** products sitemap |
| **Excluded WIP** | Unrelated docs (`DOMAIN_CUTOVER`, preflight) optional separate | Hospitality, loyalty host (`lyt`), admin, migrations, `apps/`, Jiji export folders, uncommitted About narrative | Do not deploy `origin/main` sitemap alone |
| **Build status (local)** | test 20/20 · lint pass · build pass | SEO vitest 38/38 · verify-seo pass · `tsc -b` exit 0 | test 20/20 · tsc pass · build pass · lint **pre-existing** 3 errors |
| **Sitemap status** | 9× `www.dkasu.com` OK | 16× `pos.dkasu.com` OK **in SEO commit**; **live still `dkasu.com`** | **245** products · host OK · **preserved** |
| **Remaining blockers** | Owner commit/push/deploy | Isolate SEO onto `main`; do not ship dirty WIP; push/deploy | Initial commit strategy; ensure 245 URLs; env keys |

---

## Findings classification

### BLOCKER

1. **POS live SEO still on `https://dkasu.com`** (robots Sitemap + sitemap locs + shell canonicals). Local SEO commit fixes this; production does not.  
2. **Do not deploy `codex/arena-admin-super-only` as production.** Branch is **10 commits** ahead of `main` including hospitality + Arena admin; large uncommitted hospitality/loyalty/admin WIP on top.  
3. **Computers: shipping `origin/main` without the local Phase 4–6 tree would drop to 1 product URL** (`phase5c-test-laptop-…`) and miss SEO work. Local sitemap has **245** products — must be in the release artifact.  
4. **No owner Git authorization yet** — Phase 7 forbids commit/push/deploy until explicit approval.  

### WARNING

1. POS uncommitted **loyalty host** change (`loyalty.dkasu.com` → `lyt.dkasu.com`) + `vercel.json` redirect WIP — **exclude** from SEO release.  
2. POS uncommitted **Software Solutions About narrative** (`DKASU_SOFTWARE_SOLUTIONS_*`) — nice-to-have; **defer** (SEO commit already sufficient for hosts/schema/links).  
3. Computers **SPA** product HTML still thin without JS (Phase 5); sitemap is mandatory for indexing.  
4. Computers **ESLint** pre-existing errors (shadcn empty types / tailwind `require`) — not introduced by SEO; do not block SEO-only if build/tests pass.  
5. Founder naming: Corporate/Computers **Denis Kasule** vs POS marketing **Kasule Denis**.  
6. Jiji pending URL `…/dkasu-computer-arena` still 404 — keep `JIJI_SHOP_URL` = `https://jiji.ug/shop/dk-computers`.  
7. Corporate interim OG image (`pending_1200x630`).  
8. Computers logo ~895 KB / JS ~924 KB (performance follow-up).  
9. POS SEO commit **not on remote** yet (`ahead 1`).  

### INFORMATIONAL

1. Corporate/POS/Computers local schema `@id` graph is consistent.  
2. Corporate apex→www redirect already in `vercel.json`.  
3. POS SEO-parent (`64f53419^`) SEO-touched files appear **identical to `main`** for key paths (`git diff main 64f53419^ -- <seo files>` empty) → cherry-pick onto `main` looks feasible.  
4. Computers regenerate script refuses static-only wipe without DB/products.  

---

## 1. Repository safety audit

### 1.1 Corporate (`compsany-site`)

| Item | Value |
|------|-------|
| Branch | `main` tracking `origin/main` |
| HEAD | `e6f42d8` — Phase 1 SEO verify (already on origin) |
| Remote | `https://github.com/kasulede81-prog/compsany-site.git` |
| Dirty (SEO) | `server/seo.mjs`, `server/company-app.mjs`, `worker/ui/public.js`, `worker/ui/style.css`, `worker/core.js`, `worker/ui/admin.js`, `scripts/test-company-runtime.mjs` |
| Untracked | Phase 3/5 reports + unrelated `DKASU_DOMAIN_CUTOVER_PLAN.md`, `COMPANY_PRODUCTION_PREFLIGHT_REPORT.md` |
| Build | `npm run build` → `node scripts/build-company.mjs` · `outputDirectory: public` · rewrite to `/api` |
| Env | Company secrets via existing Vercel/company secret verify flows; no new SEO secrets required for public pages |

### 1.2 POS (`pos-waka`)

| Item | Value |
|------|-------|
| Branch | `codex/arena-admin-super-only` |
| HEAD | **`64f53419`** `fix(seo): align DKASU POS marketing with pos subdomain` |
| Parent | `73b3148d` Add Computer Arena management to POS Super Admin |
| vs `main` | **10 commits** ahead (hospitality stack + Arena admin + SEO) |
| Remote | `https://github.com/kasulede81-prog/pos-waka.git` |
| Origin branch tip | `73b3148d` — SEO commit **not pushed** |
| Dirty | Large hospitality/loyalty/admin/docs/migrations/`apps/`/Jiji exports + dirty `company.ts` / `AboutPage` / `vercel.json` / `company.seo.test.ts` |
| Production base | Local `main` = `origin/main` = `540b1fd9` — still apex marketing SEO |
| Build | `tsc -b && vite build --mode production && node scripts/verify-seo-assets.mjs` |

### 1.3 Computers (`dk-computer-arena`)

| Item | Value |
|------|-------|
| Branch | `main` with **zero commits** (index has staged + modified SEO files) |
| Remote | `https://github.com/kasulede81-prog/dk-computer-arena.git` |
| `origin/main` | `482e2def…` — sitemap has **1** product URL only |
| Vercel | SPA rewrite + private `X-Robots-Tag` headers in local `vercel.json` |
| Env (Vercel) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` → shared `ljaedextsenbkxzzgxcg` |
| Tooling only | `COMPANY_DATABASE_URL` for read-only sitemap regenerate (never Vite) |

---

## 2. Corporate release package

### Include (Phase 3 + 5)

| File | Purpose |
|------|---------|
| `server/seo.mjs` | Titles/descriptions; Organization; SoftwareApplication; **ComputerStore** node |
| `server/company-app.mjs` | Bootstrap service copy aligned to Computers |
| `worker/ui/public.js` | Homepage/POS/Computers content, nav, pageSeo |
| `worker/ui/style.css` | POS capability grid styles |
| `worker/core.js` | Default hero/about copy soft-alignment |
| `worker/ui/admin.js` | Admin default hero text (enum conditions preserved) |
| `scripts/test-company-runtime.mjs` | Assert new title / software `@id` |
| `public/sitemap.xml` / `public/robots.txt` | www host (regenerate via build/seo helpers as already done) |
| `docs/DKASU_CORPORATE_SEO_PHASE3_REPORT.md` | Optional docs |
| `docs/DKASU_ECOSYSTEM_SEO_PHASE5_FINAL_AUDIT.md` | Optional docs |

`server/generated-assets.mjs` is **gitignored** — produced by `npm run build` at deploy time.

### Exclude

- `docs/DKASU_DOMAIN_CUTOVER_PLAN.md`, `docs/COMPANY_PRODUCTION_PREFLIGHT_REPORT.md` unless owner wants them in a separate docs commit  
- No DB/CMS production bootstrap overwrite unless owner updates admin CMS after deploy  

### Diff summary

`7 files changed, ~111 insertions / ~46 deletions` vs HEAD `e6f42d8` (working tree). Local validation: **20/20 tests**, lint clean, build OK; graph IDs include `#organization`, `#software`, `#store`.

---

## 3. POS SEO-only release package

### SEO commit `64f53419` (include only)

21 files — marketing hosts → `pos.dkasu.com`, corporate `@id` links, robots/sitemap, SeoHead, solution FAQ/breadcrumb JSON-LD, verify-seo-assets, X-Robots headers, Phase 2 docs. Full list in `git show --name-only 64f53419`.

### Parent / isolation

- Parent `73b3148d` is **not** production `main`.  
- For key SEO paths, **`main` matches `64f53419^`** (empty diff) → **proposed:** cherry-pick `64f53419` onto updated `main` on a **new** clean branch **after owner approval** (not executed now).  
- **Do not** merge/deploy entire `codex/arena-admin-super-only`.  

### Uncommitted narrative / loyalty — defer

| Change | Verdict |
|--------|---------|
| `DKASU_SOFTWARE_SOLUTIONS_*` + AboutPage rewrite | **Defer** — not required for domain/schema fix |
| `DKASU_LOYALTY_URL` → `lyt.dkasu.com` + vercel loyalty redirects | **Defer** — loyalty product WIP; SEO commit keeps `loyalty.dkasu.com` |
| Hospitality / migrations / AdminShell / `apps/` | **Exclude** |

### Proposed clean-release procedure (**do not execute**)

1. Ensure clean worktree (owner moves/stashes WIP separately — Phase 7 did not stash).  
2. `git fetch origin`  
3. Create release branch from `origin/main` (e.g. `release/pos-seo-phase2`) — **future step only**.  
4. `git cherry-pick 64f534196e850d662c7d399dd78096bdbaa62085`  
5. Resolve any conflicts if `main` moved; re-run `npm test` (SEO suites), `npm run build` (includes verify-seo-assets).  
6. PR → `main` → Vercel production for `pos-waka`.  
7. Smoke: `/robots.txt`, `/sitemap.xml`, `/home` canonical = `pos.dkasu.com`.  
8. Rollback: revert the cherry-pick commit on `main` / redeploy previous production deployment.  

---

## 4. Computers release package

### Include (Phases 4 + 5 + 6)

Core SEO/product surfaces: `src/lib/seo.ts`, `seo.test.ts`, Index/Hero/About/Footer/Catalog/PageLayout/Shop/ProductDetail/InfoPage/SectionPage/Cart/Wishlist/Compare/Finder/NotFound`, `index.html`, `public/robots.txt`, **`public/sitemap.xml` (245 products)**, `scripts/regenerate-sitemap.mjs` (+ shell), `vercel.json`, Jiji constant `JIJI_SHOP_URL=https://jiji.ug/shop/dk-computers`, docs Phase 4/5/6/7.

### Initial commit strategy (**future, after approval**)

1. Confirm `public/sitemap.xml` still has **245** `/products/` URLs before commit.  
2. First commit on local `main` (or PR branch) with full tree — **do not** reset to thin `origin/main` sitemap.  
3. Prefer PR against `origin/main` so review shows SEO + product sitemap expansion.  
4. Vercel production for `dk-computer-arena` after merge.  
5. Env: shared Supabase publishable vars only; never put `COMPANY_DATABASE_URL` in Vite.  

### Jiji

- Working: `https://jiji.ug/shop/dk-computers`  
- Pending: `https://jiji.ug/shop/dkasu-computer-arena` — **not** in `sameAs` until public  

---

## 5. Sitemap validation

| Site | Local | Live | Dupes | Private routes | Products |
|------|-------|------|-------|----------------|----------|
| Corporate | 9× `www.dkasu.com` | www OK | 0 | none | N/A |
| POS (SEO commit) | 16× `pos.dkasu.com` | **`dkasu.com` BLOCKER** | 0 | none in sitemap | N/A |
| Computers | 265 URLs / **245 products** / correct categories | computer host OK; live may lag SEO shell | 0 | none | **245 preserved** |

Read-only regenerate (Computers):  
`COMPANY_DATABASE_URL='…' node scripts/regenerate-sitemap.mjs`  
Without URL, script **preserves** products and refuses empty static-only wipe.

---

## 6. SEO / schema verification (local packages)

| Check | Corporate | POS (SEO commit) | Computers |
|-------|-----------|------------------|-----------|
| Canonical host | www.dkasu.com | pos.dkasu.com | computer.dkasu.com |
| Organization | `#organization` + Waka Marketplace Limited + Denis Kasule | provider/parent refs | parentOrganization |
| SoftwareApplication | `pos.dkasu.com/#software` | same `@id` | — |
| ComputerStore | `computer.dkasu.com/#store` | — | `#store` + Jiji `sameAs` |
| Product/Offer | — | — | PDP live price/stock only |
| Breadcrumb / Service | Yes | Solutions FAQ+breadcrumb | Yes |
| robots + X-Robots | admin/api | auth/app prefixes | cart/wishlist/admin/… |
| Invented ratings | None | None | None |

---

## 7. Final quality checks

| Repo | TypeScript | Lint | Unit / runtime tests | Production build | SEO assets |
|------|------------|------|----------------------|------------------|------------|
| Corporate | N/A (ESM site) | Pass | **20/20** | Pass | Schema IDs OK |
| POS | `tsc -b` exit **0** (working tree) | Not full-run; prior AdminShell WIP warning | SEO suites **38/38** | verify-seo **pass** (assets) | pos host enforced |
| Computers | Pass | **3 pre-existing errors** (ui/tailwind) | **20/20** | Pass | 245 products |

Pre-existing ≠ new SEO regressions.

---

## 8. Production release plan (future execution)

### Order

1. **Corporate** (`compsany-site` / `main`)  
2. **POS SEO-only** (cherry-pick `64f53419` → `main` / `pos-waka`)  
3. **Computers** (full Phase 4–6 tree + **245** sitemap / `dk-computer-arena`)  

### Per-site checklist

#### Corporate

- **Files:** §2 manifest  
- **Git:** commit on `main` after approval (exclude unrelated docs if desired)  
- **Env:** existing company Vercel secrets; build regenerates `generated-assets.mjs`  
- **Validate:** `npm test && npm run lint && npm run build`  
- **Smoke:** `/`, `/services/pos`, `/services/computer-arena`, `/robots.txt`, `/sitemap.xml`, view-source JSON-LD `#organization` `#software` `#store`  
- **Rollback:** revert commit / previous Vercel deployment  
- **Risks:** CMS bootstrap may override defaults until admin content updated  

#### POS

- **Files:** exactly `64f53419` tree  
- **Git:** cherry-pick onto `main` — **never** deploy feature branch WIP  
- **Env:** existing POS Vercel; no new SEO secrets  
- **Validate:** SEO vitests + `npm run build` (includes verify-seo-assets)  
- **Smoke:** `/home`, `/robots.txt`, `/sitemap.xml`, one `/solutions/…`, confirm **no** `dkasu.com` marketing locs  
- **Rollback:** revert cherry-pick  
- **Risks:** conflict if `main` advanced; loyalty WIP must stay out  

#### Computers

- **Files:** Phase 4–6 tree + sitemap with **245** products  
- **Git:** first commit / PR vs thin `origin/main`  
- **Env:** `VITE_SUPABASE_*` shared project  
- **Validate:** `npm test && npx tsc -p tsconfig.app.json --noEmit && npm run build`; confirm product count  
- **Smoke:** `/`, `/shop`, `/category/laptops`, one `/products/jiji-…`, `/robots.txt`, Jiji footer link  
- **Rollback:** previous deployment; restore prior sitemap if needed  
- **Risks:** empty/wrong sitemap; missing anon key; SPA crawl limits  

### Post-deploy Search Console

- [ ] Properties: `www.dkasu.com`, `pos.dkasu.com`, `computer.dkasu.com`  
- [ ] Submit each sitemap  
- [ ] Inspect `/`, `/services/pos`, `/services/computer-arena`, POS `/home`, Computers product URL  
- [ ] Monitor decline of indexed `https://dkasu.com/home` POS leftovers  
- [ ] Confirm noindex on private routes  
- [ ] Rich results: Organization / SoftwareApplication / ComputerStore (no fake ratings)  

---

## 9. Approval gate

Phase 7 readiness documentation is complete.

**Await explicit owner approval before any Git commit, branch creation, cherry-pick, push, or Vercel deploy.**

Suggested first approval questions:

1. Approve Corporate SEO commit on `main`?  
2. Approve POS cherry-pick of `64f53419` onto `main` (excluding hospitality/loyalty WIP)?  
3. Approve Computers initial commit including **245**-product sitemap?  
4. Confirm deploy order Corporate → POS → Computers?  
