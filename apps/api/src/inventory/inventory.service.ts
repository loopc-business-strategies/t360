import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { availableQty, reservationExpired } from "./inventory.utils";

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listBranches() {
    return this.prisma.branch.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { warehouses: true },
    });
  }

  async createBranch(
    input: {
      code: string;
      name: string;
      address?: string;
      phone?: string;
      hours?: object;
      status?: string;
    },
    actorId?: string,
  ) {
    const row = await this.prisma.branch.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        address: input.address ?? "",
        phone: input.phone,
        hours: input.hours ?? undefined,
        status: input.status ?? "active",
      },
    });
    await this.audit.log({
      actorId,
      action: "branch.create",
      entityType: "Branch",
      entityId: row.id,
    });
    return row;
  }

  async listInventory(filters: { branchId?: string; lowStockOnly?: boolean }) {
    const rows = await this.prisma.inventory.findMany({
      where: {
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
      },
      include: {
        branch: true,
        variant: { include: { product: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return rows
      .map((r) => ({
        ...r,
        availableQty: availableQty(r.physicalQty, r.reservedQty),
        lowStock: availableQty(r.physicalQty, r.reservedQty) <= r.lowStockThreshold,
      }))
      .filter((r) => (filters.lowStockOnly ? r.lowStock : true));
  }

  async adjust(input: {
    branchId: string;
    variantId: string;
    qtyDelta: number;
    reason?: string;
    actorId?: string;
  }) {
    if (input.qtyDelta === 0) {
      throw new BadRequestException({ code: "INVALID_QTY", message: "qtyDelta cannot be 0" });
    }

    return this.prisma.$transaction(async (tx) => {
      let inv = await tx.inventory.findUnique({
        where: {
          branchId_variantId: { branchId: input.branchId, variantId: input.variantId },
        },
      });
      if (!inv) {
        inv = await tx.inventory.create({
          data: {
            branchId: input.branchId,
            variantId: input.variantId,
            physicalQty: 0,
            reservedQty: 0,
          },
        });
      }

      const nextPhysical = inv.physicalQty + input.qtyDelta;
      if (nextPhysical < 0 || nextPhysical < inv.reservedQty) {
        throw new ConflictException({
          code: "INSUFFICIENT_STOCK",
          message: "Adjustment would make physical stock invalid",
        });
      }

      const updated = await tx.inventory.updateMany({
        where: { id: inv.id, version: inv.version },
        data: {
          physicalQty: nextPhysical,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException({ code: "VERSION_CONFLICT", message: "Inventory changed; retry" });
      }

      await tx.inventoryMovement.create({
        data: {
          branchId: input.branchId,
          variantId: input.variantId,
          type: "ADJUST",
          qtyDelta: input.qtyDelta,
          physicalAfter: nextPhysical,
          reservedAfter: inv.reservedQty,
          actorId: input.actorId,
          reason: input.reason ?? "manual adjustment",
        },
      });

      await this.audit.log({
        actorId: input.actorId,
        action: "inventory.adjust",
        entityType: "Inventory",
        entityId: inv.id,
        metadata: { qtyDelta: input.qtyDelta },
      });

      return tx.inventory.findUniqueOrThrow({ where: { id: inv.id } });
    });
  }

  async createTransfer(
    input: {
      fromBranchId: string;
      toBranchId: string;
      notes?: string;
      lines: Array<{ variantId: string; qty: number }>;
    },
    actorId?: string,
  ) {
    if (input.fromBranchId === input.toBranchId) {
      throw new BadRequestException({ code: "SAME_BRANCH", message: "Branches must differ" });
    }
    if (!input.lines.length) {
      throw new BadRequestException({ code: "NO_LINES", message: "Transfer needs lines" });
    }

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        fromBranchId: input.fromBranchId,
        toBranchId: input.toBranchId,
        notes: input.notes,
        status: "pending",
        lines: {
          create: input.lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        },
      },
      include: { lines: true },
    });
    await this.audit.log({
      actorId,
      action: "inventory.transfer.create",
      entityType: "StockTransfer",
      entityId: transfer.id,
    });
    return transfer;
  }

  async completeTransfer(transferId: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: { lines: true },
      });
      if (!transfer) {
        throw new NotFoundException({ code: "TRANSFER_NOT_FOUND", message: "Transfer not found" });
      }
      if (transfer.status !== "pending") {
        throw new BadRequestException({ code: "TRANSFER_NOT_PENDING", message: "Already completed" });
      }

      for (const line of transfer.lines) {
        const from = await this.getOrCreateInventory(
          tx,
          transfer.fromBranchId,
          line.variantId,
        );
        const available = availableQty(from.physicalQty, from.reservedQty);
        if (available < line.qty) {
          throw new ConflictException({
            code: "INSUFFICIENT_STOCK",
            message: `Insufficient stock for variant ${line.variantId}`,
          });
        }

        const fromNext = from.physicalQty - line.qty;
        const fromUp = await tx.inventory.updateMany({
          where: { id: from.id, version: from.version },
          data: { physicalQty: fromNext, version: { increment: 1 } },
        });
        if (fromUp.count !== 1) {
          throw new ConflictException({ code: "VERSION_CONFLICT", message: "Retry transfer" });
        }
        await tx.inventoryMovement.create({
          data: {
            branchId: transfer.fromBranchId,
            variantId: line.variantId,
            type: "TRANSFER_OUT",
            qtyDelta: -line.qty,
            physicalAfter: fromNext,
            reservedAfter: from.reservedQty,
            actorId,
            transferId: transfer.id,
            reason: "stock transfer out",
          },
        });

        const to = await this.getOrCreateInventory(tx, transfer.toBranchId, line.variantId);
        const toNext = to.physicalQty + line.qty;
        const toUp = await tx.inventory.updateMany({
          where: { id: to.id, version: to.version },
          data: { physicalQty: toNext, version: { increment: 1 } },
        });
        if (toUp.count !== 1) {
          throw new ConflictException({ code: "VERSION_CONFLICT", message: "Retry transfer" });
        }
        await tx.inventoryMovement.create({
          data: {
            branchId: transfer.toBranchId,
            variantId: line.variantId,
            type: "TRANSFER_IN",
            qtyDelta: line.qty,
            physicalAfter: toNext,
            reservedAfter: to.reservedQty,
            actorId,
            transferId: transfer.id,
            reason: "stock transfer in",
          },
        });
      }

      const done = await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: "completed", completedAt: new Date() },
        include: { lines: true },
      });
      await this.audit.log({
        actorId,
        action: "inventory.transfer.complete",
        entityType: "StockTransfer",
        entityId: transfer.id,
      });
      return done;
    });
  }

  async lookup(query: { sku?: string; barcode?: string }) {
    if (!query.sku && !query.barcode) {
      throw new BadRequestException({ code: "MISSING_QUERY", message: "sku or barcode required" });
    }
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(query.sku ? [{ sku: query.sku }] : []),
          ...(query.barcode ? [{ barcode: query.barcode }] : []),
        ],
      },
      include: {
        product: true,
        inventory: { include: { branch: true } },
      },
    });
    if (!variant) {
      throw new NotFoundException({ code: "VARIANT_NOT_FOUND", message: "No match for SKU/barcode" });
    }
    return {
      ...variant,
      inventory: variant.inventory.map((i) => ({
        ...i,
        availableQty: availableQty(i.physicalQty, i.reservedQty),
      })),
    };
  }

  async listMovements(limit = 50) {
    return this.prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });
  }

  async listTransfers() {
    return this.prisma.stockTransfer.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        lines: true,
        fromBranch: true,
        toBranch: true,
      },
    });
  }

  async reserve(input: {
    branchId: string;
    variantId: string;
    qty: number;
    ttlMinutes?: number;
    cartOrOrderRef?: string;
    actorId?: string;
  }) {
    if (input.qty <= 0) {
      throw new BadRequestException({ code: "INVALID_QTY", message: "qty must be positive" });
    }
    const ttl = input.ttlMinutes ?? 15;
    const expiresAt = new Date(Date.now() + ttl * 60_000);

    return this.prisma.$transaction(async (tx) => {
      const inv = await this.getOrCreateInventory(tx, input.branchId, input.variantId);
      const available = availableQty(inv.physicalQty, inv.reservedQty);
      if (available < input.qty) {
        throw new ConflictException({
          code: "INSUFFICIENT_STOCK",
          message: "Not enough available stock to reserve",
        });
      }
      const nextReserved = inv.reservedQty + input.qty;
      const up = await tx.inventory.updateMany({
        where: { id: inv.id, version: inv.version },
        data: { reservedQty: nextReserved, version: { increment: 1 } },
      });
      if (up.count !== 1) {
        throw new ConflictException({ code: "VERSION_CONFLICT", message: "Retry reserve" });
      }
      const reservation = await tx.stockReservation.create({
        data: {
          branchId: input.branchId,
          variantId: input.variantId,
          qty: input.qty,
          status: "active",
          expiresAt,
          cartOrOrderRef: input.cartOrOrderRef,
        },
      });
      await tx.inventoryMovement.create({
        data: {
          branchId: input.branchId,
          variantId: input.variantId,
          type: "RESERVE",
          qtyDelta: input.qty,
          physicalAfter: inv.physicalQty,
          reservedAfter: nextReserved,
          actorId: input.actorId,
          reservationId: reservation.id,
          reason: "stock reservation",
        },
      });
      return reservation;
    });
  }

  async releaseReservation(id: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({ where: { id } });
      if (!reservation || reservation.status !== "active") {
        throw new BadRequestException({
          code: "RESERVATION_INVALID",
          message: "Reservation not active",
        });
      }
      const inv = await this.getOrCreateInventory(
        tx,
        reservation.branchId,
        reservation.variantId,
      );
      const nextReserved = Math.max(0, inv.reservedQty - reservation.qty);
      const up = await tx.inventory.updateMany({
        where: { id: inv.id, version: inv.version },
        data: { reservedQty: nextReserved, version: { increment: 1 } },
      });
      if (up.count !== 1) {
        throw new ConflictException({ code: "VERSION_CONFLICT", message: "Retry release" });
      }
      await tx.stockReservation.update({
        where: { id },
        data: { status: reservationExpired(reservation.expiresAt) ? "expired" : "released" },
      });
      await tx.inventoryMovement.create({
        data: {
          branchId: reservation.branchId,
          variantId: reservation.variantId,
          type: "RELEASE",
          qtyDelta: -reservation.qty,
          physicalAfter: inv.physicalQty,
          reservedAfter: nextReserved,
          actorId,
          reservationId: id,
          reason: "reservation release",
        },
      });
      return { released: true };
    });
  }

  async commitReservation(id: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({ where: { id } });
      if (!reservation || reservation.status !== "active") {
        throw new BadRequestException({
          code: "RESERVATION_INVALID",
          message: "Reservation not active",
        });
      }
      if (reservationExpired(reservation.expiresAt)) {
        throw new BadRequestException({
          code: "RESERVATION_EXPIRED",
          message: "Reservation expired; release instead",
        });
      }
      const inv = await this.getOrCreateInventory(
        tx,
        reservation.branchId,
        reservation.variantId,
      );
      if (inv.physicalQty < reservation.qty || inv.reservedQty < reservation.qty) {
        throw new ConflictException({
          code: "INSUFFICIENT_STOCK",
          message: "Cannot commit reservation",
        });
      }
      const nextPhysical = inv.physicalQty - reservation.qty;
      const nextReserved = inv.reservedQty - reservation.qty;
      const up = await tx.inventory.updateMany({
        where: { id: inv.id, version: inv.version },
        data: {
          physicalQty: nextPhysical,
          reservedQty: nextReserved,
          version: { increment: 1 },
        },
      });
      if (up.count !== 1) {
        throw new ConflictException({ code: "VERSION_CONFLICT", message: "Retry commit" });
      }
      await tx.stockReservation.update({
        where: { id },
        data: { status: "committed" },
      });
      await tx.inventoryMovement.create({
        data: {
          branchId: reservation.branchId,
          variantId: reservation.variantId,
          type: "SALE",
          qtyDelta: -reservation.qty,
          physicalAfter: nextPhysical,
          reservedAfter: nextReserved,
          actorId,
          reservationId: id,
          reason: "reservation commit / sale",
        },
      });
      return { committed: true };
    });
  }

  async findLowStock() {
    const rows = await this.prisma.inventory.findMany({
      include: { branch: true, variant: { include: { product: true } } },
    });
    return rows
      .map((r) => ({
        ...r,
        availableQty: availableQty(r.physicalQty, r.reservedQty),
      }))
      .filter((r) => r.availableQty <= r.lowStockThreshold);
  }

  async stockByVariantIds(variantIds: string[], branchId?: string) {
    if (!variantIds.length) return new Map<string, number>();
    const rows = await this.prisma.inventory.findMany({
      where: {
        variantId: { in: variantIds },
        ...(branchId ? { branchId } : {}),
      },
    });
    const map = new Map<string, number>();
    for (const r of rows) {
      const avail = availableQty(r.physicalQty, r.reservedQty);
      map.set(r.variantId, (map.get(r.variantId) ?? 0) + avail);
    }
    return map;
  }

  private async getOrCreateInventory(
    tx: Prisma.TransactionClient,
    branchId: string,
    variantId: string,
  ) {
    const existing = await tx.inventory.findUnique({
      where: { branchId_variantId: { branchId, variantId } },
    });
    if (existing) return existing;
    return tx.inventory.create({
      data: { branchId, variantId, physicalQty: 0, reservedQty: 0 },
    });
  }
}
