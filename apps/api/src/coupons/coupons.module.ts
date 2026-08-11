import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CustomersModule } from "../customers/customers.module";
import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";

@Module({
  imports: [AuditModule, CustomersModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
