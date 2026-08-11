import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  brandCreateSchema,
  categoryCreateSchema,
  productCreateSchema,
  productListQuerySchema,
  productUpdateSchema,
} from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CatalogService } from "./catalog.service";

@ApiTags("admin-catalog")
@ApiBearerAuth()
@Controller("admin")
export class CatalogAdminController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  @RequirePermissions("categories.manage")
  async listCategories(@Req() req: Request) {
    return {
      success: true,
      data: await this.catalog.adminListCategories(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("categories")
  @RequirePermissions("categories.manage")
  async createCategory(
    @Body(new ZodValidationPipe(categoryCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.createCategory(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("categories/:id")
  @RequirePermissions("categories.manage")
  async updateCategory(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(categoryCreateSchema.partial())) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.updateCategory(id, body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("categories/:id")
  @RequirePermissions("categories.manage")
  async deleteCategory(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.deleteCategory(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("brands")
  @RequirePermissions("brands.manage")
  async listBrands(@Req() req: Request) {
    return {
      success: true,
      data: await this.catalog.adminListBrands(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("brands")
  @RequirePermissions("brands.manage")
  async createBrand(
    @Body(new ZodValidationPipe(brandCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.createBrand(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("brands/:id")
  @RequirePermissions("brands.manage")
  async updateBrand(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(brandCreateSchema.partial())) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.updateBrand(id, body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("brands/:id")
  @RequirePermissions("brands.manage")
  async deleteBrand(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.deleteBrand(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("products")
  @RequirePermissions("products.read")
  async listProducts(
    @Query(new ZodValidationPipe(productListQuerySchema)) query: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const result = await this.catalog.listProducts(query as never, { admin: true });
    return {
      success: true,
      data: result.items,
      meta: result.meta,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("products/export")
  @RequirePermissions("products.read")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="products.csv"')
  async export() {
    return this.catalog.exportCsv();
  }

  @Get("products/:id")
  @RequirePermissions("products.read")
  async getProduct(@Param("id") id: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.catalog.getProduct(id, { admin: true }),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("products")
  @RequirePermissions("products.create")
  async createProduct(
    @Body(new ZodValidationPipe(productCreateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.createProduct(body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("products/:id")
  @RequirePermissions("products.update")
  async updateProduct(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(productUpdateSchema)) body: Record<string, unknown>,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.updateProduct(id, body as never, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("products/:id")
  @RequirePermissions("products.delete")
  async deleteProduct(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.catalog.deleteProduct(id, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("products/import")
  @RequirePermissions("products.create")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: { type: "object", properties: { file: { type: "string", format: "binary" } } },
  })
  async importCsv(
    @UploadedFile() file: { buffer?: Buffer; originalname?: string } | undefined,
    @Body("csv") csvBody: string | undefined,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const content = file?.buffer?.toString("utf8") ?? csvBody ?? "";
    return {
      success: true,
      data: await this.catalog.importCsv(content, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
