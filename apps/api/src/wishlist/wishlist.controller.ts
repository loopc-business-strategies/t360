import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { wishlistAddSchema } from "@t360/validation";
import { CurrentUser } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { WishlistService } from "./wishlist.service";

@ApiTags("wishlist")
@ApiBearerAuth()
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  async list(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.wishlist.list(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post()
  async add(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(wishlistAddSchema)) body: { variantId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.wishlist.add(user.userId, body.variantId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete(":variantId")
  async remove(
    @Param("variantId") variantId: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.wishlist.remove(user.userId, variantId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
