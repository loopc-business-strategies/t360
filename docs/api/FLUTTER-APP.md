# Flutter Customer App — Phase 9

Customer mobile app lives in `apps/mobile` (`tharagai_mobile`). It consumes the same Nest `/api/v1` customer APIs as the web storefront.

## Stack

Riverpod, GoRouter, Dio, `flutter_secure_storage`, EN/TA l10n maps. Design system: existing `Tharagai*` widgets under `lib/design_system`.

## Config

| Define | Purpose | Example |
|--------|---------|---------|
| `API_BASE_URL` | REST base including `/api/v1` | Android emulator: `http://10.0.2.2:4000/api/v1` |
| (default) | Desktop / iOS sim | `http://localhost:4000/api/v1` |

```bash
cd apps/mobile
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

Design gallery (Phase 2/3 widgets): route `/gallery`.

## Feature → endpoints

| Feature | Endpoints | Detail docs |
|---------|-----------|-------------|
| Auth OTP | `POST /auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout` | [CUSTOMER-WEB.md](./CUSTOMER-WEB.md), [AUTH.md](../architecture/AUTH.md) |
| Profile / addresses | `GET/PATCH /customers/me`, addresses CRUD | [CUSTOMER-WEB.md](./CUSTOMER-WEB.md) |
| Catalogue | `GET /categories`, `/brands`, `/products`, `/products/:slugOrId`, `/branches` | [CATALOGUE.md](./CATALOGUE.md) |
| Wishlist | `GET/POST/DELETE /wishlist` | [CUSTOMER-WEB.md](./CUSTOMER-WEB.md) |
| Cart | `GET /cart`, items CRUD | [COMMERCE.md](./COMMERCE.md) |
| Checkout / orders | `POST /orders` (+ coupon/loyalty), list/detail/cancel/return | [COMMERCE.md](./COMMERCE.md) |
| Coupons / loyalty | `POST /coupons/validate`, `GET /loyalty/me` | [ADMIN-CRM.md](./ADMIN-CRM.md) |
| Storefront settings | `GET /settings/storefront` | [CUSTOMER-WEB.md](./CUSTOMER-WEB.md) |
| Mock payment | `POST /payments/:orderId/mock-complete` when provider is `mock` | [COMMERCE.md](./COMMERCE.md) |

Tokens: access + refresh in secure storage; Dio attaches `Authorization: Bearer`; 401 triggers one refresh retry.

## Out of scope (Phase 10+)

FCM/push, WhatsApp Cloud, campaigns, AI, POS/staff scanner, store listings.
