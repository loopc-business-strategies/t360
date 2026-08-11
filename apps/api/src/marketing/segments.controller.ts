import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { segmentCreateSchema, segmentUpdateSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingService } from "./marketing.service";

@ApiTags("segments")
@ApiBearerAuth()
@Controller("admin/segments")
export class SegmentsController {
  constructor(private readonly marketing: MarketingService) {}

  @Get()
  @RequirePermissions("offers.manage")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.marketing.listSegments(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post()
  @RequirePermissions("offers.manage")
  async create(
    @Body(new ZodValidationPipe(segmentCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.createSegment(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id")
  @RequirePermissions("offers.manage")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(segmentUpdateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.updateSegment(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post(":id/preview")
  @RequirePermissions("offers.manage")
  async preview(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.marketing.previewSegment(id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
