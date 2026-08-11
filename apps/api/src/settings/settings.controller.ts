import { Body, Controller, Get, Put, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { storefrontUpdateSchema, type StorefrontUpdateInput } from "@t360/validation";
import { CurrentUser, Public, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  @Public()
  @Get("public")
  async publicSettings(@Req() req: Request) {
    const name = await this.prisma.systemSetting.findUnique({ where: { key: "business.name" } });
    return {
      success: true,
      data: { businessName: name?.value ?? "Tharagai Readymades" },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("storefront")
  async storefront(@Req() req: Request) {
    return {
      success: true,
      data: await this.settings.getStorefront(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @ApiBearerAuth()
  @Put("storefront")
  @RequirePermissions("settings.manage")
  async updateStorefront(
    @Body(new ZodValidationPipe(storefrontUpdateSchema)) body: StorefrontUpdateInput,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.settings.updateStorefront(body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @ApiBearerAuth()
  @Get()
  @RequirePermissions("settings.manage")
  async all(@Req() req: Request) {
    const data = await this.prisma.systemSetting.findMany();
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
