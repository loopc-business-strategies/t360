import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  settingsBrandingPatchSchema,
  settingsCommercePatchSchema,
  settingsGeneralPatchSchema,
  settingsStoragePatchSchema,
  storefrontUpdateSchema,
  type StorefrontUpdateInput,
} from "@t360/validation";
import { z } from "zod";
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

@ApiTags("admin-settings")
@ApiBearerAuth()
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  private reqId(req: Request) {
    return (req as Request & { requestId?: string }).requestId;
  }

  @Get("catalog")
  @RequirePermissions("settings.manage")
  async catalog(@Req() req: Request) {
    return {
      success: true,
      data: await this.settings.getCatalog(),
      requestId: this.reqId(req),
    };
  }

  @Patch(":category")
  @RequirePermissions("settings.manage")
  async patch(
    @Param("category") category: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const schemaByCategory: Record<string, z.ZodTypeAny> = {
      general: settingsGeneralPatchSchema,
      commerce: settingsCommercePatchSchema,
      branding: settingsBrandingPatchSchema,
      storage: settingsStoragePatchSchema,
    };
    const schema = schemaByCategory[category];
    let payload: Record<string, unknown> = body ?? {};
    if (schema) {
      const validated = schema.safeParse(payload);
      if (!validated.success) {
        throw new BadRequestException({
          code: "VALIDATION",
          message: validated.error.issues.map((i) => i.message).join("; ") || "Invalid settings",
        });
      }
      payload = validated.data as Record<string, unknown>;
    }
    const data = await this.settings.patchCategory(category, payload, user.userId);
    return { success: true, data, requestId: this.reqId(req) };
  }
}
