# DKASU Main Website — Phase 1 Enterprise SEO Report

**Project path:** `sites/dkasu-workspace` (GitHub: `kasulede81-prog/compsany-site`)  
**Live host:** `https://www.dkasu.com` (apex `https://dkasu.com` → **308** to www)  
**Status:** Implemented locally. **Not pushed. Not deployed.** Awaiting owner approval.

---

## 1. Initial SEO audit findings (Phase A)

| Area | Before |
|---|---|
| Framework / runtime | Custom Node/Vercel handler (`server/company-app.mjs`) + client SPA (`worker/ui/public.js`). Next `app/` is internal workspace only, not the public site. |
| Rendering | Server returns one HTML shell; body is client-rendered. Crawlers got a single global title/description. |
| Metadata | One title (`Dkasu — Computers, Software & CCTV`) and one description for all public routes. |
| Canonical | Missing |
| Open Graph / Twitter | Missing |
| JSON-LD | None |
| `robots.txt` | **404** |
| `sitemap.xml` | **404** |
| `html[lang]` | Present (`en`) |
| Admin protection | `/admin` already `noindex` + auth; APIs not for indexing |
| Brand assets | Logos embedded as data-URIs; no absolute OG image URL |
| Dead outbound link | Default Vision URL pointed at `https://vision.dkasu.com` (unreachable) |

---

## 2. Files modified / added

**Modified**
- `server/company-app.mjs` — path-aware SEO head, robots/sitemap routes, HTML 404, identity defaults, Vision website cleared
- `worker/ui/public.js` — page SEO sync, About/Contact identity, brand links, Italy wording
- `worker/ui/style.css` — About business-list styles
- `worker/core.js` — legacy Cloudflare shell title/OG parity
- `scripts/test-company-runtime.mjs` — SEO / robots / 404 coverage

**Added**
- `server/seo.mjs` — page meta, Organization/Person/WebSite/BreadcrumbList, robots, sitemap
- `public/robots.txt`
- `public/sitemap.xml`
- `public/og-image.png`
- `public/favicon.png`
- `public/brand/dkasu-logo.png`
- `public/brand/dkasu-icon.png`
- `docs/PHASE1_ENTERPRISE_SEO_REPORT.md` (this file)

**Unrelated local dirty files (not part of this SEO change set):** `.env.example`, `.gitignore`, prior cutover docs.

---

## 3. Pages and metadata updated

| Path | Title |
|---|---|
| `/` | DKASU \| Business Software, Computers & IT Solutions |
| `/products` | Products & Services \| DKASU |
| `/about` | About DKASU \| Waka Marketplace Limited |
| `/contact` | Contact DKASU \| Uganda & Italy |
| `/services/computer-arena` | DKASU Computers \| Computer Arena |
| `/services/pos` | DKASU POS \| Business Software |
| `/services/loyalty` | DKASU Loyalty \| Customer Engagement |
| `/services/vision` | DKASU Vision \| CCTV Installation |
| `/services/logistic` | DKASU Logistic \| Shipping & Logistics |

Each indexable page also receives unique description, canonical (`https://www.dkasu.com…`), Open Graph, and Twitter card tags. Homepage H1 remains the existing hero H1 (design preserved); meta description matches the Phase B brief.

---

## 4. Structured data implemented

Single `@graph` on public pages:
- **Organization** `@id` `https://www.dkasu.com/#organization` — name DKASU, legalName Waka Marketplace Limited, foundingDate `2025-12`, Uganda postal address, logo URL
- **Person** founder Denis Kasule (Founder & CEO) with verified LinkedIn `sameAs`
- **Place** Uganda + Italy contact location (Italy explicitly *not* claimed as a registered branch)
- **WebSite** publisher → Organization
- **BreadcrumbList** on internal pages

No Organization `sameAs` social profiles were added (none verified as official brand accounts).

---

## 5. Sitemap and robots

- `GET /robots.txt` — Allow `/`; Disallow `/admin`, `/api`; Sitemap URL
- `GET /sitemap.xml` — only public canonical pages listed above (no admin/API)
- Static copies also under `public/` for Vercel static precedence

---

## 6. Test and build results

| Command | Result |
|---|---|
| `npm run build` | Pass |
| `npm test` | **20/20 pass** (includes www canonical + SEO/robots/404 checks) |
| `npm run lint` | Pass after restoring `eslint@9.39.4` from lockfile (`npm ci`); ignore Next `app/` + legacy `worker/core.js` |
| JSON-LD parse | Pass (2 blocks on homepage head) |

No secrets committed in SEO files. No push/deploy performed.

---

## 7. Items requiring owner verification

1. **Preferred domain:** **Confirmed `https://www.dkasu.com`.** Apex permanently redirects to www (live 308 + `vercel.json` host redirect).
2. **Founder LinkedIn** kept on Person.sameAs only: `https://www.linkedin.com/in/kasule-denis-6395b3373`.
3. **Official brand socials** — none verified; not added.
4. **Marketplace / Vision** — internal pages only; no invented external domains.
5. **OG image 1200×630:** **PENDING.** Available logos are ~834×258 (and 96×96 icon). Interim `public/og-image.png` is the logo only — replace with a true 1200×630 asset before calling social previews final.
7. **CMS overrides:** Admin-editable site content can still override fallback copy/URLs after deploy; review live CMS values for Vision URL and addresses.
8. **Registered office vs mailing address:** Phase 1 uses the Uganda postal address you supplied. POS marketing still mentions Kikajjo Road / other box numbers elsewhere — confirm which address is public-facing for company schema.

---

## 8. Google Search Console setup instructions

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property **URL prefix** `https://www.dkasu.com` (matches live host). Optionally also add `https://dkasu.com` and use domain property for DNS verification.
3. Verify via DNS TXT on `dkasu.com`, or HTML meta / file upload after deploy.
4. After deploy of this Phase 1 build: submit `https://www.dkasu.com/sitemap.xml`.
5. Inspect homepage URL; request indexing for `/`, `/about`, `/contact`, `/products`.
6. Monitor Coverage / Page indexing for soft-404s and duplicate canonical issues between apex and www.
7. Do **not** submit admin or API URLs.

---

## 9. Remaining Phase 2 recommendations

1. Dedicated OG/social image and compressed brand assets (not data-URI-only).
2. Align apex↔www redirect policy with Search Console preferred domain.
3. Server-render minimal visible content for key routes (or prerender) to strengthen non-JS crawlers.
4. Add verified brand social `sameAs` when accounts are confirmed.
5. Confirm/publish Marketplace and Vision URLs; restore outbound links only when live.
6. POS cutover cleanup: move any remaining POS marketing sitemap entries off apex onto `pos.dkasu.com` (see domain cutover docs).
7. Optional FAQ / LocalBusiness enhancements once service-area claims are owner-approved.
8. Install/restore local ESLint in CI so `npm run lint` works without `npx` version drift.
9. Performance pass: font loading, image dimensions, LCP hero photo when configured.
10. Hreflang only if you intentionally publish separate locale sites.

---

## Approval gate

Ready for your review. **No git push and no Vercel deploy were performed.** Say when to commit/push and/or deploy.
