# DKASU Company — Environment Configuration Preflight

**Date:** 16 November 2026  
**Mode:** Read-only inspection. No secrets printed, rotated, committed, deployed, or written to production.

## Target project

| Item | Value |
| --- | --- |
| Project ref | `ljaedextsenbkxzzgxcg` |
| Project name (CLI) | Waka-pos |
| Expected URL | `https://ljaedextsenbkxzzgxcg.supabase.co` |
| Linked in POS CLI | Yes |

## Naming map (important)

| Company Site (Sites Worker) | POS local env |
| --- | --- |
| `POS_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `POS_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |
| `COMPANY_INQUIRY_HMAC_SECRET` | *(no POS equivalent today)* |
| `ADMIN_EMAIL` | *(Sites-only)* |
| DB `company.runtime_secrets.inquiry_hmac_secret` | must match Worker HMAC secret |

## Required variable status

### `POS_SUPABASE_URL` / project URL

| Location | Status |
| --- | --- |
| POS `.env.development.local` | **Found locally** — matches target project URL |
| POS `.env.production.local` | **Found locally** — matches target project URL |
| POS `.env.production.example` | **Found locally** — documents correct URL (example file) |
| Company Site `.env` / `.dev.vars` | **Missing locally** |
| Company Site `.env.example` | Placeholder only |
| Sites runtime | **Not verifiable from this machine** — Blueprint states `POS_SUPABASE_URL` is a Sites secret for the live company Site (pre-Phase-3). Re-confirm in Sites dashboard before publish. |
| Action required | Set Sites secret `POS_SUPABASE_URL` = `https://ljaedextsenbkxzzgxcg.supabase.co` |

### `POS_SUPABASE_ANON_KEY` (public anon / publishable)

| Location | Status |
| --- | --- |
| POS `.env.development.local` | **Found locally** — JWT-like anon key present |
| POS `.env.production.local` | **Found locally** — same fingerprint as development local |
| Company Site local files | **Missing locally** |
| Sites runtime | **Not verifiable here** — Blueprint states anon key is stored as Sites secret. Re-confirm before publish. |
| Action required | Copy the existing POS production anon key into Sites as `POS_SUPABASE_ANON_KEY` (do not invent a new key). Never commit it. |

Connectivity check (anon key used in-process only; value not logged): `company_public_get_bootstrap` returned HTTP 200 with `ok`.

### `COMPANY_INQUIRY_HMAC_SECRET`

| Location | Status |
| --- | --- |
| POS local env files | **Missing locally** |
| Company Site local env files | **Missing locally** |
| Sites runtime | **Not verifiable** — almost certainly missing (new Phase 2.1/3 requirement; not mentioned in older blueprint Sites secrets list) |
| Action required | Generate a new ≥32-character random secret offline; set as Sites `COMPANY_INQUIRY_HMAC_SECRET`; store the **same** value in Supabase (below). Do not put it in Git. |

### Database `company.runtime_secrets.inquiry_hmac_secret`

| Location | Status |
| --- | --- |
| Supabase (read-only query) | **Configured in Supabase: NO** (`inquiry_hmac_secret_configured = false`) |
| Table `company.runtime_secrets` | Exists |
| RPC `company_worker_create_inquiry` | Exists |
| Runtime probe | Valid-timestamp + bad signature → `server_misconfigured` (confirms secret absent/too short) |
| Action required | Owner must insert matching secret (SQL below). |

### `ADMIN_EMAIL`

| Location | Status |
| --- | --- |
| Company Site local | **Missing locally** |
| Sites runtime | **Not verifiable here** — Blueprint states it is already a Sites secret |
| Action required | Optional for Phase 3 CRUD (POS Super/Operations session required). Confirm still set if ChatGPT HTML break-glass is desired. |

## Supabase schema sanity (read-only)

| Check | Result |
| --- | --- |
| `company.divisions` count | 7 |
| `public_listed` count | 5 |
| `company_public_get_bootstrap` | Present + callable with anon |
| `company_worker_create_inquiry` | Present + callable (returns auth/config errors as designed) |
| Legacy `company_public_create_inquiry` for anon | Denied (401) — expected after Phase 2.1 |

## Sites expected runtime secrets (from Worker code)

1. `POS_SUPABASE_URL`
2. `POS_SUPABASE_ANON_KEY`
3. `COMPANY_INQUIRY_HMAC_SECRET`
4. `ADMIN_EMAIL` (optional)

## Local build / config checks

| Check | Result |
| --- | --- |
| `node --check worker/core.js` | Pass |
| `node scripts/build-worker.mjs` | Pass |
| Company Site local Supabase env files | Absent (expected until `.dev.vars` or Sites secrets) |
| Service-role keys in inspected POS env files | None found by name |
| Secret values in this report | None |

## Mismatches / gaps

1. **HMAC secret missing everywhere** (local + Supabase). Blocks signed inquiries (`server_misconfigured`).
2. **Company Site has no local env** with `POS_SUPABASE_*` — fine for hosted Sites if dashboard secrets are set; required for local Worker preview.
3. **Name remap** POS `VITE_*` → Sites `POS_*` must be done carefully when configuring Sites.
4. Sites secret presence for URL/anon/ADMIN_EMAIL is historically claimed by blueprint but **cannot be confirmed** from this environment.

## Manual configuration steps (owner)

### A. Create HMAC secret (once)

```bash
# Example only — run locally, do not paste the output into chat/git
openssl rand -hex 32
```

### B. Supabase (SQL editor on project `ljaedextsenbkxzzgxcg`)

```sql
insert into company.runtime_secrets (key, value)
values ('inquiry_hmac_secret', '<PASTE SAME SECRET>')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

-- verify WITHOUT reading the value:
select key, char_length(value) as len, updated_at
from company.runtime_secrets
where key = 'inquiry_hmac_secret';
```

### C. Sites dashboard secrets for company workspace

Set (or confirm):

- `POS_SUPABASE_URL` = `https://ljaedextsenbkxzzgxcg.supabase.co`
- `POS_SUPABASE_ANON_KEY` = existing POS production anon key from `.env.production.local` / Supabase dashboard (Settings → API → anon public)
- `COMPANY_INQUIRY_HMAC_SECRET` = same value as DB `inquiry_hmac_secret`
- `ADMIN_EMAIL` = optional existing break-glass email

### D. Optional local preview (`.dev.vars`, gitignored)

```bash
# sites/dkasu-workspace/.dev.vars  (do not commit)
POS_SUPABASE_URL=https://ljaedextsenbkxzzgxcg.supabase.co
POS_SUPABASE_ANON_KEY=<anon key>
COMPANY_INQUIRY_HMAC_SECRET=<same hmac>
ADMIN_EMAIL=<optional>
```

Then: `node scripts/verify-company-secrets.mjs` with those vars exported.

## Stop

No publication performed. Configure HMAC + confirm Sites secrets before publishing the Phase 3 Worker.
