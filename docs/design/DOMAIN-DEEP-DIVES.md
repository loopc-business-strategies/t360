# Domain Deep-Dives — t360

Companion to the full project analysis canvas. Covers five domains: Auth & RBAC, Commerce, Inventory, Admin/CMS, and Mobile.

---

## 1. Auth & RBAC

**Summary:** Two entry paths — customer OTP (mobile) and staff email/password (+ MFA). Access JWTs carry permission codes; refresh tokens are opaque UUIDs hashed on `Session` with family rotation.

### Routes

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/auth/otp/request` | SMS OTP into Redis |
| POST | `/api/v1/auth/otp/verify` | Issues tokens |
| POST | `/api/v1/auth/login` | Admin email/password (+ MFA) |
| POST | `/api/v1/auth/refresh` | Rotation + reuse detection |
| POST | `/api/v1/auth/logout` | Revoke session |
| POST | `/api/v1/auth/mfa/setup\|enable` | Requires `settings.manage` |

### Flow

1. **Authenticate** — OTP via Redis-backed SMS provider, or admin password (argon2) with optional TOTP MFA.
2. **Issue tokens** — JWT access (`sub` + `permissions[]`, ~15m) + refresh UUID stored hashed on `Session.familyId`.
3. **Authorize** — Global `JwtAuthGuard` (skips `@Public`). `PermissionsGuard` requires **all** codes on `@RequirePermissions`.
4. **RBAC source** — `User → UserRole → Role → RolePermission → Permission.code`. Seeded roles: SuperAdmin, Manager, InventoryManager, SalesStaff, MarketingStaff, CustomerSupport, DeliveryStaff, Accountant, SystemAdministrator.

### Key files

- `apps/api/src/auth/` — controllers, service, JWT strategy, guards
- `apps/api/src/rbac/` — roles list + `PermissionsGuard`
- `docs/architecture/AUTH.md`, `docs/architecture/RBAC.md`

### Notes

- Change seeded SuperAdmin password before real launch.
- Refresh reuse detection revokes the session family.

---

## 2. Commerce

**Summary:** Cart → coupon validate → checkout creates `Order` + stock reservations → payment (Razorpay or mock) → shipment/pickup. Unpaid reservations expire via BullMQ.

### Routes

- `/cart`, `/wishlist`
- `/orders` (customer) + `/admin/orders`
- `/coupons/validate`, `/loyalty/me`
- `/payments/razorpay/webhook` (+ mock complete)

### Flow

1. **Browse & cart** — Public catalogue/search; authenticated cart/wishlist with variant lines.
2. **Checkout** — Creates `Order` + `OrderItems`; reserves inventory; applies coupon/loyalty rules.
3. **Pay** — `PAYMENT_PROVIDER=razorpay|mock`; webhook idempotent via `WebhookEvent` / `IdempotencyKey`.
4. **Fulfill** — Shipment updates or store pickup codes; notifications queued on `t360-notifications`.

### Key files

- `apps/api/src/cart|orders|payments|coupons|loyalty/`
- `apps/api/src/orders/reservation-expiry.service.ts` — 5m expiry worker
- `docs/api/COMMERCE.md`, `docs/integrations/PAYMENTS.md`

### Notes

- Production refuses mock payment unless `ALLOW_MOCK_PROVIDERS=1`.
- COD is configurable via settings / commerce utils.

---

## 3. Inventory

**Summary:** Multi-branch stock with warehouses, movements, reservations tied to checkout, and inter-branch transfers. Low-stock scans run on a BullMQ queue.

### Routes

- `GET /branches` (public)
- `/admin/branches`, `/admin/inventory/*`
- Adjust / transfer / reservation endpoints

### Flow

1. **Locations** — `Branch` + `Warehouse` (seed PDK01 / CHN01 when `SEED_INVENTORY=true`).
2. **On-hand** — `Inventory` rows per variant×warehouse; movements audit adjustments.
3. **Reserve** — Checkout creates `StockReservation`; expiry worker releases unpaid holds.
4. **Transfer** — `StockTransfer` + lines move qty between branches with status workflow.

### Key files

- `apps/api/src/inventory/`
- `database/prisma/seed-inventory.ts`
- `docs/integrations/INVENTORY.md`

### Notes

- Queue: `low-stock-check` (scan job).
- POS `inventory_pull` is hourly mock until vendor adapter exists.

---

## 4. Admin console & storefront CMS

**Summary:** Next.js admin on `:3001` covers catalogue ops through marketing. Storefront homepage hero/content is driven by `SystemSetting` keys (`cms.manage`) edited under `/storefront` — not a separate Nest CMS module.

### Surfaces

- Admin UI: `/storefront`, `/products`, `/orders`, `/inventory`, …
- API: `/settings`, `/settings/storefront` (public)
- Permission: `cms.manage` (+ domain permissions)

### Flow

1. **Staff login** — Admin app → `POST /auth/login` → JWT with permission codes.
2. **Operate catalogue** — CRUD via `/admin/*` with `products.*` permissions.
3. **Edit homepage** — Storefront editor writes bilingual hero JSON into system settings.
4. **Web reads CMS** — Customer web fetches `/settings/storefront` for first-viewport content.

### Key files

- `apps/admin/src/app/storefront/page.tsx`
- `apps/admin/src/app/*` (28 route pages)
- `apps/api/src/settings/`
- `docs/api/CMS.md`, `docs/design/POST-ROADMAP-CMS-RESULT.md`

### Notes

- Post-roadmap #1 CMS homepage editor is **Complete**.
- Marketing/social pages cover campaign content adjacent to CMS.

---

## 5. Mobile (Flutter)

**Summary:** Feature-first Flutter app (Riverpod + go_router + Dio) mirroring web commerce: catalog, cart, checkout (Razorpay SDK), orders, wishlist, OTP auth, account, AI chat. Outside pnpm/turbo CI.

### Layout

- `lib/features/{auth,catalog,cart,checkout,orders,wishlist,account,ai}/`
- `lib/core/api_client.dart` + `token_storage.dart`
- `lib/app/router.dart` shell navigation

### Flow

1. **Boot** — `main.dart` → `ProviderScope` → router; tokens from secure storage.
2. **API** — Dio client attaches Bearer; hits same `/api/v1` base as web.
3. **Shop** — Home/categories/product detail → cart → checkout with Razorpay plugin.
4. **Account** — Orders, wishlist, notification prefs, AI chat screen.

### Key files

- `apps/mobile/pubspec.yaml` (`tharagai_mobile`)
- `apps/mobile/lib/app/router.dart`
- `apps/mobile/lib/core/api_client.dart`
- `apps/mobile/lib/design_system/`

### Notes

- Not built by GitHub Actions turbo pipeline.
- Store listing / App Store submit still operator-side ([GO-LIVE.md](../launch/GO-LIVE.md)).

---

## Related

- Interactive canvas: open beside chat in Cursor (`t360-project-analysis.canvas.tsx`)
- Gate status: [PHASE-GATE.md](../roadmap/PHASE-GATE.md)
- Full analysis plan content also summarized in the canvas
