import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { tryOnSettingsUpdateSchema, type TryOnSettingsUpdateInput } from "@t360/validation";
import { RequireAnyPermissions, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { TryOnService } from "./try-on.service";

@ApiTags("admin-try-on")
@ApiBearerAuth()
@Controller("admin/ai-fashion/try-on")
export class TryOnAdminController {
  constructor(private readonly tryOn: TryOnService) {}

  private reqId(req: Request) {
    return (req as Request & { requestId?: string }).requestId;
  }

  private actorId(req: Request) {
    return (req as Request & { user?: { sub?: string } }).user?.sub;
  }

  @Get("dashboard")
  @RequirePermissions("ai.tryon.read")
  async dashboard(@Req() req: Request) {
    return {
      success: true,
      data: await this.tryOn.adminDashboard(),
      requestId: this.reqId(req),
    };
  }

  @Get("settings")
  @RequireAnyPermissions("ai.tryon.manage", "ai_settings.update")
  async getSettings(@Req() req: Request) {
    return {
      success: true,
      data: await this.tryOn.getSettings(),
      requestId: this.reqId(req),
    };
  }

  @Patch("settings")
  @RequireAnyPermissions("ai.tryon.manage", "ai_settings.update")
  async updateSettings(
    @Body(new ZodValidationPipe(tryOnSettingsUpdateSchema)) body: TryOnSettingsUpdateInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.tryOn.updateSettings(body, this.actorId(req)),
      requestId: this.reqId(req),
    };
  }

  @Get()
  @RequirePermissions("ai.tryon.read")
  async list(
    @Query("status") status: string | undefined,
    @Query("page") page: string | undefined,
    @Query("pageSize") pageSize: string | undefined,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.tryOn.adminList({
        status,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      }),
      requestId: this.reqId(req),
    };
  }

  @Post(":id/retry")
  @RequirePermissions("ai.tryon.manage")
  async retry(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.tryOn.adminRetry(id),
      requestId: this.reqId(req),
    };
  }

  @Post(":id/cancel")
  @RequirePermissions("ai.tryon.manage")
  async cancel(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.tryOn.adminCancel(id),
      requestId: this.reqId(req),
    };
  }

  @Delete(":id")
  @RequirePermissions("ai.tryon.delete")
  async remove(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.tryOn.adminDelete(id),
      requestId: this.reqId(req),
    };
  }
}
