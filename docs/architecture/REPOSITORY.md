# Repository Architecture — t360

## Tooling

- **pnpm** workspaces
- **Turborepo** for JS/TS pipeline (lint, typecheck, test, build)
- **Flutter** under `apps/mobile` (Dart; outside TS turbo graph, still same git repo)

## Target structure

```
t360/
  apps/
    web/                 # Customer Next.js
    admin/               # Admin / staff Next.js
    api/                 # NestJS API + worker entrypoints
    mobile/              # Flutter (Android / iOS)
  packages/
    ui/                  # Shared web UI (shadcn-based)
    types/               # Shared TypeScript types
    validation/          # Shared Zod schemas
    config/              # Shared config helpers
    eslint-config/
    tsconfig/
  database/
    prisma/
      schema.prisma
      migrations/
      seeds/
  docs/
    architecture/
    api/
    deployment/
    security/
    integrations/
    product/
    testing/
    roadmap/
  scripts/
  .github/
    workflows/
  docker-compose.yml
  README.md
```

## Package responsibilities

| Package / app | Responsibility |
|---------------|----------------|
| `apps/web` | Storefront, SEO, customer account |
| `apps/admin` | Dashboard, ops, staff mode UI |
| `apps/api` | REST `/api/v1`, webhooks, workers |
| `apps/mobile` | Customer (+ later staff) Flutter app |
| `packages/ui` | Buttons, forms, ProductCard, etc. |
| `packages/types` | DTO-aligned shared types |
| `packages/validation` | Zod for forms + API contract alignment |
| `database/prisma` | Single source of schema truth |

## Environment files

- Provide `.env.example` per app when scaffolding (Phase 3).
- Never commit secrets (JWT, DB, Razorpay, OpenAI, WhatsApp, Firebase private keys).

## Naming

- Git remotes, Railway project, and local folder: **`t360`**.
- Product branding in UI: **Tharagai Readymades** / **Tharagai Digital** / **Tharagai AI** / **Tharagai Rewards**.
- Company: **LoopC**.
