# DKASU Company — GitHub Release Checklist

Target remote: `https://github.com/kasulede81-prog/compsany-site.git`  
Local path: `sites/dkasu-workspace`

## Pre-push security

- [ ] `.env.example` contains **placeholders only**
- [ ] No `.env`, `.env.local`, `.env.production`, `.dev.vars`, or `.vercel` in the commit
- [ ] `npm run scan:secrets` exits 0
- [ ] HMAC previously shown in screenshots / old `.env.example` is **not** reused in production
- [ ] Commit does **not** include POS repo files or hospitality changes
- [ ] `dist/` and `server/generated-assets.mjs` remain ignored (built on CI/Vercel)

## Local verification

- [ ] `npm run build`
- [ ] `npm test` (14 mocked runtime checks)
- [ ] Optional: `npm run verify:secrets` with env injected (presence only; no value printing)

## Git remote

- [ ] `git remote -v` shows `origin` → `https://github.com/kasulede81-prog/compsany-site.git`
- [ ] Remote was empty at preparation time (`git ls-remote` had no refs)
- [ ] **Do not** `git push --force`
- [ ] Push only after owner approval

## Suggested first push (owner-approved)

```bash
cd "/Users/denis/Documents/ChatGPT/dkasu company/sites/dkasu-workspace"
git remote add origin https://github.com/kasulede81-prog/compsany-site.git   # if missing
git push -u origin main
```

## After GitHub has code

- [ ] Import into Vercel (see `COMPANY_VERCEL_DEPLOYMENT_GUIDE.md`)
- [ ] Set Production env vars
- [ ] Deploy Preview, then Production
- [ ] Smoke-test routes and POS admin entry
- [ ] Only then consider DNS / custom domain

## Do not include in releases

- Real secrets or JWT values
- Supabase service_role keys
- Local tool state (`.sites-runtime`, `.wrangler`, `outputs/`)
- Unrelated POS / hospitality trees
