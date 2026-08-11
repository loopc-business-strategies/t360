import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermissions } from "../common/decorators";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("audit")
@ApiBearerAuth()
@Controller("audit")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("audit.read")
  async list(@Query("take") take = "20", @Req() req: Request) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(take) || 20, 100),
    });
    return {
      success: true,
      data: logs,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
