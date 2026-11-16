# Company Phase 2.1 — security verification checklist

Use on **staging** after applying `20261116150000_company_security_hardening.sql`.  
Do not run destructive tests against production.

## Apply

1. [ ] Confirm Phase 2 foundation + RLS migrations already applied.
2. [ ] Review `20261116150000_company_security_hardening.sql`.
3. [ ] Apply hardening migration only (do not reapply Phase 2 files).
4. [ ] Insert matching HMAC secret into `company.runtime_secrets` (`inquiry_hmac_secret`).
5. [ ] Store the same value as Sites secret `COMPANY_INQUIRY_HMAC_SECRET` (not yet wired until Phase 3).

## Public surface

6. [ ] Anon `company_public_get_bootstrap` returns 5 divisions only.
7. [ ] Plant `internalNotes` / `draftCampaign` / `adminSettings` in `site_content` → absent from bootstrap.
8. [ ] Unpublished catalog item not returned; published item returned.
9. [ ] Anon `company_public_create_inquiry` cannot insert (EXECUTE denied or `direct_rpc_disabled`).
10. [ ] Unsigned `company_worker_create_inquiry` returns `unauthorized` / `server_misconfigured`.
11. [ ] Valid Worker HMAC insert succeeds; replay nonce returns `replay`.
12. [ ] Sixth inquiry same email within an hour returns `rate_limited` (advisory lock).

## Admin / roles (real JWTs)

13. [ ] Merchant JWT: `company_admin_get_bootstrap` Forbidden; no inquiry rows via table REST (schema not exposed).
14. [ ] support_admin / field_agent: admin RPCs Forbidden.
15. [ ] operations_admin / super_admin: bootstrap OK; catalog upsert audits; invalid status → `invalid_status`.
16. [ ] Invalid priceAmount → `invalid_field_types` / `invalid_price` (no SQL internals in message).

## Privileges

17. [ ] `anon` has no table grants on `company.*`.
18. [ ] `runtime_secrets` not granted to anon/authenticated.
19. [ ] Schema `company` **not** listed in PostgREST exposed schemas.
20. [ ] Merchant shops/products reads still work (smoke).

## Cleanup

21. [ ] Remove staging test inquiries / catalog fixtures.
22. [ ] Rotate HMAC secret if staging secret was shared in chat/logs.
