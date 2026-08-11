import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { loyaltyAdjustSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { LoyaltyService } from "./loyalty.service";

@ApiTags("loyalty")
@ApiBearerAuth()
@Controller()
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get("loyalty/me")
  async me(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.loyalty.getMe(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("admin/loyalty/:customerId")
  @RequirePermissions("loyalty.manage")
  async adminGet(@Param("customerId") customerId: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.loyalty.getAdmin(customerId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("admin/loyalty/:customerId/adjust")
  @RequirePermissions("loyalty.manage")
  async adjust(
    @Param("customerId") customerId: string,
    @Body(new ZodValidationPipe(loyaltyAdjustSchema)) body: { delta: number; reason: string },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.loyalty.adjust(customerId, body.delta, body.reason, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
