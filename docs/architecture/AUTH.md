# Authentication Architecture — t360

## Actors

| Actor | Primary login | Secondary |
|-------|---------------|-----------|
| Customer | Mobile OTP | Optional email/password, Google OAuth |
| Admin / staff | Email + password | MFA (TOTP) for privileged roles |

## Token model

- **Access token:** short-lived JWT (claims: `sub`, roles/permissions version or role ids, `sid`, `typ`).
- **Refresh token:** opaque or JWT stored hashed server-side; **rotation** on each use.
- **Reuse detection:** if a rotated refresh is replayed, revoke the session family.
- **Sessions / devices:** list and revoke from account settings (customer) and admin security UI.

## Storage

| Client | Access | Refresh |
|--------|--------|---------|
| Customer Web (current) | `localStorage` (migrated from `sessionStorage`) + Bearer | Same store; 401 → `/auth/refresh` with mutex + single retry |
| Admin Web (current) | `localStorage` + Bearer | Same; proactive near-expiry refresh |
| Flutter | Secure storage | Secure storage |

**Deferred:** httpOnly Secure SameSite cookie auth + Next.js BFF (CORS/CSRF). Prefer cookies for production hardening in a dedicated pass.

## Customer OTP flow

1. `POST /api/v1/auth/otp/request` with E.164 mobile (India-focused).
2. Rate limit by IP + mobile; OTP TTL and max attempts in Redis/DB.
3. Send via SMS provider port (dev mock labeled clearly).
4. `POST /api/v1/auth/otp/verify` → create/find User+Customer → issue tokens.
5. Lockout after repeated failures.

## Admin password flow

1. Email/password login with timing-safe password verify (Argon2id or bcrypt).
2. If MFA enabled, require TOTP before issuing full session.
3. Login attempt protection + lockout.
4. Password reset via email provider port.

## Google (optional customer)

- OAuth code flow; link to existing user by verified email/mobile policy.
- Do not create duplicate customers for same person without merge rules.

## Security controls

- Redis rate limiting on auth endpoints
- OTP expiration and retry limits
- Account lockout
- Secure headers / CORS allowlists
- No secrets in tokens beyond necessary claims
- Logout revokes refresh session

## Related

- [RBAC.md](./RBAC.md)
- [../security/SECURITY.md](../security/SECURITY.md)
- [../integrations/NOTIFICATIONS.md](../integrations/NOTIFICATIONS.md) (OTP SMS)
