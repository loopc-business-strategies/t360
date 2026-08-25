import { BadRequestException, Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { rolePermissionsUpdateSchema, type RolePermissionsUpdateInput } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@ApiTags("rbac")
@ApiBearerAuth()
@Controller(["roles", "admin/roles"])
export class RbacController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("roles.manage")
  async listRoles(@Req() req: Request) {
    const data = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { code: "asc" },
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

  @Get("permissions")
  @RequirePermissions("roles.manage")
  async listPermissions(@Req() req: Request) {
    const data = await this.prisma.permission.findMany({ orderBy: { code: "asc" } });
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id/permissions")
  @RequirePermissions("roles.manage")
  async updateRolePermissions(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(rolePermissionsUpdateSchema)) body: RolePermissionsUpdateInput,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { id } });
    if (role.code === "SuperAdmin" && body.permissionCodes.length === 0) {
      throw new BadRequestException({
        code: "SUPERADMIN_PERMS_REQUIRED",
        message: "Cannot clear all permissions from SuperAdmin",
      });
    }
    const perms = await this.prisma.permission.findMany({
      where: { code: { in: body.permissionCodes } },
    });
    if (role.code === "SuperAdmin" && perms.length === 0 && body.permissionCodes.length > 0) {
      throw new BadRequestException({
        code: "INVALID_PERMISSIONS",
        message: "No matching permissions found",
      });
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      if (perms.length) {
        await tx.rolePermission.createMany({
          data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        });
      }
    });
    await this.audit.log({
      actorId: user.userId,
      action: "rbac.role.permissions.update",
      entityType: "Role",
      entityId: role.id,
      metadata: { code: role.code, permissionCodes: body.permissionCodes },
    });
    const updated = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    return {
      success: true,
      data: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        permissions: updated.permissions.map((p) => p.permission.code),
      },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
