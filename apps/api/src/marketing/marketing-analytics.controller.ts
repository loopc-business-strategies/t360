import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermissions } from "../common/decorators";
import { MarketingService } from "./marketing.service";

@ApiTags("marketing-analytics")
@ApiBearerAuth()
@Controller("admin/marketing")
export class MarketingAnalyticsController {
  constructor(private readonly marketing: MarketingService) {}

  @Get("analytics")
  @RequirePermissions("offers.manage")
  async analytics(@Req() req: Request) {
    return {
      success: true,
      data: await this.marketing.analytics(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
