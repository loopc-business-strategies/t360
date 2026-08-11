# Foundation — Phase 3

## Goals

Stand up the modular NestJS monolith with PostgreSQL (Prisma), Redis, BullMQ, authentication, RBAC, observability basics, and local docker-compose — plus premium UI motion on existing Tharagai design tokens.

## Local boot

```bash
# Infra
docker compose up -d

# Env
cp apps/api/.env.example apps/api/.env

# DB
pnpm prisma:migrate
pnpm prisma:seed

# API + worker
pnpm --filter @t360/api dev
pnpm --filter @t360/api worker
```

- API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/docs`
- Web: `pnpm --filter @t360/web dev` → `:3000`
- Admin: `pnpm --filter @t360/admin dev` → `:3001`

## Acceptance criteria

- [x] docker-compose: Postgres + Redis (compose file shipped; run when Docker available)
- [x] migrate + seed scripts: roles, permissions, SuperAdmin
- [x] OTP + admin login + refresh rotation implemented
- [x] RBAC guard blocks unauthorized access (unit tested)
- [x] Swagger + `/health` `/ready` `/live`
- [x] BullMQ worker entry + demo job enqueue API
- [x] Web/admin premium motion; Flutter analyze clean
- [x] typecheck + build pass
- [x] Phase 4 gated NO-GO
- [x] No fake payment/inventory/catalogue paths

> Live migrate/seed/e2e require Docker locally — see Phase 3 result note.

## Seed defaults

Documented in `database/prisma/seeds` and `apps/api/.env.example`:

- SuperAdmin email: `owner@tharagai.local`
- Password: set via `SEED_ADMIN_PASSWORD` (default in example for local only)
