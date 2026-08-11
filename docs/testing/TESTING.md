# Testing Architecture — t360

## Mandate

Testing is mandatory. Features are not “done” if only mocked in production paths.

## Backend (NestJS)

| Type | Scope |
|------|--------|
| Unit | Domain services, pure pricing/coupon math, RBAC helpers |
| Integration | Prisma + Postgres; Redis; webhook handlers |
| API / E2E | Critical HTTP flows against test app |
| DB | Migration apply; constraint tests |
| Payments | Signature verify; idempotent webhook |
| Inventory | Reserve/commit/release races |
| AuthZ | Permission matrix samples |

Prefer Testcontainers or docker-compose Postgres/Redis in CI.

## Frontend (web / admin)

- Component tests for shared UI
- Playwright E2E: browse → cart → checkout smoke; admin login → product list smoke

## Flutter

- Unit / widget tests for view models and widgets
- Integration tests for auth, catalogue, checkout happy paths

## Critical E2E flows (launch suite)

Customer registration, OTP login, search, filters, PDP, wishlist, cart, coupon, checkout, payment, order creation/status, cancel, return, refund, store pickup, delivery, admin product create, inventory update, stock reservation, staff pickup verify, loyalty, AI search, WhatsApp webhook, POS sync (when adapter exists).

Manual UAT matrix: [docs/launch/UAT.md](../launch/UAT.md).

## Playwright smoke

```bash
pnpm test:e2e:smoke
```

Requires `PLAYWRIGHT_BASE_URL` (customer web) and optionally `PLAYWRIGHT_ADMIN_URL`. Specs skip when unset so default CI stays green. Optional CI job runs only when those secrets/vars are configured.

## CI gate

PR cannot merge without lint, typecheck, unit, and required integration suites green.  
Staging deploy follows green main. Production requires manual approval.

## Performance

Before production declaration: load tests on critical APIs (catalogue search, checkout reserve, webhooks).

## Definition of done (per phase)

1. Acceptance criteria listed  
2. Implemented  
3. Tests added/passing  
4. Build passing  
5. Security/perf sanity for the phase  
6. Docs updated  
7. No silent skipped failures  
