import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { InventoryModule } from "../inventory/inventory.module";
import { PosService } from "./pos.service";
import { PosQueueService } from "./pos-queue.service";
import { PosAdminController } from "./pos-admin.controller";
import { PosWebhookController } from "./pos-webhook.controller";
import { POS_ADAPTER } from "./providers/pos-provider";
import { MockPosAdapter } from "./providers/mock-pos.adapter";

@Module({
  imports: [AuditModule, InventoryModule],
  controllers: [PosAdminController, PosWebhookController],
  providers: [
    PosService,
    PosQueueService,
    MockPosAdapter,
    {
      provide: POS_ADAPTER,
      useFactory: (mock: MockPosAdapter) => mock,
      inject: [MockPosAdapter],
    },
  ],
  exports: [PosService, PosQueueService],
})
export class PosModule {}
