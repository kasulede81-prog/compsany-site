# DKASU Company Platform — Phase 2.1 Security Hardening Report

**Date:** 16 November 2026  
**Status:** Source preparation complete. **Migration not applied by the agent.** Owner applies manually.  
**Supabase project:** `ljaedextsenbkxzzgxcg`  
**Prerequisite:** Phase 2 migrations already applied by owner.

## Documents read

- `DKASU_SITE_BLUEPRINT.md`
- `docs/DKASU_COMPANY_ARCHITECTURE_AUDIT.md`
- `docs/DKASU_COMPANY_IMPLEMENTATION_PLAN.md`
- `docs/COMPANY_PHASE_2_IMPLEMENTATION_REPORT.md`
- `supabase/migrations/20261116140000_company_schema_foundation.sql`
- `supabase/migrations/20261116140100_company_rls_and_rpcs.sql`

## Exact files created / updated

| File | Action | Purpose |
| --- | --- | --- |
| `DkasuPOS-Mac/supabase/migrations/20261116150000_company_security_hardening.sql` | **Created** | Additive hardening migration |
| `DkasuPOS-Mac/supabase/tests/company_phase2_authorization.sql` | **Replaced** | Stronger prepared tests (no success-on-any-error) |
| `sites/dkasu-workspace/docs/COMPANY_WORKER_INQUIRY_SECURITY.md` | **Created** | Worker HMAC design + config |
| `sites/dkasu-workspace/docs/COMPANY_PHASE_2_1_SECURITY_CHECKLIST.md` | **Created** | Manual verification checklist |
| `sites/dkasu-workspace/docs/COMPANY_PHASE_2_1_SECURITY_REPORT.md` | **Created** | This report |
| `sites/dkasu-workspace/docs/COMPANY_BACKEND_ADAPTER_DESIGN.md` | **Updated** | Inquiry path → `company_worker_create_inquiry` |

**Not modified:** previously applied Phase 2 migration files; POS merchant/hospitality/billing/printer/sales tables; live Worker auth; `DATA_BACKEND`.

## Security fixes addressed

### 1. Public inquiry (critical)

- `company_public_create_inquiry` replaced with a no-op controlled error; **EXECUTE revoked from anon/authenticated**.
- New `company_worker_create_inquiry` requires:
  - timestamp window (±300s)
  - single-use nonce (`company.inquiry_nonces`)
  - HMAC-SHA256 over canonical payload using `company.runtime_secrets.inquiry_hmac_secret`
  - `pg_advisory_xact_lock` email throttle (5/hour)
  - optional client fingerprint soft throttle
- Browser never receives the HMAC secret or service_role.
- Worker keeps existing `/api/inquiries` shape (Phase 3 wiring).

### 2. Public CMS protection

- `company_public_get_bootstrap` now runs site JSON through `_company_public_site_view`.
- Allowlisted public fields only; rebuilds `services` from `public_listed` divisions.
- Strips internal notes, drafts, admin settings, and unlisted divisions from public output.

### 3. Input validation

- Inquiry status allowlist → `invalid_status`.
- Catalog boolean/numeric parsers → `invalid_field_types` / `invalid_price` / `invalid_stock` / `invalid_currency` / `invalid_specs`.
- Condition allowlist unchanged; non–Computer Arena forced empty.

### 4. Privileges

- `runtime_secrets` / `inquiry_nonces`: FORCE RLS, no API-role grants or policies.
- No new broad `service_role` table DML grants.
- `service_role` may EXECUTE worker inquiry RPC as optional server path only.
- Explicit reminder: do not expose schema `company` in PostgREST.

## Required owner configuration (manual)

```sql
insert into company.runtime_secrets (key, value)
values ('inquiry_hmac_secret', '<SAME AS Sites COMPANY_INQUIRY_HMAC_SECRET>')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

Sites secret: `COMPANY_INQUIRY_HMAC_SECRET` (≥32 bytes). Not used until Phase 3 Worker wiring.

## Manual migration application checklist

1. Review `20261116150000_company_security_hardening.sql`.
2. Apply on staging first.
3. Insert HMAC secret (above).
4. Run checklist: `docs/COMPANY_PHASE_2_1_SECURITY_CHECKLIST.md`.
5. Optionally run prepared SQL tests on staging only.
6. Apply to production when staging passes.
7. Do **not** flip `DATA_BACKEND` or change live login yet.

## Remaining risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| HMAC secret not configured → all signed inquiries fail `server_misconfigured` | High ops | Owner insert secret before Phase 3 cutover |
| Anon can still *call* worker RPC but cannot forge HMAC | Accepted | Keep secret strong; monitor 401/unauthorized rates |
| Worker not yet implementing signer (Phase 3) | Expected | D1 inquiry path remains live |
| Fingerprint throttle uses nonce table (includes failed attempts after auth) | Low | Acceptable anti-abuse behavior |
| Real JWT matrix still needs staging harness | Medium | Checklist items 13–16 |
| `pgcrypto.hmac` schema location differences | Low | `search_path` includes `extensions`; pgcrypto already in project |

## Validation performed here

- Static review of new migration (payload concatenation fixed to avoid `concat_ws` dropping empties).
- Confirmed Phase 2 files untouched.
- Tests rewritten to assert specific error codes / leakage strings.
- **Not run** against production or hosted SQL.

## Stop

Phase 2.1 source preparation is complete. Awaiting owner apply + approval before Phase 3 website integration.
