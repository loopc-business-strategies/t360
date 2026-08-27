import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { productListQuerySchema } from "@t360/validation";
import { Public } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@Controller()
export class CatalogPublicController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get("categories")
  async categories(@Req() req: Request) {
    return {
      success: true,
      data: await this.catalog.listCategories(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("brands")
  async brands(@Req() req: Request) {
    return {
      success: true,
      data: await this.catalog.listBrands(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("products")
  async products(
    @Query(new ZodValidationPipe(productListQuerySchema)) query: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const result = await this.catalog.listProducts(query as never);
    return {
      success: true,
      data: result.items,
      meta: result.meta,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("products/:slugOrId/related")
  async related(@Param("slugOrId") slugOrId: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.catalog.listRelatedProducts(slugOrId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("products/:slugOrId")
  async product(
    @Param("slugOrId") slugOrId: string,
    @Query("branch") branch: string | undefined,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.getProduct(slugOrId, { branch }),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
