import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [InventoryModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
