# Admin CRM API — Phase 8

## Dashboard & reports

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/admin/dashboard` | `reports.read` |
| GET | `/api/v1/admin/reports/sales?from=&to=` | `reports.read` |

## Customers

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/admin/customers?q=&page=` | `customers.read` |
| GET | `/api/v1/admin/customers/:id` | `customers.read` |
| PATCH | `/api/v1/admin/customers/:id` | `customers.update` |

## Staff

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/api/v1/admin/employees` | `staff.manage` |
| PATCH | `/api/v1/admin/employees/:id` | `staff.manage` |
| POST | `/api/v1/admin/employees/:id/roles` | `roles.manage` |
| GET | `/api/v1/admin/roles` | `roles.manage` |

## Coupons

| Method | Path | Permission |
|--------|------|------------|
| CRUD | `/api/v1/admin/coupons` | `coupons.manage` |
| POST | `/api/v1/coupons/validate` | JWT customer — `{ code, subtotal }` |

Checkout `POST /orders` accepts optional `couponCode`, `loyaltyPointsToRedeem`.

## Loyalty

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/loyalty/me` | JWT customer |
| GET | `/api/v1/admin/loyalty/:customerId` | `loyalty.manage` |
| POST | `/api/v1/admin/loyalty/:customerId/adjust` | `loyalty.manage` — `{ delta, reason }` |

Earn on Delivered / pickup verify. Redeem at checkout (capped by `loyalty.maxRedeemPercent`).
