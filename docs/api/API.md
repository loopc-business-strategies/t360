# API Architecture — t360

## Style

- REST under `/api/v1`
- OpenAPI / Swagger generated from NestJS
- Version prefix for breaking changes (`v2` later)
- Pagination, filtering, sorting on list endpoints
- Validation on all inputs (class-validator and/or Zod shared package)

## Error envelope

Success and failure responses are consistent. Errors never include stack traces in production.

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": {}
  },
  "requestId": "req_01HXYZ..."
}
```

Success example:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 100 },
  "requestId": "req_01HXYZ..."
}
```

## Modules → route groups

| Module | Base path |
|--------|-----------|
| auth | `/api/v1/auth` |
| users | `/api/v1/users` |
| customers | `/api/v1/customers` |
| employees | `/api/v1/employees` |
| roles / permissions | `/api/v1/roles`, `/api/v1/permissions` |
| branches | `/api/v1/branches` |
| products | `/api/v1/products` |
| categories | `/api/v1/categories` |
| brands | `/api/v1/brands` |
| inventory | `/api/v1/inventory` |
| cart | `/api/v1/cart` |
| wishlist | `/api/v1/wishlist` |
| orders | `/api/v1/orders` |
| payments | `/api/v1/payments` |
| refunds | `/api/v1/refunds` |
| shipments | `/api/v1/shipments` |
| coupons | `/api/v1/coupons` |
| offers | `/api/v1/offers` |
| loyalty | `/api/v1/loyalty` |
| reviews | `/api/v1/reviews` |
| notifications | `/api/v1/notifications` |
| whatsapp | `/api/v1/whatsapp` (incl. webhooks) |
| social | `/api/v1/social` |
| ai | `/api/v1/ai` |
| analytics | `/api/v1/analytics` |
| reports | `/api/v1/reports` |
| integrations | `/api/v1/integrations` |
| settings | `/api/v1/settings` |
| audit | `/api/v1/audit` |
| support | `/api/v1/support` |
| cms | `/api/v1/cms` |
| health | `/api/v1/health`, `/ready`, `/live` |

## Idempotency

Clients send `Idempotency-Key` header for:

- Order creation
- Payment intents
- Refunds
- Critical stock operations (where client-initiated)
- Notification sends that must not duplicate

Server stores key + request hash + response for TTL window.

## Webhooks (inbound)

- Razorpay, WhatsApp, future POS
- Signature verification mandatory
- Persist `WebhookEvent` with provider event id for dedupe
- Process asynchronously via BullMQ when heavy

## Public vs authenticated

- Public: catalogue browse/search, CMS homepage, health
- Authenticated customer: cart, checkout, orders, wishlist, loyalty
- Staff/admin: management APIs with RBAC
- Never expose other customers’ PII on public routes
