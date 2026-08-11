import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermissions } from "../common/decorators";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("rbac")
@ApiBearerAuth()
@Controller(["roles", "admin/roles"])
export class RbacController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("roles.manage")
  async listRoles(@Req() req: Request) {
    const data = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
    return {
      success: true,
      data: data.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        permissions: r.permissions.map((p) => p.permission.code),
      })),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
