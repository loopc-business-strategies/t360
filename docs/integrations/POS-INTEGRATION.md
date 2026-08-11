# POS Integration Architecture — t360

## Status

**Phase 13 interface-first (mock) complete.** Ports, `Integration` storage, Mock adapter, inventory CSV bridge, and webhook idempotency ship in the API. A **live** vendor adapter remains blocked until the client provides:

- POS vendor name
- API documentation
- Data export format
- Authentication mechanism
- Webhook details (if any)

Do not assume the client’s existing POS. Do not claim “POS synced” without a real adapter.

**Blocked inputs (required before coding a live adapter):** vendor name, API docs, export format, auth mechanism, webhooks. Until then, keep `POS_PROVIDER=mock`.

## Direction of truth (target)

```
POS → Integration Adapter → Tharagai Backend → Inventory / Orders / Customers
```

Bidirectional sync may be required depending on vendor; adapters isolate that complexity.

## Ports

```ts
interface PosProvider {
  healthcheck(): Promise<boolean>
}

interface InventorySyncProvider {
  pullInventory(since?: Date): Promise<InventoryDelta[]>
  pushInventory?(payload: InventoryDelta[]): Promise<void>
}

interface OrderSyncProvider {
  pullOrders?(since?: Date): Promise<ExternalOrder[]>
  pushOrder?(order: CanonicalOrder): Promise<void>
}

interface CustomerSyncProvider {
  pullCustomers?(since?: Date): Promise<ExternalCustomer[]>
  pushCustomer?(customer: CanonicalCustomer): Promise<void>
}
```

## Mechanisms supported by design

- REST API polling
- Webhooks
- CSV / Excel import
- Scheduled sync (BullMQ)

## Storage

- `Integration` entity: provider key, credentials ref, sync cursors, status
- `WebhookEvent` for inbound POS events
- Dead-letter failed sync jobs for replay

## Documentation update trigger

When vendor docs arrive, add `docs/integrations/POS-<vendor>.md` and implement the adapter behind the ports above.
