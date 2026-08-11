import { Controller, Get, Param, Patch, Query, Req, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { adminCustomerUpdateSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LoyaltyService } from "../loyalty/loyalty.service";

@ApiTags("admin-customers")
@ApiBearerAuth()
@Controller("admin/customers")
export class CustomersAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly loyalty: LoyaltyService,
  ) {}

  @Get()
  @RequirePermissions("customers.read")
  async list(
    @Query("q") q: string | undefined,
    @Query("page") pageRaw: string | undefined,
    @Query("pageSize") pageSizeRaw: string | undefined,
    @Req() req: Request,
  ) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { user: { mobile: { contains: q } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, mobile: true, email: true, status: true } },
          loyaltyAccount: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);
    return {
      success: true,
      data: { items: rows, page, pageSize, total },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get(":id")
  @RequirePermissions("customers.read")
  async get(@Param("id") id: string, @Req() req: Request) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, mobile: true, email: true, status: true } },
        loyaltyAccount: true,
        addresses: { where: { deletedAt: null }, take: 20 },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });
    const orderAgg = await this.prisma.order.aggregate({
      where: { customerId: id },
      _sum: { total: true },
      _count: true,
    });
    return {
      success: true,
      data: {
        ...customer,
        orderSummary: {
          count: orderAgg._count,
          revenue: Number(orderAgg._sum.total ?? 0),
        },
      },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id")
  @RequirePermissions("customers.update")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminCustomerUpdateSchema))
    body: { name?: string; gender?: string | null },
    @CurrentUser() actor: { userId: string },
    @Req() req: Request,
  ) {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        gender: body.gender === undefined ? undefined : body.gender,
      },
    });
    await this.loyalty.ensureAccount(id);
    await this.audit.log({
      actorId: actor.userId,
      action: "customer.update",
      entityType: "Customer",
      entityId: id,
    });
    return {
      success: true,
      data: customer,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
