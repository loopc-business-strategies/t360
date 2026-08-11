# POS API — Phase 13 (interface-first)

**Mock only.** Default `POS_PROVIDER=mock`. This phase ships ports, Integration storage, inventory sync/CSV bridges, and webhook idempotency. It does **not** mean a live POS is connected or “synced.”

When vendor docs arrive, add `docs/integrations/POS-<vendor>.md` and implement a real adapter behind the same ports.

## Env

| Variable | Values | Default |
|----------|--------|---------|
| `POS_PROVIDER` | `mock` | `mock` |

## Permission

`integrations.manage` for admin routes.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/integrations/pos` | Integration row + healthcheck |
| PATCH | `/api/v1/admin/integrations/pos` | `{ status?, config? }` |
| POST | `/api/v1/admin/integrations/pos/sync/inventory` | Mock pull + apply |
| POST | `/api/v1/admin/integrations/pos/import/inventory-csv` | `{ csv }` body |
| POST | `/api/v1/pos/webhook` | Public; idempotent `WebhookEvent` |

## Inventory CSV columns

`sku,barcode,branchCode,physicalQty` and/or `qtyDelta` (at least one of sku/barcode; physicalQty sets absolute via delta from current, or qtyDelta adjusts).

## Webhook payload (mock)

```json
{
  "eventId": "unique-id",
  "type": "inventory.adjust",
  "sku": "SKU-1",
  "barcode": null,
  "branchCode": "MAIN",
  "qtyDelta": -1
}
```
