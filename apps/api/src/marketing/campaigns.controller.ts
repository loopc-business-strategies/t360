import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { campaignCreateSchema, campaignUpdateSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingService } from "./marketing.service";

@ApiTags("campaigns")
@ApiBearerAuth()
@Controller("admin/campaigns")
export class CampaignsController {
  constructor(private readonly marketing: MarketingService) {}

  @Get()
  @RequirePermissions("offers.manage")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.marketing.listCampaigns(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post()
  @RequirePermissions("offers.manage")
  async create(
    @Body(new ZodValidationPipe(campaignCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.createCampaign(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id")
  @RequirePermissions("offers.manage")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(campaignUpdateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.updateCampaign(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post(":id/enqueue")
  @RequirePermissions("offers.manage")
  async enqueue(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.enqueueCampaign(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
