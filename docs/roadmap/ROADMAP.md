# Development Roadmap — t360

## Phase gate rule

For every phase:

1. Explain what will be built  
2. Define acceptance criteria  
3. Show architecture/files affected  
4. Implement  
5. Run tests  
6. Run build  
7. Fix all errors  
8. Review security  
9. Review performance  
10. Document the result  
11. Only then continue  

Never silently skip errors. Never mark mocked production paths as complete.

## Milestones

| Milestone | Phases | Outcome |
|-----------|--------|---------|
| M0 | 0–1 | Discovery + architecture pack (**complete**) |
| M1 | 2–3 | Design system + foundation (**complete**) |
| M2 | 4–5 | Catalogue + inventory multi-branch (**complete**) |
| M3 | 6–7 | Customer web + checkout/payments (**complete**) |
| M4 | 8 | Admin CRM / loyalty / coupons / reports (**complete**) |
| M5 | 9 | Flutter customer app (**complete**) |
| M6 | 10–11 | Notifications + marketing automation (**complete**) |
| M7 | 12 | Tharagai AI (**complete**) |
| M8 | 13–14 | POS interface-first (mock) + Postgres search (**complete**); live POS + OpenSearch deferred |
| M9 | 15–16 | Production hardening, UAT, launch package (**complete**) |

Authoritative gate: [PHASE-GATE.md](./PHASE-GATE.md). Remaining: operator go-live (real providers) and live POS when vendor docs arrive.

## Phase summaries

| Phase | Name | Build |
|-------|------|-------|
| 0 | Discovery | Requirements, journeys, risks (**done**) |
| 1 | Architecture | System/DB/API/auth/RBAC/integrations/deploy (**done**) |
| 2 | Design system | Brand, typography, components, layouts (**done**) |
| 3 | Foundation | Monorepo, Nest, Prisma, Redis, BullMQ, auth, RBAC (**done**) |
| 4 | Product system | Categories, brands, products, variants, search, admin, CSV (**done**) |
| 5 | Inventory | Branches, stock, movements, transfers, reservations, barcode (**done**) |
| 6 | Customer website | Home, categories, search, PDP, account, wishlist (**done**) |
| 7 | E-commerce | Cart, checkout, Razorpay, orders, delivery, pickup, returns (**done**) |
| 8 | Admin / CRM | Dashboard, orders, customers, staff, reports, loyalty, coupons (**done**) |
| 9 | Flutter app | Auth through profile/AI feature set (**done**) |
| 10 | Communication | FCM, email, SMS port, WhatsApp, notification engine (**done**) |
| 11 | Marketing | Campaigns, segments, abandoned cart, social drafts, analytics (**done**) |
| 12 | AI | Tool-gated customer + admin assistants (**done**) |
| 13 | POS | Interface-first mock (**done**); live vendor adapter deferred |
| 14 | Advanced search | Postgres full-text / `pg_trgm` (**done**); OpenSearch deferred |
| 15 | Production | Docker, CI/CD, staging/prod, monitoring, backups, SSL, CDN (**done**) |
| 16 | Launch | UAT, training, migration, smoke tests, store listing, rollback plan (**done**) |

## Module complexity (T-shirt)

| Module | Size |
|--------|------|
| Auth + OTP + sessions | L |
| RBAC | M |
| Catalogue + search/filters | L |
| Inventory + reservations | XL |
| Cart/checkout/orders | XL |
| Payments/refunds | L |
| Delivery + pickup | M |
| Admin dashboard/reports | L |
| Loyalty + coupons + offers | L |
| Notifications + WhatsApp | L |
| Flutter app | XL |
| AI tools | M |
| POS adapters | M–L (unknown) |
| CMS homepage | S–M |
| Import/migration | M |
| CI/CD + observability | M |

## External services required

Razorpay, Cloudinary, Resend, India SMS/OTP provider, WhatsApp Business Platform, Firebase (FCM), OpenAI, Sentry, GA4 (± PostHog), Google OAuth (optional), Vercel, Railway (`t360`), GitHub, domains/SSL, Apple/Google developer accounts (later).

## Risks and dependencies

| Risk | Mitigation |
|------|------------|
| Unknown POS | Interface-first mock shipped (Phase 13); live adapter blocked on vendor docs |
| WA template delays | Staging webhooks + early template submission |
| Oversell | Transactions, reservations, race tests |
| Duplicate webhooks | Idempotency + WebhookEvent uniqueness |
| Scope explosion | Strict phase gates |
| Legal (DPDP, policies) | Lawyer review before launch claims |
| Media cost | Cloudinary transforms; S3 port ready |
| SMS provider choice | Port + one India provider in Phase 3/10 |
| Tamil quality | Professional copy review |
| Festival traffic | Indexes, cache, load tests before peak |

### Open client dependencies

POS vendor docs; legal entity details; production Razorpay/WA/Cloudinary accounts; branch list & hours; tax configuration; logo/brand assets (Phase 2).

## Acceptance criteria — Phase 0 + 1

- [x] Requirements, personas, journeys, workflows documented  
- [x] NFR + security/privacy stance documented  
- [x] Modular monolith + monorepo layout documented  
- [x] ERD + entity list + inventory/payment/idempotency rules documented  
- [x] API module map + error contract documented  
- [x] Auth + RBAC model documented  
- [x] Integration ports documented  
- [x] Railway `t360` + Vercel topology documented  
- [x] Roadmap/milestones/risks documented  
- [x] Explicit go/no-go for Phase 2 — superseded; phases 0–16 complete per [PHASE-GATE.md](./PHASE-GATE.md)
