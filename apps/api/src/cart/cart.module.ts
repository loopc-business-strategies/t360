import { Module } from "@nestjs/common";
import { CustomersModule } from "../customers/customers.module";
import { InventoryModule } from "../inventory/inventory.module";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  imports: [CustomersModule, InventoryModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
