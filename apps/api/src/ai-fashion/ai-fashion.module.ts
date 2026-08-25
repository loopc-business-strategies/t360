import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { AuditModule } from "../audit/audit.module";
import { AiFashionAdminController } from "./ai-fashion-admin.controller";
import { AiFashionService } from "./ai-fashion.service";
import { AiFashionQueueService } from "./ai-fashion-queue.service";
import { FASHION_AI_PROVIDER } from "./providers/fashion-ai-provider";
import { FashnProvider } from "./providers/fashn.provider";
import { DisabledFashionAiProvider } from "./providers/disabled-fashion.provider";

@Module({
  imports: [MediaModule, AuditModule],
  controllers: [AiFashionAdminController],
  providers: [
    AiFashionService,
    AiFashionQueueService,
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
  exports: [AiFashionService, AiFashionQueueService],
})
export class AiFashionModule {}
