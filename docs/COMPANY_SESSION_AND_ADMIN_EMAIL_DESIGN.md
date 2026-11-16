# Company session security design (Phase 2 — design only)

**Status:** Design documentation only. Live `/admin/pos-login` and JWT cookie behavior are **not** changed in Phase 2.

## Current (verified) behavior

1. POS posts the Supabase **access JWT** to `/admin/pos-login`.
2. Site verifies via `waka_internal_me` (`super_admin` / `operations_admin`, active).
3. Site sets HttpOnly cookie `dkasu_pos_admin` = full access token, `Max-Age=3600`.
4. Every admin request re-validates the token with `waka_internal_me`.
5. Parallel path: ChatGPT header `oai-authenticated-user-email` matching Sites secret `ADMIN_EMAIL`.

## Risks

- Cookie holds a credential that can also call POS APIs if stolen (same JWT).
- `ADMIN_EMAIL` bypasses POS RBAC and revocation in `internal_admins`.

## Target: opaque company session (Phase 3+)

### Flow

1. POS still posts access token once to `/admin/pos-login` (unchanged UX).
2. Worker validates with `waka_internal_me` (or `is_waka_internal_admin` RPC).
3. Worker **discards** storing the JWT in the browser cookie.
4. Worker creates a server-side session:
   - Preferred store: `company.admin_sessions` (future migration) or encrypted Durable Object / KV on Sites.
   - Fields: `id`, `user_id`, `internal_admin_id`, `role`, `expires_at`, `created_at`, `revoked_at`, `user_agent_hash`, `ip_hash`.
5. Cookie becomes opaque: `dkasu_company_session=<random 256-bit>` HttpOnly Secure SameSite=Lax, short TTL (≤ 1h) with sliding refresh optional.
6. Admin APIs load session → confirm `internal_admins` still active and role still allowed → proceed.
7. For Supabase admin RPCs, Worker uses one of:
   - **A (preferred long-term):** short-lived user JWT exchanged server-side only, never written to cookie; or  
   - **B:** Edge Function with service role that re-checks admin id from the opaque session.

### Revocation

- Deactivating `internal_admins` fails closed on next request.
- Explicit logout deletes/revokes session row and clears cookie.
- Password/auth revocation on Supabase invalidates any held JWT; opaque session should also re-check admin row each request.

### CSRF

- Keep Origin checks on mutations.
- Add double-submit or CSRF token for cookie-authenticated POSTs when opaque sessions land.

## ChatGPT `ADMIN_EMAIL` retirement plan

| Stage | Behavior |
| --- | --- |
| Phase 2 (now) | Unchanged |
| Phase 3 | Log every `ADMIN_EMAIL` success into audit (`actor_email`, action `break_glass_admin_email`) once Supabase writes exist |
| Phase 4+ | Break-glass only: require second factor or time-limited Sites secret rotation; primary path = POS roles |
| End state | Remove email-equality bypass **or** map the email to a specific `internal_admins.auth_user_id` and still require that row active |

Do not remove the ChatGPT path before opaque sessions and Supabase admin RPCs are proven.

## Non-goals for Phase 2

- No Worker code changes
- No new session table migration yet (can be Phase 3 additive migration)
- No production auth or cookie changes
EOF