import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { abandonedCartSettingsSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingService } from "./marketing.service";

@ApiTags("abandoned-cart")
@ApiBearerAuth()
@Controller("admin/abandoned-cart")
export class AbandonedCartController {
  constructor(private readonly marketing: MarketingService) {}

  @Get()
  @RequirePermissions("offers.manage")
  async get(@Req() req: Request) {
    return {
      success: true,
      data: await this.marketing.getAbandonedCartAdmin(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("settings")
  @RequirePermissions("offers.manage")
  async settings(
    @Body(new ZodValidationPipe(abandonedCartSettingsSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.updateAbandonedSettings(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
