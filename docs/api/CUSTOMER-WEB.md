# Customer Website API — Phase 6

## Auth (customer OTP)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/auth/otp/request` | Body `{ mobile: "+91…" }` — public |
| POST | `/api/v1/auth/otp/verify` | Body `{ mobile, code }` → access + refresh JWT |
| POST | `/api/v1/auth/refresh` | Rotate refresh |
| POST | `/api/v1/auth/logout` | Revoke session |

Customer tokens carry RBAC permissions from roles (often empty); self routes do not require admin permissions.

## Profile & addresses

| Method | Path | Auth |
|--------|------|------|
| GET/PATCH | `/api/v1/customers/me` | JWT |
| GET/POST | `/api/v1/customers/me/addresses` | JWT |
| PATCH/DELETE | `/api/v1/customers/me/addresses/:id` | JWT |

## Wishlist

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/wishlist` | JWT |
| POST | `/api/v1/wishlist` | JWT — `{ variantId }` |
| DELETE | `/api/v1/wishlist/:variantId` | JWT |

## Public storefront helpers

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/branches` | Active branches (code, name, address, phone, hours) |
| GET | `/api/v1/settings/storefront` | Hero image + EN/TA copy subset |

Admin homepage CMS (PUT hero): see [CMS.md](./CMS.md).

Catalogue: `GET /products` supports `category`, `brand`, `size`, `colour`, `minPrice`, `maxPrice`, `availability`, `branch`, `sort`, `q`. See [CATALOGUE.md](./CATALOGUE.md) / [INVENTORY.md](./INVENTORY.md).

## WhatsApp enquiry (client-side)

No Cloud API in Phase 6. Storefront builds:

`https://wa.me/{E164}?text=` URL-encoded message with product name, SKU, price, storefront URL.

Env: `NEXT_PUBLIC_WHATSAPP_E164` (digits only, country code included).
