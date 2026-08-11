# Security Architecture — t360

## Goals

Protect customers, staff, payments, and inventory integrity for a production retail platform. Follow OWASP ASVS-inspired practices appropriate to the stack.

## Controls

| Area | Control |
|------|---------|
| Input validation | DTO/Zod validation on all external inputs |
| AuthN | JWT + refresh rotation; OTP limits; MFA for privileged admin |
| AuthZ | RBAC on API; object/branch scoping |
| Rate limiting | Redis-backed limits on auth, OTP, AI, public APIs |
| Headers | Helmet / secure headers |
| CORS | Explicit origin allowlists |
| SQL injection | Prisma parameterized access; avoid unsafe raw SQL |
| XSS | Framework escaping; sanitize rich text if ever allowed |
| CSRF | Strategy for cookie-based sessions (SameSite + CSRF token where needed) |
| Uploads | MIME/size checks; virus scanning optional later; store via media port |
| Payments | Server-side verify; webhook signatures; no raw card storage |
| Webhooks | Signature + timestamp + idempotent event store |
| Secrets | Env vars only; never commit; rotate on leak |
| Encryption | TLS in transit; hash passwords; encrypt sensitive tokens at rest if stored |
| Audit | AuditLog for sensitive admin/stock/payment actions |
| Errors | Stable error codes; no stacks to clients |
| PII | Public APIs must not leak other users’ data |

## Admin hardening

- MFA for Owner, System Admin, Accountant (recommended mandatory before production)
- Session revocation
- Least-privilege roles
- Separate staging and production admins where practical

## Privacy & legal (non-invented)

Ship:

- Privacy Policy, Terms, Shipping, Returns, Refunds pages
- Consent where required for marketing channels
- Account deletion / data access workflow hooks

**Requires professional legal review** for Indian DPDP Act / IT Act applicability, WhatsApp consent, and retail invoice obligations. Engineering documents areas needing review; does not invent legal requirements.

## Pre-launch security review checklist

- [ ] Authentication & OTP abuse cases
- [ ] Authorization matrix spot-checks
- [ ] Payment & webhook security
- [ ] File upload paths
- [ ] API surface / admin exposure
- [ ] Secrets inventory
- [ ] Database access controls
- [ ] Rate limiting effectiveness
- [ ] Customer PII exposure tests

## Related

- [../architecture/AUTH.md](../architecture/AUTH.md)
- [../architecture/RBAC.md](../architecture/RBAC.md)
- [../integrations/PAYMENTS.md](../integrations/PAYMENTS.md)
