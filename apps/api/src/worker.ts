import { NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./audit/audit.module";
import { QueueModule } from "./queue/queue.module";
import { QueueService } from "./queue/queue.service";
import { InventoryModule } from "./inventory/inventory.module";
import { LowStockService } from "./inventory/low-stock.service";
import { CustomersModule } from "./customers/customers.module";
import { CartModule } from "./cart/cart.module";
import { PaymentsModule } from "./payments/payments.module";
import { OrdersModule } from "./orders/orders.module";
import { ReservationExpiryService } from "./orders/reservation-expiry.service";
import { NotificationsModule } from "./notifications/notifications.module";
import { NotificationsQueueService } from "./notifications/notifications-queue.service";
import { MarketingModule } from "./marketing/marketing.module";
import { MarketingQueueService } from "./marketing/marketing-queue.service";
import { PosModule } from "./pos/pos.module";
import { PosQueueService } from "./pos/pos-queue.service";
import { AiFashionModule } from "./ai-fashion/ai-fashion.module";
import { AiFashionQueueService } from "./ai-fashion/ai-fashion-queue.service";
import { MediaModule } from "./media/media.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    PrismaModule,
    AuditModule,
    MediaModule,
    QueueModule,
    InventoryModule,
    CustomersModule,
    CartModule,
    PaymentsModule,
    OrdersModule,
    NotificationsModule,
    MarketingModule,
    PosModule,
    AiFashionModule,
  ],
})
class WorkerAppModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: ["log", "error", "warn"],
  });
  const queue = app.get(QueueService);
  queue.startWorker();
  const lowStock = app.get(LowStockService);
  lowStock.startWorker();
  const expiry = app.get(ReservationExpiryService);
  expiry.startWorker();
  const notifications = app.get(NotificationsQueueService);
  notifications.startWorker();
  const marketing = app.get(MarketingQueueService);
  marketing.startWorker();
  const pos = app.get(PosQueueService);
  pos.startWorker();
  const aiFashion = app.get(AiFashionQueueService);
  aiFashion.startWorker();
}

bootstrap();
