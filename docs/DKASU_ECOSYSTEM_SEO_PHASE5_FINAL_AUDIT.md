# DKASU Ecosystem SEO — Phase 5 Final Audit

**Date:** 17 November 2026  
**Scope:** Cross-site identity, canonicals, structured data, sitemaps, indexing, crawlability, release safety  
**Status:** Local hardening complete. **No commits. No pushes. No deployments. No migrations. No production data changes.**

| Site | Live host | Local repository |
|------|-----------|------------------|
| Corporate | https://www.dkasu.com | `/Users/denis/Documents/ChatGPT/dkasu company/sites/dkasu-workspace` |
| POS | https://pos.dkasu.com | `/Users/denis/Developer/DkasuPOS-Mac` |
| Computers | https://computer.dkasu.com | `/Users/denis/Downloads/dk-computer-arena-main` |

Prior phase reports read: Phase 3 corporate · Phase 2 POS · Phase 4 Computers.

---

## 1. Executive summary

Phases 2–4 delivered solid **local** SEO for each product host, all pointing at the corporate Organization graph. **Production still serves pre-phase SEO** for Corporate and POS (and older Computers shell until Phase 4+5 deploy).

Phase 5 verified the graph, fixed remaining safe inconsistencies, **restored the Computers product sitemap** after a static-only wipe risk, and hardened sitemap regeneration so release cannot drop product URLs without a DB read.

**Verdict:** Ecosystem SEO is **ready for a coordinated, isolated release** after owner approval — provided POS hospitality/loyalty WIP is **not** shipped with the SEO commit, and Computers ships with the **product-bearing** sitemap.

---

## 2. Findings per website

### Corporate (`www.dkasu.com`)

| Area | Local (Phase 3+5) | Live (as of audit) |
|------|-------------------|--------------------|
| Canonical host | `https://www.dkasu.com` | Correct |
| Homepage title | Business Software, POS Systems & IT Solutions Uganda | Still Phase 1 wording |
| Organization | `#organization`, legalName **Waka Marketplace Limited**, founder **Denis Kasule** | Present (Phase 1) |
| SoftwareApplication | `pos.dkasu.com/#software` → parent org | Live lacks Phase 3 node until deploy |
| ComputerStore | `computer.dkasu.com/#store` → parent org (**Phase 5 added**) | Not live yet |
| robots / sitemap | www host; admin/api disallowed | OK |
| Computers marketing copy | Softened away from unverified “Dubai used” emphasis (**Phase 5**) | Still Dubai-heavy until deploy |

### POS (`pos.dkasu.com`)

| Area | Local (Phase 2 commit `64f53419`) | Live |
|------|-----------------------------------|------|
| Marketing canonical | `https://pos.dkasu.com` | **Still `https://dkasu.com`** (broken for marketing) |
| robots Sitemap | `pos.dkasu.com/sitemap.xml` | Points at **apex `dkasu.com`** |
| sitemap locs | All `pos.dkasu.com` | All **`dkasu.com`** |
| Schema | `#software` + `#pos-brand` → `#organization` | Wrong host until deploy |
| Private routes | meta noindex + X-Robots-Tag + robots Disallow prefixes | Incomplete vs local |

**Critical production gap:** Live POS SEO still claims apex/company URLs that 404 or belong to Corporate.

### Computers (`computer.dkasu.com`)

| Area | Local (Phase 4+5) | Live |
|------|-------------------|------|
| Canonical host | `computer.dkasu.com` | Correct |
| Homepage SEO | Uganda laptop/computer intent; DKASU division | Older shell title/description |
| ComputerStore → org | Yes | Older ComputerStore without parent link |
| robots | Disallows cart/wishlist/admin/account/checkout | Missing cart/wishlist |
| sitemap | **245 product URLs restored** + static/categories incl. tablets | Has products + tablets |
| Founder naming | Aligned to **Denis Kasule** + Waka Marketplace Limited | “Kasule Denis” / older About claims |

---

## 3. Critical issues

1. **Live POS canonical/sitemap/robots still on `https://dkasu.com`** — highest SEO severity; fixed only in local Phase 2 commit, not deployed.  
2. **Corporate + Computers Phase 3/4 not live** — identity/links incomplete in production.  
3. **POS working tree mixes SEO commit with large hospitality/loyalty WIP** — deploy risk if branch is pushed as-is.  
4. **Computers SPA crawlability** — product HTML depends on JS; sitemap products are essential.  
5. **Founder name inconsistency** — Corporate/Computers: Denis Kasule; POS marketing still uses “Kasule Denis” (document; do not mass-edit POS WIP in Phase 5).  
6. **Corporate CMS** still allows catalog conditions `UK used` / `Dubai used` (API-verified enum) — public marketing copy aligned to Computers; admin enum left intact.  

---

## 4. Fixes applied locally (Phase 5)

### Computers
- Restored live **245-product** sitemap into `public/sitemap.xml` (must not ship static-only).  
- Hardened `scripts/regenerate-sitemap.mjs`: preserves existing `/products/*` when DB URL missing/fails; **refuses** empty static-only wipe.  
- Documented safe command in `.env.example`.  
- Added **tablets** to `CATEGORIES` + `CATEGORY_SEO` (matches live catalog/sitemap).  
- Founder display → **Denis Kasule**; footer notes **Waka Marketplace Limited**.  

### Corporate
- Aligned Computers SEO/marketing copy with verified Computer Arena offerings (refurbished/new, Europe & UK; removed public Dubai emphasis).  
- Added `computerStoreNode()` to Organization `@graph` with `@id` `https://computer.dkasu.com/#store` and `parentOrganization` → `#organization`.  
- Rebuilt company assets (`npm run build`).  

### POS
- **No further SEO code edits** in Phase 5 (Phase 2 already correct).  
- Verified local robots/sitemap/hosts and SEO tests still pass amid unrelated WIP.  

---

## 5. Remaining unresolved items

| Item | Owner action |
|------|----------------|
| Deploy Phases 2–5 in isolation | See §11 |
| POS founder display name “Kasule Denis” vs corporate “Denis Kasule” | Optional follow-up rename on marketing pages only |
| Corporate interim OG `pending_1200x630` | Replace with true 1200×630 creative |
| Computers logo ~895 KB / JS ~924 KB | Compress / code-split later |
| SPA prerender/SSR for POS + Computers | Recommended later; not in this release |
| Regenerate Computers sitemap from DB before/after deploy | Use read-only `COMPANY_DATABASE_URL` |
| Loyalty host WIP (`lyt.dkasu.com` vs `loyalty.dkasu.com`) on POS branch | **Exclude** from SEO release |
| CMS “Dubai used” condition enum | Keep until product data reviewed |

---

## 6. Cross-site structured data verification

```
https://www.dkasu.com/#organization
  legalName: Waka Marketplace Limited
  founder → https://www.dkasu.com/#founder (Denis Kasule)
  WebSite → https://www.dkasu.com/#website

https://pos.dkasu.com/#software
  provider / author / isPartOf → corporate @ids
  POS brand → https://pos.dkasu.com/#pos-brand (parentOrganization → #organization)

https://computer.dkasu.com/#store
  parentOrganization → #organization
  WebSite publisher → #organization
  Product/Offer on PDP (live price/stock only; no invented ratings)
  Service on /services (repairs/upgrades)
```

**Rules upheld:** no fabricated AggregateRating/Review; no invented registration numbers; Italy noted as contact location on corporate graph.

---

## 7. Sitemap status

| Site | Local host | Product URLs | Notes |
|------|------------|--------------|-------|
| Corporate | www.dkasu.com | N/A (service pages) | Public routes only |
| POS | pos.dkasu.com | N/A (16 marketing URLs) | Live still wrong host |
| Computers | computer.dkasu.com | **245** | Restored from production; tablets category retained |

### Computers product sitemap — safe regenerate

Read-only SELECT; never put DB URL in Vite/browser env:

```bash
cd /Users/denis/Downloads/dk-computer-arena-main
COMPANY_DATABASE_URL='postgresql://…ljaedextsenbkxzzgxcg…' node scripts/regenerate-sitemap.mjs
```

Without `COMPANY_DATABASE_URL`, the script **preserves** existing product locs and exits non-zero if none exist (prevents static-only wipe).

---

## 8. Product indexing readiness

| Requirement | Status |
|-------------|--------|
| Public product URLs in sitemap | Yes (245) |
| Canonical host `computer.dkasu.com` | Yes |
| Unique titles/descriptions from catalog | Yes (client `useSeo`) |
| Product + Offer JSON-LD from real price/stock | Yes |
| Private cart/checkout/account/admin excluded | Yes (robots + meta + X-Robots) |
| Crawler HTML without JS | **Partial** — SPA; sitemap + shell meta mitigate |
| DB regenerate before release | Recommended when credentials available |

---

## 9. Test results (Phase 5)

| Repo | Check | Result |
|------|-------|--------|
| Corporate | `npm test` | **20/20 pass** |
| Corporate | `npm run build` | Pass |
| Corporate | Schema `@id`s include `#organization`, `#software`, `#store` | Pass |
| POS | SEO vitests (`company.seo`, `seoRoutes`, businessPrinter) | **38 pass** |
| POS | `scripts/verify-seo-assets.mjs` | Pass (`pos.dkasu.com`) |
| Computers | `npm test` | **19 pass** |
| Computers | `tsc -p tsconfig.app.json --noEmit` | Pass |
| Computers | `npm run build` | Pass |
| Computers | Sitemap preserve without DB | **245 products kept** |

Pre-existing Computers ESLint issues in shadcn UI / tailwind remain unrelated.

---

## 10. Git isolation and release safety

### Corporate
- Branch: `main` (tracks `origin/main`)  
- Dirty: Phase 3+5 SEO files + untracked reports/plans  
- **Do not** mix with unrelated docs-only noise in the SEO commit if splitting commits  

### POS
- Branch: `codex/arena-admin-super-only` (**ahead 1** of origin)  
- Tip commit: **`64f534196e850d662c7d399dd78096bdbaa62085`** `fix(seo): align DKASU POS marketing with pos subdomain`  
- **Large uncommitted hospitality / loyalty / admin WIP** on the same branch  
- **Release rule:** ship **only** the SEO commit (or cherry-pick `64f53419` onto a clean release branch). **Do not** deploy hospitality/loyalty WIP with SEO.  

### Computers
- Repo has **no commits yet** on `main` (all work staged/untracked including Phase 4+5)  
- First commit must include product sitemap (245 URLs), not static-only  
- Follow `docs/ARENA_ACTIVATION_CHECKLIST.md` for env/SQL — SEO deploy ≠ DB migration  

---

## 11. Exact deployment order

1. **Corporate first** (identity root: `#organization`, `#founder`, `#website`, SoftwareApplication + ComputerStore references, cross-links).  
2. **POS second** — deploy **SEO-only** (`64f53419` isolation); verify live `robots.txt` / `sitemap.xml` / homepage canonical = `pos.dkasu.com`.  
3. **Computers third** — deploy Phase 4+5 with **product sitemap**; optionally regenerate from `COMPANY_DATABASE_URL` immediately before build.  
4. Smoke: homepage titles, reciprocal footer/nav links, sample product URL, `/services/pos` + `/services/computer-arena`.  
5. **Do not** cut over unrelated Vercel env or run Arena SQL as part of SEO release unless already approved separately.

---

## 12. Post-deployment Search Console checklist

- [ ] Confirm properties for `www.dkasu.com`, `pos.dkasu.com`, `computer.dkasu.com` (and apex redirect awareness).  
- [ ] Submit each host’s `sitemap.xml`.  
- [ ] URL Inspection: corporate `/`, `/services/pos`, `/services/computer-arena`.  
- [ ] URL Inspection: POS `/home` + one solutions URL — canonical must be `pos.dkasu.com`.  
- [ ] URL Inspection: Computers `/` + one `/products/{slug}` + `/category/laptops`.  
- [ ] Request removal / monitor decline of indexed `https://dkasu.com/home` POS marketing leftovers if any.  
- [ ] Verify noindex on POS login/internal and Computers cart/checkout/admin.  
- [ ] Re-check Rich Results / schema for Organization + SoftwareApplication + ComputerStore (no rating spam).  
- [ ] Monitor Core Web Vitals separately (bundle/logo follow-ups).  

---

## Approval gate

Phase 5 local audit and safe hardening are complete.

**Awaiting owner approval before any commit, push, or Vercel deploy across the three repositories.**
