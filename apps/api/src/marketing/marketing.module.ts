import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AbandonedCartController } from "./abandoned-cart.controller";
import { CampaignsController } from "./campaigns.controller";
import { MarketingAnalyticsController } from "./marketing-analytics.controller";
import { MarketingQueueService } from "./marketing-queue.service";
import { MarketingService } from "./marketing.service";
import { SegmentsController } from "./segments.controller";
import { SocialPostsController } from "./social-posts.controller";
import { MarketingPublicController } from "./marketing-public.controller";

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [
    SegmentsController,
    CampaignsController,
    AbandonedCartController,
    SocialPostsController,
    MarketingAnalyticsController,
    MarketingPublicController,
  ],
  providers: [MarketingService, MarketingQueueService],
  exports: [MarketingService, MarketingQueueService],
})
export class MarketingModule {}
