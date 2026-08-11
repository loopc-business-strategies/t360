import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  productListQuerySchema,
  searchSuggestQuerySchema,
  searchSynonymCreateSchema,
  searchSynonymUpdateSchema,
} from "@t360/validation";
import { CurrentUser, Public, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SearchService } from "./search.service";

@ApiTags("search")
@Controller()
export class SearchPublicController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get("products/suggest")
  async suggest(
    @Query(new ZodValidationPipe(searchSuggestQuerySchema)) query: { q: string; limit?: number },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.search.suggest(query.q, query.limit),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("products/facets")
  async facets(
    @Query(new ZodValidationPipe(productListQuerySchema)) query: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.search.facets(query as never),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}

@ApiTags("admin-search")
@ApiBearerAuth()
@Controller("admin/search/synonyms")
export class SearchAdminController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @RequirePermissions("products.update")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.search.listSynonyms(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post()
  @RequirePermissions("products.update")
  async create(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(searchSynonymCreateSchema))
    body: { term: string; aliases: string[]; locale?: string; active?: boolean },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.search.createSynonym(body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch(":id")
  @RequirePermissions("products.update")
  async update(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(searchSynonymUpdateSchema))
    body: Partial<{ term: string; aliases: string[]; locale: string; active: boolean }>,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.search.updateSynonym(id, body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
