import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import * as argon2 from "argon2";
import {
  employeeCreateSchema,
  employeeRolesSchema,
  employeeUpdateSchema,
} from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@ApiTags("employees")
@ApiBearerAuth()
@Controller("admin/employees")
export class EmployeesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("staff.manage")
  async list(@Req() req: Request) {
    const data = await this.prisma.employee.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roles: { include: { role: true } },
          },
        },
      },
      take: 100,
    });
    return {
      success: true,
      data: data.map((e) => ({
        ...e,
        roles: e.user.roles.map((r) => r.role.code),
      })),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post()
  @RequirePermissions("staff.manage")
  async create(
    @Body(new ZodValidationPipe(employeeCreateSchema))
    body: {
      name: string;
      email: string;
      password: string;
      employeeCode?: string | null;
      branchId?: string | null;
      roleCodes?: string[];
    },
    @CurrentUser() actor: { userId: string },
    @Req() req: Request,
  ) {
    const passwordHash = await argon2.hash(body.password);
    const user = await this.prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        status: "active",
        employee: {
          create: {
            name: body.name,
            branchId: body.branchId ?? null,
            employeeCode: body.employeeCode ?? null,
          },
        },
      },
      include: { employee: true },
    });
    if (body.roleCodes?.length) {
      const roles = await this.prisma.role.findMany({ where: { code: { in: body.roleCodes } } });
      for (const role of roles) {
        await this.prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: role.id } },
          create: { userId: user.id, roleId: role.id },
          update: {},
        });
      }
    }
    await this.audit.log({
      actorId: actor.userId,
      action: "employee.create",
      entityType: "Employee",
      entityId: user.employee!.id,
    });
    return {
      success: true,
      data: user.employee,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id")
  @RequirePermissions("staff.manage")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(employeeUpdateSchema))
    body: { name?: string; employeeCode?: string | null; branchId?: string | null; status?: string },
    @CurrentUser() actor: { userId: string },
    @Req() req: Request,
  ) {
    const emp = await this.prisma.employee.update({
      where: { id },
      data: {
        name: body.name,
        employeeCode: body.employeeCode === undefined ? undefined : body.employeeCode,
        branchId: body.branchId === undefined ? undefined : body.branchId,
      },
    });
    if (body.status) {
      await this.prisma.user.update({
        where: { id: emp.userId },
        data: { status: body.status },
      });
    }
    await this.audit.log({
      actorId: actor.userId,
      action: "employee.update",
      entityType: "Employee",
      entityId: id,
    });
    return {
      success: true,
      data: emp,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post(":id/roles")
  @RequirePermissions("roles.manage")
  async setRoles(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(employeeRolesSchema)) body: { roleCodes: string[] },
    @CurrentUser() actor: { userId: string },
    @Req() req: Request,
  ) {
    const emp = await this.prisma.employee.findUniqueOrThrow({ where: { id } });
    const roles = await this.prisma.role.findMany({ where: { code: { in: body.roleCodes } } });
    const superAdmin = await this.prisma.role.findUnique({ where: { code: "SuperAdmin" } });
    if (superAdmin) {
      const currentlySuper = await this.prisma.userRole.findUnique({
        where: { userId_roleId: { userId: emp.userId, roleId: superAdmin.id } },
      });
      const keepingSuper = roles.some((r) => r.code === "SuperAdmin");
      if (currentlySuper && !keepingSuper) {
        const otherSuperCount = await this.prisma.userRole.count({
          where: { roleId: superAdmin.id, userId: { not: emp.userId } },
        });
        if (otherSuperCount === 0) {
          throw new BadRequestException({
            code: "LAST_SUPERADMIN",
            message: "Cannot remove the last SuperAdmin role assignment",
          });
        }
      }
    }
    await this.prisma.userRole.deleteMany({ where: { userId: emp.userId } });
    for (const role of roles) {
      await this.prisma.userRole.create({
        data: { userId: emp.userId, roleId: role.id },
      });
    }
    await this.audit.log({
      actorId: actor.userId,
      action: "employee.roles",
      entityType: "Employee",
      entityId: id,
      metadata: { roleCodes: body.roleCodes },
    });
    return {
      success: true,
      data: { roleCodes: roles.map((r) => r.code) },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
