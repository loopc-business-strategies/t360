import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "../common/decorators";
import { CollectionsService } from "./collections.service";
import { ReviewsService } from "./reviews.service";

@ApiTags("catalog")
@Controller()
export class CollectionsPublicController {
  constructor(
    private readonly collections: CollectionsService,
    private readonly reviews: ReviewsService,
  ) {}

  @Public()
  @Get("collections")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.collections.listPublic(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("collections/:slug")
  async get(@Param("slug") slug: string, @Req() req: Request) {
    return {
      success: true,
      data: await this.collections.getBySlug(slug),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Public()
  @Get("products/:slugOrId/reviews")
  async productReviews(
    @Param("slugOrId") slugOrId: string,
    @Query("page") page: string | undefined,
    @Query("pageSize") pageSize: string | undefined,
    @Req() req: Request,
  ) {
    const data = await this.reviews.listApprovedForProductSlug(
      slugOrId,
      Number(page) || 1,
      Number(pageSize) || 10,
    );
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
