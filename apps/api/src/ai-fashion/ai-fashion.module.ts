import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { AuditModule } from "../audit/audit.module";
import { RedisModule } from "../redis/redis.module";
import { AiFashionAdminController } from "./ai-fashion-admin.controller";
import { AiFashionService } from "./ai-fashion.service";
import { AiFashionQueueService } from "./ai-fashion-queue.service";
import { TryOnService } from "./try-on.service";
import { TryOnCustomerController } from "./try-on-customer.controller";
import { TryOnAdminController } from "./try-on-admin.controller";
import { FASHION_AI_PROVIDER } from "./providers/fashion-ai-provider";
import { FashnProvider } from "./providers/fashn.provider";
import { DisabledFashionAiProvider } from "./providers/disabled-fashion.provider";

@Module({
  imports: [MediaModule, AuditModule, RedisModule],
  controllers: [AiFashionAdminController, TryOnCustomerController, TryOnAdminController],
  providers: [
    AiFashionService,
    AiFashionQueueService,
    TryOnService,
    FashnProvider,
    DisabledFashionAiProvider,
    {
      provide: FASHION_AI_PROVIDER,
      useFactory: (fashn: FashnProvider, disabled: DisabledFashionAiProvider) => {
        const provider = process.env.FASHION_AI_PROVIDER?.trim().toLowerCase();
        if (provider === "fashn" && process.env.FASHN_API_KEY?.trim()) {
          return fashn;
        }
        return disabled;
      },
      inject: [FashnProvider, DisabledFashionAiProvider],
    },
  ],
  exports: [AiFashionService, AiFashionQueueService, TryOnService],
})
export class AiFashionModule {}
