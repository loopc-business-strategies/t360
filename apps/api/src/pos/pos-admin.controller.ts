import { Body, Controller, Get, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { posIntegrationUpdateSchema, posInventoryCsvImportSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PosService } from "./pos.service";

@ApiTags("admin-pos")
@ApiBearerAuth()
@Controller("admin/integrations/pos")
export class PosAdminController {
  constructor(private readonly pos: PosService) {}

  @Get()
  @RequirePermissions("integrations.manage")
  async get(@Req() req: Request) {
    return {
      success: true,
      data: await this.pos.getStatus(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch()
  @RequirePermissions("integrations.manage")
  async patch(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(posIntegrationUpdateSchema))
    body: { status?: string; config?: Record<string, unknown> | null },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.pos.updateIntegration(body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("sync/inventory")
  @RequirePermissions("integrations.manage")
  async sync(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.pos.syncInventory(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("import/inventory-csv")
  @RequirePermissions("integrations.manage")
  async importCsv(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(posInventoryCsvImportSchema)) body: { csv: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.pos.importInventoryCsv(body.csv, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
