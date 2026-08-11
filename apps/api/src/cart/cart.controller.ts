import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { cartItemAddSchema, cartItemUpdateSchema } from "@t360/validation";
import { CurrentUser } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CartService } from "./cart.service";

@ApiTags("cart")
@ApiBearerAuth()
@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  async get(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.cart.getOrCreateCart(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("items")
  async add(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(cartItemAddSchema)) body: { variantId: string; qty: number; branchId?: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.cart.addItem(user.userId, body),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("items/:id")
  async update(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(cartItemUpdateSchema)) body: { qty: number },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.cart.updateItem(user.userId, id, body.qty),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("items/:id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.cart.removeItem(user.userId, id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
