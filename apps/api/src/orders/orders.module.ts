import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CartModule } from "../cart/cart.module";
import { CouponsModule } from "../coupons/coupons.module";
import { CustomersModule } from "../customers/customers.module";
import { InventoryModule } from "../inventory/inventory.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "../payments/payments.controller";
import { OrdersAdminController } from "./orders-admin.controller";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { ReservationExpiryService } from "./reservation-expiry.service";

@Module({
  imports: [
    AuditModule,
    CartModule,
    CustomersModule,
    InventoryModule,
    CouponsModule,
    LoyaltyModule,
    NotificationsModule,
  ],
  controllers: [OrdersController, OrdersAdminController, PaymentsController],
  providers: [OrdersService, ReservationExpiryService],
  exports: [OrdersService, ReservationExpiryService],
})
export class OrdersModule {}
