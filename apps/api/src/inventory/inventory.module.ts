import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { InventoryService } from "./inventory.service";
import { InventoryAdminController } from "./inventory-admin.controller";
import { BranchesPublicController } from "./branches-public.controller";
import { LowStockService } from "./low-stock.service";

@Module({
  imports: [AuditModule],
  controllers: [InventoryAdminController, BranchesPublicController],
  providers: [InventoryService, LowStockService],
  exports: [InventoryService, LowStockService],
})
export class InventoryModule {}
