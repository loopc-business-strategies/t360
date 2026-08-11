import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CustomersModule } from "../customers/customers.module";
import { WishlistController } from "./wishlist.controller";
import { WishlistService } from "./wishlist.service";

@Module({
  imports: [AuditModule, CustomersModule],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
