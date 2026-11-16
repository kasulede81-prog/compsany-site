# Worker inquiry security design (Phase 2.1)

**Status:** Design for Phase 3 implementation. Live Worker is unchanged in Phase 2.1.  
**Pairs with:** `supabase/migrations/20261116150000_company_security_hardening.sql`

## Goal

Public visitors submit inquiries only through the company website. Direct anonymous Supabase RPC calls cannot insert leads without a Worker-held signing secret.

## Trust boundary

| Component | Trust |
| --- | --- |
| Browser | Untrusted. Never receives `COMPANY_INQUIRY_HMAC_SECRET` or `service_role`. |
| Company Worker (Sites) | Trusted server. Holds HMAC secret + existing anon key. Enforces IP rate limits + honeypot. |
| Supabase RPC `company_worker_create_inquiry` | Verifies HMAC, nonce replay, advisory-locked email throttle. |
| `company_public_create_inquiry` | Disabled (controlled error; anon EXECUTE revoked). |

## Required Sites / Worker configuration

| Secret / env | Where | Purpose |
| --- | --- | --- |
| `COMPANY_INQUIRY_HMAC_SECRET` | Sites Worker secret only | ≥32 random bytes (hex/base64). Signs inquiry requests. |
| `POS_SUPABASE_URL` | Existing | RPC host |
| `POS_SUPABASE_ANON_KEY` | Existing | Call RPC (signature still required) |
| `DATA_BACKEND` | Phase 3 | Keep `d1` until cutover |

### Matching database secret (owner, after migration apply)

```sql
insert into company.runtime_secrets (key, value)
values ('inquiry_hmac_secret', '<SAME VALUE AS COMPANY_INQUIRY_HMAC_SECRET>')
on conflict (key) do update
  set value = excluded.value, updated_at = now();
```

Rotate by updating both the Sites secret and this row together.

**Do not** put `service_role` in the Worker for this path. Phase 2.1 uses **anon key + HMAC**.

## Compatible website flow

Preserve `POST /api/inquiries` JSON body: `name`, `email`, `message`, `interest`, `market`, honeypot field `website`.

Phase 3 Worker steps:

1. IP rate limit (≤10 / 10 minutes / IP); reject oversized bodies.
2. If honeypot `website` set → return `{ok:true}` without calling Supabase.
3. Normalize fields exactly as the SQL function does (`trim`, length caps, `lower(email)`).
4. `ts = unix_seconds_now`, `nonce = crypto.randomUUID()` (or ≥16 random chars).
5. Optional `client_fp = hex(sha256(ip || '|' || user-agent))` — never send raw IP.
6. Canonical UTF-8 payload (exact):

```text
v1|{ts}|{nonce}|{name}|{email}|{message}|{interest}|{market}|{client_fp}
```

7. `signature = hex(hmac_sha256(utf8(payload), COMPANY_INQUIRY_HMAC_SECRET))`
8. `POST /rest/v1/rpc/company_worker_create_inquiry` with the anon key + signed args
9. Map RPC errors: `rate_limited` → soft limit response; `validation` → 400; `unauthorized` / `expired` / `replay` → 403; `server_misconfigured` → 503

## Replay and throttling

- Nonce stored in `company.inquiry_nonces` (single-use).
- Timestamp must be within ±300 seconds.
- `pg_advisory_xact_lock` on email before counting ≥5 inserts / hour.
- Optional fingerprint: more than 10 nonces / 10 minutes / `client_fp`.

## Why not a browser secret?

Any secret shipped to JavaScript can be extracted. The HMAC secret stays on the Worker and in `company.runtime_secrets` (no API role grants or RLS policies).

## Schema exposure

Do **not** add schema `company` to PostgREST exposed schemas. Call only `public.company_*` RPCs.
