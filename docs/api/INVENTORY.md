# Inventory API — Phase 5

## Formulas

`available = physicalQty - reservedQty` (per branch + variant)

## Admin endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/admin/branches` | `inventory.read` |
| POST | `/api/v1/admin/branches` | `branches.manage` |
| GET | `/api/v1/admin/inventory` | `inventory.read` |
| POST | `/api/v1/admin/inventory/adjust` | `inventory.adjust` |
| POST | `/api/v1/admin/inventory/transfers` | `inventory.transfer` |
| POST | `/api/v1/admin/inventory/transfers/:id/complete` | `inventory.transfer` |
| GET | `/api/v1/admin/inventory/lookup?sku=` or `barcode=` | `inventory.read` |
| GET | `/api/v1/admin/inventory/movements` | `inventory.read` |
| POST | `/api/v1/admin/inventory/reservations` | `inventory.update` |
| POST | `/api/v1/admin/inventory/reservations/:id/release` | `inventory.update` |
| POST | `/api/v1/admin/inventory/reservations/:id/commit` | `inventory.update` |
| POST | `/api/v1/admin/inventory/low-stock/run` | `inventory.read` |

All stock mutations run in DB transactions with optimistic `version` and write `InventoryMovement` rows.

## Public catalogue

Product list/detail include stock: `inStock`, `availableQty` (aggregated or per `branch` query). Filter `availability=in_stock`.
