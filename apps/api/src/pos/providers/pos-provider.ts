export type InventoryDelta = {
  sku?: string | null;
  barcode?: string | null;
  branchCode: string;
  qtyDelta?: number;
  physicalQty?: number;
  externalId?: string;
};

export type ExternalOrder = { externalId: string; payload: unknown };
export type CanonicalOrder = { id: string; number: string };
export type ExternalCustomer = { externalId: string; payload: unknown };
export type CanonicalCustomer = { id: string; mobile?: string | null };

export interface PosProvider {
  healthcheck(): Promise<boolean>;
}

export interface InventorySyncProvider {
  pullInventory(since?: Date): Promise<InventoryDelta[]>;
  pushInventory?(payload: InventoryDelta[]): Promise<void>;
}

export interface OrderSyncProvider {
  pullOrders?(since?: Date): Promise<ExternalOrder[]>;
  pushOrder?(order: CanonicalOrder): Promise<void>;
}

export interface CustomerSyncProvider {
  pullCustomers?(since?: Date): Promise<ExternalCustomer[]>;
  pushCustomer?(customer: CanonicalCustomer): Promise<void>;
}

export type PosAdapter = PosProvider &
  InventorySyncProvider &
  OrderSyncProvider &
  CustomerSyncProvider;

export const POS_ADAPTER = Symbol("POS_ADAPTER");
