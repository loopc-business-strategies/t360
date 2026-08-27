import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { ReviewCreateInput, ReviewModerationInput } from "@t360/validation";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getProductRatingSummary(productId: string) {
    const agg = await this.prisma.productReview.aggregate({
      where: { productId, status: "approved" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : null,
      reviewCount: agg._count.rating,
    };
  }

  async listApprovedForProduct(productId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId, status: "approved" },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          customer: {
            select: { name: true, user: { select: { mobile: true } } },
          },
        },
      }),
      this.prisma.productReview.count({ where: { productId, status: "approved" } }),
    ]);
    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt,
        authorName: r.customer.name ?? "Customer",
      })),
      meta: { page, pageSize, total },
    };
  }

  async listApprovedForProductSlug(slugOrId: string, page = 1, pageSize = 10) {
    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        status: "published",
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });
    if (!product) {
      return {
        items: [],
        meta: { page, pageSize, total: 0 },
        summary: { averageRating: null, reviewCount: 0 },
      };
    }
    const summary = await this.getProductRatingSummary(product.id);
    const list = await this.listApprovedForProduct(product.id, page, pageSize);
    return { ...list, summary };
  }

  async createForProduct(slugOrId: string, customerId: string, input: ReviewCreateInput) {
    const product = await this.prisma.product.findFirst({
      where: {
        deletedAt: null,
        status: "published",
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });
    if (!product) {
      throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Product not found" });
    }
    const existing = await this.prisma.productReview.findUnique({
      where: { productId_customerId: { productId: product.id, customerId } },
    });
    if (existing) {
      throw new BadRequestException({
        code: "REVIEW_EXISTS",
        message: "You have already reviewed this product",
      });
    }
    const recentCount = await this.prisma.productReview.count({
      where: {
        customerId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentCount >= 5) {
      throw new BadRequestException({
        code: "RATE_LIMIT",
        message: "Too many reviews submitted. Please try again later.",
      });
    }
    const row = await this.prisma.productReview.create({
      data: {
        productId: product.id,
        customerId,
        rating: input.rating,
        title: input.title ?? "",
        body: input.body,
        status: "pending",
      },
    });
    await this.audit.log({
      actorId: customerId,
      action: "review.create",
      entityType: "ProductReview",
      entityId: row.id,
      metadata: { productId: product.id },
    });
    return row;
  }

  async adminList(status?: string, page = 1, pageSize = 20) {
    const where = status ? { status } : {};
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          customer: { select: { id: true, name: true, user: { select: { mobile: true } } } },
        },
      }),
      this.prisma.productReview.count({ where }),
    ]);
    return { items, meta: { page, pageSize, total } };
  }

  async moderate(id: string, input: ReviewModerationInput, actorId?: string) {
    const row = await this.prisma.productReview.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({ code: "REVIEW_NOT_FOUND", message: "Review not found" });
    }
    const updated = await this.prisma.productReview.update({
      where: { id },
      data: { status: input.status },
    });
    await this.audit.log({
      actorId,
      action: "review.moderate",
      entityType: "ProductReview",
      entityId: id,
      metadata: { status: input.status },
    });
    return updated;
  }
}
