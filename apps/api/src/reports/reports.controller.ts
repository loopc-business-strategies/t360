import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermissions } from "../common/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("admin")
export class ReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  @Get("dashboard")
  @RequirePermissions("reports.read")
  async dashboard(@Req() req: Request) {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const startWeek = new Date(startToday);
    startWeek.setDate(startWeek.getDate() - 7);

    const paidStatuses = ["Confirmed", "Processing", "Packed", "ReadyForPickup", "OutForDelivery", "Delivered"];

    const [ordersToday, ordersWeek, revenueAgg, paymentPending, readyPickup, lowStock] =
      await Promise.all([
        this.prisma.order.count({ where: { createdAt: { gte: startToday } } }),
        this.prisma.order.count({ where: { createdAt: { gte: startWeek } } }),
        this.prisma.order.aggregate({
          where: { status: { in: paidStatuses }, createdAt: { gte: startWeek } },
          _sum: { total: true },
        }),
        this.prisma.order.count({ where: { status: "PaymentPending" } }),
        this.prisma.order.count({ where: { status: "ReadyForPickup" } }),
        this.inventory.findLowStock(),
      ]);

    return {
      success: true,
      data: {
        ordersToday,
        ordersWeek,
        revenueWeek: Number(revenueAgg._sum.total ?? 0),
        paymentPending,
        readyForPickup: readyPickup,
        lowStockCount: lowStock.length,
      },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("reports/ai")
  @RequirePermissions("reports.read")
  async aiReport(@Req() req: Request) {
    const [
      tryOnTotal,
      tryOnCompleted,
      tryOnFailed,
      tryOnQueued,
      tryOnProcessing,
      aiFailed,
      aiPending,
      aiCompleted,
    ] = await Promise.all([
      this.prisma.tryOnSession.count({ where: { deletedAt: null } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "COMPLETED" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "FAILED" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "QUEUED" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "PROCESSING" } }),
      this.prisma.aiFashionUsage.count({ where: { status: "FAILED" } }),
      this.prisma.aiFashionUsage.count({
        where: { status: { in: ["QUEUED", "PROCESSING"] } },
      }),
      this.prisma.aiFashionUsage.count({ where: { status: "COMPLETED" } }),
    ]);

    return {
      success: true,
      data: {
        tryOn: {
          total: tryOnTotal,
          completed: tryOnCompleted,
          failed: tryOnFailed,
          queueDepth: tryOnQueued + tryOnProcessing,
        },
        aiFashion: {
          completed: aiCompleted,
          failed: aiFailed,
          queueDepth: aiPending,
        },
      },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("reports/sales")
  @RequirePermissions("reports.read")
  async sales(
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Req() req: Request,
  ) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 14 * 86400000);
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: {
          in: ["Confirmed", "Processing", "Packed", "ReadyForPickup", "OutForDelivery", "Delivered"],
        },
      },
      include: { items: true },
    });

    const byDay = new Map<string, number>();
    const byStatus = new Map<string, number>();
    const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(o.total));
      byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
      for (const item of o.items) {
        const cur = byProduct.get(item.sku) ?? { name: item.name, qty: 0, revenue: 0 };
        cur.qty += item.qty;
        cur.revenue += Number(item.lineTotal);
        byProduct.set(item.sku, cur);
      }
    }

    const daily = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
    const statusMix = [...byStatus.entries()].map(([status, count]) => ({ status, count }));
    const topProducts = [...byProduct.entries()]
      .map(([sku, v]) => ({ sku, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      success: true,
      data: { from: fromDate, to: toDate, daily, statusMix, topProducts },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
