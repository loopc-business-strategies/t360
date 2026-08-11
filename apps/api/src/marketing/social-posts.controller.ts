import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { socialPostCreateSchema, socialPostUpdateSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingService } from "./marketing.service";

@ApiTags("social-posts")
@ApiBearerAuth()
@Controller("admin/social-posts")
export class SocialPostsController {
  constructor(private readonly marketing: MarketingService) {}

  @Get()
  @RequirePermissions("offers.manage")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.marketing.listSocialPosts(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post()
  @RequirePermissions("offers.manage")
  async create(
    @Body(new ZodValidationPipe(socialPostCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.createSocialPost(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id")
  @RequirePermissions("offers.manage")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(socialPostUpdateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.updateSocialPost(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete(":id")
  @RequirePermissions("offers.manage")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.marketing.deleteSocialPost(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
