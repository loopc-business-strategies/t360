import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { createOrderSchema } from "@t360/validation";
import { CurrentUser } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(createOrderSchema)) body: Record<string, unknown>,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.orders.create(user.userId, body as never, idempotencyKey),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get()
  async list(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.orders.listForCustomer(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get(":id")
  async get(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.orders.getByIdForCustomer(user.userId, id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post(":id/cancel")
  async cancel(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.orders.cancel(user.userId, id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post(":id/return")
  async requestReturn(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.orders.requestReturn(user.userId, id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
