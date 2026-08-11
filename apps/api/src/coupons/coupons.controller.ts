import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  couponCreateSchema,
  couponUpdateSchema,
  couponValidateSchema,
} from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CustomersService } from "../customers/customers.service";
import { CouponsService } from "./coupons.service";

@ApiTags("coupons")
@ApiBearerAuth()
@Controller()
export class CouponsController {
  constructor(
    private readonly coupons: CouponsService,
    private readonly customers: CustomersService,
  ) {}

  @Get("admin/coupons")
  @RequirePermissions("coupons.manage")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.coupons.listAdmin(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("admin/coupons")
  @RequirePermissions("coupons.manage")
  async create(
    @Body(new ZodValidationPipe(couponCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.coupons.create(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("admin/coupons/:id")
  @RequirePermissions("coupons.manage")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(couponUpdateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.coupons.update(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("admin/coupons/:id")
  @RequirePermissions("coupons.manage")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.coupons.remove(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("coupons/validate")
  async validate(
    @Body(new ZodValidationPipe(couponValidateSchema)) body: { code: string; subtotal: number },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const customer = await this.customers.requireCustomer(user.userId);
    const result = await this.coupons.validateForCustomer(body.code, body.subtotal, customer.id);
    return {
      success: true,
      data: {
        code: result.coupon.code,
        discount: result.discount,
        type: result.coupon.type,
        value: result.coupon.value,
      },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
