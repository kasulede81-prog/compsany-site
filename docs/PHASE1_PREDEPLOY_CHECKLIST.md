# DKASU Phase 1 — Pre-deployment checklist

**Canonical domain:** `https://www.dkasu.com`  
**Apex redirect:** `https://dkasu.com/*` → `https://www.dkasu.com/*` (permanent)  
**Do not touch:** `pos.dkasu.com`, `computer.dkasu.com`, `loyalty.dkasu.com`, or other subdomains.

## Redirect implementation (confirmed)

| Layer | Status |
|---|---|
| Live production | Apex already returns **HTTP 308** to `https://www.dkasu.com/` (verified) |
| `vercel.json` | Host-conditioned permanent redirect: `has.host=dkasu.com` → `https://www.dkasu.com/:path*` |
| Subdomains | Unaffected — redirect only matches host `dkasu.com`, not `*.dkasu.com` |
| Vercel Domains UI | Keep both `dkasu.com` and `www.dkasu.com` on project `compsany-site`; preferred/primary = **www** |

> Older cutover notes that suggested www→apex are superseded by this Phase 1 decision: **www is canonical**.

## SEO surfaces (must stay on www)

- [x] Canonical tags
- [x] `og:url` / Open Graph image absolute URLs
- [x] `sitemap.xml` `<loc>` entries
- [x] JSON-LD `@id` / `url` (`#organization`, `#founder`, `#website`, places)
- [x] `robots.txt` Sitemap line

## Before owner approves deploy

1. Commit is local only (no push until explicit approval).
2. Vercel env vars present on Production + Preview: `POS_SUPABASE_URL`, `POS_SUPABASE_ANON_KEY`, `COMPANY_INQUIRY_HMAC_SECRET`, `ADMIN_EMAIL`.
3. Confirm Domains: apex + www on `compsany-site` only; POS stays on `pos.dkasu.com`.
4. After deploy: hit `/`, `/robots.txt`, `/sitemap.xml`, `/about`, `/admin` (expect noindex), `/api/health`.
5. Submit sitemap in Google Search Console for `https://www.dkasu.com`.

## Outstanding / pending

- **OG image 1200×630:** PENDING — current asset is logo PNG **834×258** (interim only).
- Company brand social `sameAs`: none verified (founder LinkedIn only on Person).
- Marketplace / Vision: internal pages only; no invented external domains.
- Local ESLint must be installed from lockfile (`npm ci`) before lint gate.
- Do not commit real secrets into `.env.example`.
