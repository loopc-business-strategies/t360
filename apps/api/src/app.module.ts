import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RbacModule } from "./rbac/rbac.module";
import { CustomersModule } from "./customers/customers.module";
import { EmployeesModule } from "./employees/employees.module";
import { AuditModule } from "./audit/audit.module";
import { SettingsModule } from "./settings/settings.module";
import { QueueModule } from "./queue/queue.module";
import { CatalogModule } from "./catalog/catalog.module";
import { SearchModule } from "./search/search.module";
import { InventoryModule } from "./inventory/inventory.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { CouponsModule } from "./coupons/coupons.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { ReportsModule } from "./reports/reports.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MarketingModule } from "./marketing/marketing.module";
import { AiModule } from "./ai/ai.module";
import { AiFashionModule } from "./ai-fashion/ai-fashion.module";
import { PosModule } from "./pos/pos.module";
import { MediaModule } from "./media/media.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { MobileAdminGuard } from "./auth/guards/mobile-admin.guard";
import { PermissionsGuard } from "./rbac/permissions.guard";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    PrismaModule,
    RedisModule,
    MediaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RbacModule,
    CustomersModule,
    EmployeesModule,
    AuditModule,
    SettingsModule,
    QueueModule,
    InventoryModule,
    SearchModule,
    CatalogModule,
    WishlistModule,
    PaymentsModule,
    CartModule,
    OrdersModule,
    CouponsModule,
    LoyaltyModule,
    ReportsModule,
    NotificationsModule,
    MarketingModule,
    AiModule,
    AiFashionModule,
    PosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MobileAdminGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
