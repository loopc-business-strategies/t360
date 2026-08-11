# Commerce API — Phase 7

## Cart (`/api/v1/cart`)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/cart` | Customer cart with line totals |
| POST | `/cart/items` | `{ variantId, qty, branchId? }` |
| PATCH | `/cart/items/:id` | `{ qty }` |
| DELETE | `/cart/items/:id` | Remove line |

Stock validated against available qty. JWT customer required.

## Orders (`/api/v1/orders`)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/orders` | Header `Idempotency-Key`; body fulfillment + paymentMethod |
| GET | `/orders` | Customer list |
| GET | `/orders/:id` | Detail + events + payment |
| POST | `/orders/:id/cancel` | Release reservations if eligible |
| POST | `/orders/:id/return` | ReturnRequested → restock + refund |

Admin:

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/orders` | `orders.read` |
| PATCH | `/admin/orders/:id/status` | `orders.update` |
| POST | `/admin/orders/:id/pickup/verify` | `orders.update` — body `{ pickupCode }` |

## Payments

| Method | Path | Notes |
|--------|------|--------|
| POST | `/payments/razorpay/webhook` | Public; signature verified; idempotent |
| POST | `/payments/:orderId/mock-complete` | Dev only when `PAYMENT_PROVIDER=mock` |

`PAYMENT_PROVIDER=mock|razorpay`. Never trust client-only payment success.

## Checkout flow

1. Add to cart → checkout with address or pickup branch  
2. Server creates order `PaymentPending`, reserves stock, creates payment intent  
3. Razorpay SDK / mock-complete / COD  
4. Webhook or COD path commits reservations → `Confirmed`

## Settings

`GET /settings/storefront` / commerce keys: `commerce.codEnabled`, `commerce.shippingFee`, `commerce.freeShippingAbove`.
