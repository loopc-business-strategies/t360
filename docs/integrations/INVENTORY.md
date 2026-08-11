# Inventory Architecture — t360

## Why it matters

Inventory is a core system. Incorrect stock destroys trust for pickup, delivery, and POS-ready operations.

## Model

- **Branch**-scoped stock for each **ProductVariant**
- Optional **Warehouse** linkage
- **Inventory:** `physicalQty`, `reservedQty`, `version`
- **Available** = `physicalQty - reservedQty`
- **InventoryMovement:** append-only audit (type, qty delta, actor, reason, refs)
- **StockReservation:** holds for checkout/order with expiry
- **StockTransfer / StockAdjustment:** first-class flows

## Critical operations (always transactional)

1. Reserve
2. Commit (sale)
3. Release
4. Adjust
5. Transfer (source decrement + dest increment + movements)

## Concurrency

- Prefer row-level locking / `UPDATE ... WHERE version = $v` style optimistic checks inside transactions
- Unique `(branchId, variantId)` on Inventory

## Barcode / SKU

- Unique SKU and barcode indexes for fast staff lookup
- Flutter camera scanning in staff flows (Phase 9+)
- Future hardware scanners use same lookup API

## Low stock

- Threshold per variant/branch or global default in settings
- BullMQ job evaluates and notifies Inventory Manager roles

## Oversell prevention

- Checkout cannot reserve more than available
- Webhook confirm path re-validates before commit
- Automated tests for race scenarios (parallel reserves)

## Related workflows

See [../product/WORKFLOWS.md](../product/WORKFLOWS.md) and [POS-INTEGRATION.md](./POS-INTEGRATION.md).
