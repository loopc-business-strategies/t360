# Product Requirements — Tharagai Digital (t360)

## 1. Vision

Transform Tharagai Readymades (Pudukkottai) from a traditional showroom into a connected omnichannel digital retail business: physical store + website + mobile + admin + staff + inventory + POS-ready integrations + orders + payments + delivery/pickup + CRM + loyalty + WhatsApp + social commerce + AI + analytics.

## 2. Product principles

1. **Modular monolith first** — NestJS internally modular; extract services later only if scale requires it.
2. **No fake functionality** — unpaid “success”, fake stock, or mocked AI in production are forbidden.
3. **No hardcoded business data** — products, prices, stock, offers, branches, tax, loyalty rules come from DB/config.
4. **Backend enforces authorization** — UI hiding is not security.
5. **Provider abstractions** — payments, media, email, SMS, AI, POS are ports with swappable adapters.
6. **Phase gates** — each phase: criteria → implement → test → build → review → document → next.

## 3. In scope (platform capability)

| Domain | Capability |
|--------|------------|
| Catalogue | Categories, brands, products, variants, attributes, images, search, filters |
| Inventory | Multi-branch stock, movements, transfers, reservations, low-stock, barcode |
| Commerce | Cart, wishlist, checkout, Razorpay, COD (configurable), invoices |
| Fulfillment | Delivery zones/fees, store pickup + pickup codes |
| Customers | OTP auth, profiles, addresses, orders, loyalty, coupons |
| CRM | Spend metrics, segments (configurable rules) |
| Marketing | Coupons, offers/campaigns, abandoned cart, social content drafts |
| Comms | Push (FCM), email, SMS/OTP, WhatsApp Business API |
| AI | Tool-gated shopping assistant + optional admin analytics assistant |
| Admin | Dashboard, catalogue, inventory, orders, staff/RBAC, reports, settings |
| Staff | Barcode lookup, packing, pickup verify, limited order updates |
| Ops | Audit logs, health checks, idempotency, observability (Sentry) |
| i18n | English + Tamil |
| SEO | Metadata, schema.org, sitemap, canonical URLs |

## 4. Explicit out of scope (MVP / early phases)

| Item | Notes |
|------|--------|
| Live POS sync | Architect adapters; implement in Phase 13 after vendor docs |
| OpenSearch / Elasticsearch | Phase 14 only if Postgres search is insufficient |
| Full multi-tenant SaaS | Reserve `tenantId`; do not build runtime tenancy |
| Complex staff offline sync | Defer until online core is stable |
| Automated social publishing | Content drafting only until official API permissions exist |
| Kubernetes | Not used unless demonstrated need |

## 5. Functional requirements

### 5.1 Authentication & users

- Customer: mobile OTP primary; optional email/password and Google.
- Admin/staff: email/password; MFA/2FA for privileged roles.
- JWT access + rotating refresh tokens; session/device management.
- Rate limiting, OTP expiry/retry limits, account lockout.

### 5.2 RBAC

- Roles and permissions (`resource.action`).
- Multiple roles per user; backend guards on every protected route.

### 5.3 Catalogue & search

- Hierarchy: Category → Subcategory → Brand → Product → Variant.
- Configurable attributes (size, colour, material, occasion, etc.).
- Postgres full-text + trigram search; typo/partial matching.
- Filters: category, brand, price, size, colour, availability, rating, discount, new.
- Sort: relevance, newest, price, popularity.

### 5.4 Cart, checkout, orders

- Multi-item cart with variant/qty/stock validation, coupons, tax, delivery/pickup.
- Safe stock reservation; prevent overselling.
- Order statuses including pickup, delivery, returns, refunds; order timeline; invoices.
- Idempotent order creation and payment handling.

### 5.5 Inventory & branches

- Branches and warehouses; inventory per variant per branch.
- Movements, transfers, adjustments, reservations, releases, low-stock alerts.
- Available stock = physical − reserved.

### 5.6 Loyalty, coupons, offers, reviews

- Configurable Tharagai Rewards (points, tiers, expiry, referrals).
- Flexible coupons and campaign engine (not hardcoded festival logic).
- Verified-purchase reviews with moderation.

### 5.7 Channels

- Customer web (Next.js), Flutter (Android/iOS), admin/staff web.
- WhatsApp Business Platform (official only).
- AI assistant with controlled tools only.

### 5.8 Support & CMS

- FAQ, contact, tickets; homepage/content manageable via admin.

## 6. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | Strong Core Web Vitals; paginated APIs; indexed queries; image optimization |
| Scale (initial) | Thousands of products, customers, orders; multi-branch; concurrent users |
| Security | OWASP practices; secrets in env stores; webhook signature verification |
| Reliability | Idempotency; job retries + dead-letter; transactional stock/payment |
| Availability | Health, liveness, readiness endpoints |
| i18n | EN + TA via i18n resources |
| Privacy | Policy pages; account deletion workflow; legal review for DPDP/IT Act (do not invent law) |
| Observability | Structured logs, request/correlation IDs, Sentry |
| Maintainability | Modular NestJS; feature folders; shared packages; documentation |

## 7. Assumptions

1. Initial deployment is single-brand Tharagai (not multi-tenant SaaS).
2. Primary market is India (INR, UPI via Razorpay, India SMS/OTP).
3. At least one physical branch in Pudukkottai at launch; schema supports more.
4. Client will supply brand assets, tax rules, branch hours, and legal entity details before launch.
5. POS vendor and API docs are unknown until provided.
6. WhatsApp Business account and template approvals are client/ops dependencies.
7. App Store / Play Store listings are Phase 16 concerns.

## 8. Unknowns

- Existing POS vendor, export format, and auth model.
- Exact tax/GST configuration and invoice legal requirements (needs accountant/legal input).
- Preferred India SMS/OTP provider.
- Number of initial branches and warehouses.
- Whether COD is enabled at launch.
- Domain names and email sending domain for Resend.
- Volume expectations for peak festival seasons (for capacity planning).

## 9. External dependencies

See [../roadmap/ROADMAP.md](../roadmap/ROADMAP.md) § External services and [../deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md).

## 10. Success criteria (platform)

The finished platform (through Phase 16) must be production-grade: fast, secure, scalable, tested, documented, SEO-friendly, mobile-first, API-driven, cloud-ready, AI-ready, POS-ready, multi-branch-ready, and future SaaS-ready — without fake completed features.
