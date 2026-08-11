import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { CustomersAdminController } from "./customers-admin.controller";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

@Module({
  imports: [AuditModule, LoyaltyModule],
  controllers: [CustomersController, CustomersAdminController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
