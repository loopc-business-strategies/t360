import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { orderStatusUpdateSchema, pickupVerifySchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { OrdersService } from "./orders.service";

@ApiTags("admin-orders")
@ApiBearerAuth()
@Controller("admin/orders")
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermissions("orders.read")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.orders.adminList(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get(":id")
  @RequirePermissions("orders.read")
  async get(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.orders.adminGet(id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id/status")
  @RequirePermissions("orders.update")
  async updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(orderStatusUpdateSchema)) body: { status: string; note?: string },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.orders.adminUpdateStatus(id, body.status, user.userId, body.note),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post(":id/pickup/verify")
  @RequirePermissions("orders.update")
  async verifyPickup(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(pickupVerifySchema)) body: { pickupCode: string },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.orders.verifyPickup(id, body.pickupCode, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
