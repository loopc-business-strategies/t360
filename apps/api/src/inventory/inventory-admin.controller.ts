import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { InventoryService } from "./inventory.service";
import { LowStockService } from "./low-stock.service";

const branchCreateSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  hours: z.record(z.string(), z.unknown()).optional(),
  status: z.string().optional(),
});

const adjustSchema = z.object({
  branchId: z.string().uuid(),
  variantId: z.string().uuid(),
  qtyDelta: z.number().int(),
  reason: z.string().optional(),
});

const transferCreateSchema = z.object({
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
});

const reserveSchema = z.object({
  branchId: z.string().uuid(),
  variantId: z.string().uuid(),
  qty: z.number().int().positive(),
  ttlMinutes: z.number().int().positive().optional(),
  cartOrOrderRef: z.string().optional(),
});

@ApiTags("admin-inventory")
@ApiBearerAuth()
@Controller("admin")
export class InventoryAdminController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly lowStock: LowStockService,
  ) {}

  @Get("branches")
  @RequirePermissions("inventory.read")
  async listBranches(@Req() req: Request) {
    return {
      success: true,
      data: await this.inventory.listBranches(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("branches")
  @RequirePermissions("branches.manage")
  async createBranch(
    @Body(new ZodValidationPipe(branchCreateSchema)) body: z.infer<typeof branchCreateSchema>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.createBranch(body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("inventory")
  @RequirePermissions("inventory.read")
  async listInventory(
    @Query("branchId") branchId: string | undefined,
    @Query("lowStockOnly") lowStockOnly: string | undefined,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.listInventory({
        branchId,
        lowStockOnly: lowStockOnly === "true" || lowStockOnly === "1",
      }),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/adjust")
  @RequirePermissions("inventory.adjust")
  async adjust(
    @Body(new ZodValidationPipe(adjustSchema)) body: z.infer<typeof adjustSchema>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.adjust({ ...body, actorId: user.userId }),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("inventory/transfers")
  @RequirePermissions("inventory.transfer")
  async listTransfers(@Req() req: Request) {
    return {
      success: true,
      data: await this.inventory.listTransfers(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/transfers")
  @RequirePermissions("inventory.transfer")
  async createTransfer(
    @Body(new ZodValidationPipe(transferCreateSchema)) body: z.infer<typeof transferCreateSchema>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.createTransfer(body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/transfers/:id/complete")
  @RequirePermissions("inventory.transfer")
  async completeTransfer(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.completeTransfer(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("inventory/lookup")
  @RequirePermissions("inventory.read")
  async lookup(
    @Query("sku") sku: string | undefined,
    @Query("barcode") barcode: string | undefined,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.lookup({ sku, barcode }),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("inventory/movements")
  @RequirePermissions("inventory.read")
  async movements(@Query("limit") limit: string | undefined, @Req() req: Request) {
    return {
      success: true,
      data: await this.inventory.listMovements(limit ? Number(limit) : 50),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/reservations")
  @RequirePermissions("inventory.update")
  async reserve(
    @Body(new ZodValidationPipe(reserveSchema)) body: z.infer<typeof reserveSchema>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.reserve({ ...body, actorId: user.userId }),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/reservations/:id/release")
  @RequirePermissions("inventory.update")
  async release(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.releaseReservation(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/reservations/:id/commit")
  @RequirePermissions("inventory.update")
  async commit(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.inventory.commitReservation(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("inventory/low-stock/run")
  @RequirePermissions("inventory.read")
  async runLowStock(@Req() req: Request) {
    const job = await this.lowStock.enqueueCheck();
    return {
      success: true,
      data: { jobId: job.id },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
