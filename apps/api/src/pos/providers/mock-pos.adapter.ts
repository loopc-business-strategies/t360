import { Injectable } from "@nestjs/common";
import type {
  CanonicalCustomer,
  CanonicalOrder,
  ExternalCustomer,
  ExternalOrder,
  InventoryDelta,
  PosAdapter,
} from "./pos-provider";

/**
 * Deterministic local mock — never calls an external POS network.
 */
@Injectable()
export class MockPosAdapter implements PosAdapter {
  async healthcheck(): Promise<boolean> {
    return true;
  }

  async pullInventory(_since?: Date): Promise<InventoryDelta[]> {
    // Empty by default; CSV/webhook drive real adjustments in mock mode.
    // Optional demo delta can be enabled via POS_MOCK_DEMO_DELTA=1.
    if (process.env.POS_MOCK_DEMO_DELTA === "1") {
      return [
        {
          sku: "DEMO-SKU",
          branchCode: "MAIN",
          qtyDelta: 0,
          externalId: "mock-demo",
        },
      ].filter((d) => d.qtyDelta !== 0) as InventoryDelta[];
    }
    return [];
  }

  async pushInventory(_payload: InventoryDelta[]): Promise<void> {
    return;
  }

  async pullOrders(_since?: Date): Promise<ExternalOrder[]> {
    return [];
  }

  async pushOrder(_order: CanonicalOrder): Promise<void> {
    return;
  }

  async pullCustomers(_since?: Date): Promise<ExternalCustomer[]> {
    return [];
  }

  async pushCustomer(_customer: CanonicalCustomer): Promise<void> {
    return;
  }
}
