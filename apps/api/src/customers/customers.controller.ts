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
import {
  addressCreateSchema,
  addressUpdateSchema,
  customerProfileUpdateSchema,
} from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { CustomersService } from "./customers.service";

@ApiTags("customers")
@ApiBearerAuth()
@Controller("customers")
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("me")
  async me(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.customers.getMe(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(customerProfileUpdateSchema)) body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.customers.updateMe(user.userId, body as never),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("me/addresses")
  async listAddresses(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.customers.listAddresses(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("me/addresses")
  async createAddress(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(addressCreateSchema)) body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.customers.createAddress(user.userId, body as never),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("me/addresses/:id")
  async updateAddress(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(addressUpdateSchema)) body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.customers.updateAddress(user.userId, id, body as never),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("me/addresses/:id")
  async deleteAddress(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.customers.deleteAddress(user.userId, id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get()
  @RequirePermissions("customers.read")
  async list(@Req() req: Request) {
    const data = await this.prisma.customer.findMany({ take: 50, orderBy: { createdAt: "desc" } });
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
