import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  collectionCreateSchema,
  collectionProductsSchema,
  collectionUpdateSchema,
  reviewCreateSchema,
  reviewModerationSchema,
} from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CollectionsService } from "./collections.service";
import { ReviewsService } from "./reviews.service";
import { CustomersService } from "../customers/customers.service";

@ApiTags("admin-collections")
@ApiBearerAuth()
@Controller("admin")
export class CollectionsAdminController {
  constructor(private readonly collections: CollectionsService) {}

  @Get("collections")
  @RequirePermissions("collections.manage")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.collections.adminList(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("collections/:id")
  @RequirePermissions("collections.manage")
  async get(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.collections.adminGet(id),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("collections")
  @RequirePermissions("collections.manage")
  async create(
    @Body(new ZodValidationPipe(collectionCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.collections.create(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("collections/:id")
  @RequirePermissions("collections.manage")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(collectionUpdateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.collections.update(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("collections/:id")
  @RequirePermissions("collections.manage")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.collections.delete(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Put("collections/:id/products")
  @RequirePermissions("collections.manage")
  async setProducts(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(collectionProductsSchema)) body: { productIds: string[] },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.collections.setProducts(id, body.productIds, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("collections/by-product/:productId")
  @RequirePermissions("collections.manage")
  async forProduct(@Param("productId") productId: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.collections.collectionIdsForProduct(productId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Put("collections/by-product/:productId")
  @RequirePermissions("collections.manage")
  async syncProduct(
    @Param("productId") productId: string,
    @Body() body: { collectionIds?: string[] },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.collections.syncProductCollections(
        productId,
        body.collectionIds ?? [],
        user.userId,
      ),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}

@ApiTags("reviews")
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly customers: CustomersService,
  ) {}

  @Post("products/:slugOrId/reviews")
  async create(
    @Param("slugOrId") slugOrId: string,
    @Body(new ZodValidationPipe(reviewCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const customer = await this.customers.requireCustomer(user.userId);
    return {
      success: true,
      data: await this.reviews.createForProduct(slugOrId, customer.id, body as never),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("admin/reviews")
  @RequirePermissions("reviews.moderate")
  async adminList(
    @Query("status") status: string | undefined,
    @Query("page") page: string | undefined,
    @Query("pageSize") pageSize: string | undefined,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.reviews.adminList(status, Number(page) || 1, Number(pageSize) || 20),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("admin/reviews/:id")
  @RequirePermissions("reviews.moderate")
  async moderate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(reviewModerationSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.reviews.moderate(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
