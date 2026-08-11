# t360 — Tharagai Digital Retail Platform

**Codename:** `t360`  
**Product:** LoopC — Tharagai Digital  
**Client:** Tharagai Readymades, Pudukkottai, Tamil Nadu, India  
**Development company:** LoopC

Omnichannel retail platform connecting physical store, website, mobile apps, admin/staff, inventory, orders, payments, WhatsApp, loyalty, CRM, and AI shopping.

## Current status

**Phases 0–16 complete.** Launch package ready. See [docs/roadmap/PHASE-GATE.md](docs/roadmap/PHASE-GATE.md).

Remaining work is **operator go-live** (real provider secrets + cutover) and **live POS** (vendor-blocked). Post-roadmap CMS and staging kit are complete.

### Run locally

```bash
pnpm install
pnpm docker:up          # requires Docker
pnpm prisma:migrate
pnpm prisma:seed
pnpm --filter @t360/api dev
pnpm --filter @t360/web dev      # :3000
pnpm --filter @t360/admin dev    # :3001
```

- API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/docs`

## Documentation index

| Area | Document |
|------|----------|
| Design system | [docs/design/DESIGN-SYSTEM.md](docs/design/DESIGN-SYSTEM.md) |
| Phase results (2–16) | [docs/design/PHASE-2-RESULT.md](docs/design/PHASE-2-RESULT.md) … [PHASE-16-RESULT.md](docs/design/PHASE-16-RESULT.md) |
| Catalogue API | [docs/api/CATALOGUE.md](docs/api/CATALOGUE.md) |
| Go-live | [docs/launch/GO-LIVE.md](docs/launch/GO-LIVE.md) |
| Foundation | [docs/architecture/FOUNDATION.md](docs/architecture/FOUNDATION.md) |
| Product requirements | [docs/product/REQUIREMENTS.md](docs/product/REQUIREMENTS.md) |
| Personas | [docs/product/PERSONAS.md](docs/product/PERSONAS.md) |
| User journeys | [docs/product/USER-JOURNEYS.md](docs/product/USER-JOURNEYS.md) |
| Business workflows | [docs/product/WORKFLOWS.md](docs/product/WORKFLOWS.md) |
| System architecture | [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) |
| Repository layout | [docs/architecture/REPOSITORY.md](docs/architecture/REPOSITORY.md) |
| Database | [docs/architecture/DATABASE.md](docs/architecture/DATABASE.md) |
| API | [docs/api/API.md](docs/api/API.md) |
| Authentication | [docs/architecture/AUTH.md](docs/architecture/AUTH.md) |
| RBAC | [docs/architecture/RBAC.md](docs/architecture/RBAC.md) |
| Deployment | [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) |
| Security | [docs/security/SECURITY.md](docs/security/SECURITY.md) |
| Integrations | [docs/integrations/](docs/integrations/) |
| Testing | [docs/testing/TESTING.md](docs/testing/TESTING.md) |
| Roadmap | [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md) |
| Phase gate | [docs/roadmap/PHASE-GATE.md](docs/roadmap/PHASE-GATE.md) |

## Stack

- **Web / Admin:** Next.js, TypeScript, Tailwind, `@t360/ui`
- **Mobile:** Flutter customer app
- **API:** NestJS modular monolith + BullMQ worker
- **Data:** PostgreSQL + Prisma, Redis + BullMQ
- **Hosting:** Vercel (web/admin) + Railway project `t360` (API/workers/Postgres/Redis)

## Development rule

Roadmap phases are complete. For ops changes, follow [PHASE-GATE.md](docs/roadmap/PHASE-GATE.md) and [GO-LIVE.md](docs/launch/GO-LIVE.md). Do not mark mocked production providers as live.
