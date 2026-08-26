import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import type { TryOnCreateInput, TryOnHistoryQuery } from "@t360/validation";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { MEDIA_STORAGE, MediaStorage } from "../media/media-storage";
import {
  FASHION_AI_PROVIDER,
  FashionAIProvider,
  FashionProviderError,
} from "./providers/fashion-ai-provider";
import { AiFashionQueueService } from "./ai-fashion-queue.service";

type TryOnConfig = {
  enabled: boolean;
  maxImageBytes: number;
  retentionHours: number;
  perUserPerHour: number;
  maxConcurrentPerUser: number;
};

const DEFAULT_TRY_ON_CONFIG: TryOnConfig = {
  enabled: process.env.TRY_ON_ENABLED !== "0" && process.env.TRY_ON_ENABLED !== "false",
  maxImageBytes: 8_000_000,
  retentionHours: 24,
  perUserPerHour: 10,
  maxConcurrentPerUser: 2,
};

const FRIENDLY: Record<string, string> = {
  PROVIDER_UNAVAILABLE:
    "Virtual Try-On is temporarily unavailable. Please try again later.",
  PROVIDER_TIMEOUT: "The try-on is taking longer than expected. Please try again.",
  RATE_LIMIT: "You've reached the Try Me limit for now. Please try again later.",
  IMAGE_INVALID: "We couldn't use this photo. Please try another clear photo of yourself.",
  PRODUCT_DISABLED: "Try Me isn't available for this product yet.",
  CREDITS: "Virtual Try-On is temporarily unavailable. Please try again later.",
};

@Injectable()
export class TryOnService {
  private readonly logger = new Logger(TryOnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: AiFashionQueueService,
    @Inject(FASHION_AI_PROVIDER) private readonly provider: FashionAIProvider,
    @Inject(MEDIA_STORAGE) private readonly media: MediaStorage,
  ) {}

  private async readConfig(): Promise<TryOnConfig> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: "ai.tryon.config" },
    });
    if (!row?.value || typeof row.value !== "object" || Array.isArray(row.value)) {
      return DEFAULT_TRY_ON_CONFIG;
    }
    return { ...DEFAULT_TRY_ON_CONFIG, ...(row.value as Partial<TryOnConfig>) };
  }

  private friendly(code: string, fallback?: string) {
    return FRIENDLY[code] ?? fallback ?? "We couldn't create your try-on. Please try again.";
  }

  resolveGarmentUrl(
    images: { url: string; mediaType: string; isTryOnSource: boolean; sortOrder: number }[],
  ): string | null {
    const stills = images.filter((i) => (i.mediaType || "image") === "image");
    const tryOn = stills.find((i) => i.isTryOnSource);
    if (tryOn?.url) return tryOn.url;
    const sorted = [...stills].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0]?.url ?? null;
  }

  async uploadPersonPhoto(userId: string, file: Express.Multer.File) {
    const config = await this.readConfig();
    if (!config.enabled) {
      throw new ServiceUnavailableException({
        code: "TRY_ON_DISABLED",
        message: this.friendly("PROVIDER_UNAVAILABLE"),
      });
    }
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!file?.buffer?.length) {
      throw new BadRequestException({
        code: "FILE_REQUIRED",
        message: "Please choose a photo to continue.",
      });
    }
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Please upload a JPG, PNG, or WebP photo.",
      });
    }
    if (file.size > config.maxImageBytes) {
      throw new BadRequestException({
        code: "FILE_TOO_LARGE",
        message: "That photo is too large. Please use a smaller image.",
      });
    }
    if (!this.media.uploadBuffer) {
      throw new ServiceUnavailableException({
        code: "UPLOAD_UNSUPPORTED",
        message: this.friendly("PROVIDER_UNAVAILABLE"),
      });
    }
    const asset = await this.media.uploadBuffer(file.buffer, {
      mimeType: file.mimetype,
      folder: `t360/try-on/${userId}`,
      publicId: `person_${Date.now()}`,
    });
    return asset;
  }

  private async assertRateLimit(userId: string, config: TryOnConfig) {
    const key = `tryon:user:${userId}:hour`;
    const n = await this.redis.client.incr(key);
    if (n === 1) await this.redis.client.expire(key, 3600);
    if (n > config.perUserPerHour) {
      throw new BadRequestException({
        code: "RATE_LIMIT",
        message: this.friendly("RATE_LIMIT"),
      });
    }
    const active = await this.prisma.tryOnSession.count({
      where: {
        customerId: userId,
        deletedAt: null,
        status: { in: ["QUEUED", "PROCESSING"] },
      },
    });
    if (active >= config.maxConcurrentPerUser) {
      throw new BadRequestException({
        code: "RATE_LIMIT",
        message: this.friendly("RATE_LIMIT"),
      });
    }
  }

  async create(userId: string, input: TryOnCreateInput, idempotencyKey?: string) {
    const config = await this.readConfig();
    if (!config.enabled) {
      throw new ServiceUnavailableException({
        code: "TRY_ON_DISABLED",
        message: this.friendly("PROVIDER_UNAVAILABLE"),
      });
    }
    if (!this.provider.isConfigured()) {
      throw new ServiceUnavailableException({
        code: "PROVIDER_UNAVAILABLE",
        message: this.friendly("PROVIDER_UNAVAILABLE"),
      });
    }

    if (idempotencyKey) {
      const existing = await this.prisma.tryOnSession.findUnique({
        where: { idempotencyKey },
      });
      if (existing && existing.customerId === userId && !existing.deletedAt) {
        return this.toDto(existing);
      }
    }

    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null, status: "published" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) {
      throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Product not found" });
    }
    if (!product.tryOnEnabled) {
      throw new BadRequestException({
        code: "PRODUCT_DISABLED",
        message: this.friendly("PRODUCT_DISABLED"),
      });
    }
    const garmentUrl = this.resolveGarmentUrl(product.images);
    if (!garmentUrl) {
      throw new BadRequestException({
        code: "PRODUCT_DISABLED",
        message: this.friendly("PRODUCT_DISABLED"),
      });
    }

    if (input.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: input.variantId, productId: product.id, deletedAt: null },
      });
      if (!variant) {
        throw new BadRequestException({
          code: "VARIANT_INVALID",
          message: "Please select a valid size or colour.",
        });
      }
    }

    await this.assertRateLimit(userId, config);

    const personHash = createHash("sha256").update(input.inputImageUrl).digest("hex").slice(0, 24);
    const activeDup = await this.prisma.tryOnSession.findFirst({
      where: {
        customerId: userId,
        productId: product.id,
        deletedAt: null,
        status: { in: ["QUEUED", "PROCESSING"] },
        inputImageUrl: input.inputImageUrl,
      },
      orderBy: { createdAt: "desc" },
    });
    if (activeDup) return this.toDto(activeDup);

    const expiresAt = new Date(Date.now() + config.retentionHours * 3600_000);
    const session = await this.prisma.tryOnSession.create({
      data: {
        id: randomUUID(),
        customerId: userId,
        productId: product.id,
        variantId: input.variantId ?? null,
        inputImageUrl: input.inputImageUrl,
        inputPublicId: input.inputPublicId ?? null,
        status: "QUEUED",
        provider: this.provider.name,
        idempotencyKey: idempotencyKey ?? null,
        savePhotoConsent: input.savePhotoConsent ?? false,
        expiresAt,
      },
    });

    await this.prisma.tryOnUsage.create({
      data: {
        id: randomUUID(),
        customerId: userId,
        productId: product.id,
        sessionId: session.id,
        provider: this.provider.name,
        status: "QUEUED",
        source: "customer",
      },
    });

    // Store garment URL in a side channel via redis for the worker
    await this.redis.client.set(
      `tryon:garment:${session.id}`,
      garmentUrl,
      "EX",
      config.retentionHours * 3600,
    );
    await this.redis.client.set(
      `tryon:personHash:${session.id}`,
      personHash,
      "EX",
      config.retentionHours * 3600,
    );

    await this.queue.enqueueTryOn({ tryOnSessionId: session.id });
    return this.toDto(session);
  }

  async getForCustomer(userId: string, id: string) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id, customerId: userId, deletedAt: null },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!session) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Try-on not found" });
    }
    return this.toDto(session);
  }

  async history(userId: string, query: TryOnHistoryQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { customerId: userId, deletedAt: null };
    const [total, rows] = await Promise.all([
      this.prisma.tryOnSession.count({ where }),
      this.prisma.tryOnSession.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);
    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      pageSize,
      total,
    };
  }

  async cancel(userId: string, id: string) {
    const session = await this.requireOwner(userId, id);
    if (session.status !== "QUEUED") {
      throw new BadRequestException({
        code: "NOT_CANCELLABLE",
        message: "Only queued try-ons can be cancelled.",
      });
    }
    const updated = await this.prisma.tryOnSession.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await this.prisma.tryOnUsage.updateMany({
      where: { sessionId: id },
      data: { status: "CANCELLED" },
    });
    await this.queue.removeTryOnJob(id);
    return this.toDto(updated);
  }

  async deleteForCustomer(userId: string, id: string) {
    const session = await this.requireOwner(userId, id);
    await this.purgeMedia(session, { includeResult: true });
    await this.prisma.tryOnSession.update({
      where: { id },
      data: { deletedAt: new Date(), inputImageUrl: "", resultImageUrl: null },
    });
    return { deleted: true };
  }

  private async requireOwner(userId: string, id: string) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!session) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Try-on not found" });
    }
    if (session.customerId !== userId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Not allowed" });
    }
    return session;
  }

  async processSession(sessionId: string) {
    const session = await this.prisma.tryOnSession.findUnique({ where: { id: sessionId } });
    if (!session || session.deletedAt || session.status === "CANCELLED") return;
    if (session.status === "COMPLETED" || session.status === "FAILED") return;

    const started = Date.now();
    await this.prisma.tryOnSession.update({
      where: { id: sessionId },
      data: { status: "PROCESSING" },
    });
    await this.prisma.tryOnUsage.updateMany({
      where: { sessionId },
      data: { status: "PROCESSING" },
    });

    try {
      const garmentUrl =
        (await this.redis.client.get(`tryon:garment:${sessionId}`)) ||
        (await this.resolveGarmentForProduct(session.productId));
      if (!garmentUrl) {
        throw new FashionProviderError("IMAGE_INVALID", "Missing garment image");
      }

      const run = await this.provider.virtualTryOn({
        productImageUrl: garmentUrl,
        personImageUrl: session.inputImageUrl,
        numImages: 1,
        resolution: "1k",
        generationMode: "fast",
      });

      await this.prisma.tryOnSession.update({
        where: { id: sessionId },
        data: { providerJobId: run.jobId },
      });

      const deadline = Date.now() + 300_000;
      let result = await this.provider.getJobStatus(run.jobId);
      while (
        (result.status === "starting" ||
          result.status === "in_queue" ||
          result.status === "processing") &&
        Date.now() < deadline
      ) {
        await new Promise((r) => setTimeout(r, 2500));
        result = await this.provider.getJobStatus(run.jobId);
      }

      if (result.status !== "completed" || !result.outputUrls?.[0]) {
        const code = result.error?.code ?? "PROVIDER_TIMEOUT";
        throw new FashionProviderError(code, result.error?.message ?? "Try-on failed");
      }

      const uploaded = await this.media.uploadFromUrl(
        result.outputUrls[0],
        `tryon_result_${sessionId}`,
      );

      await this.prisma.tryOnSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          resultImageUrl: uploaded.url,
          resultPublicId: uploaded.publicId ?? null,
          completedAt: new Date(),
        },
      });
      await this.prisma.tryOnUsage.updateMany({
        where: { sessionId },
        data: {
          status: "COMPLETED",
          durationMs: Date.now() - started,
          creditsUsed: result.creditsUsed ?? null,
        },
      });

      // Privacy: drop original person photo from storage unless consented
      const fresh = await this.prisma.tryOnSession.findUnique({ where: { id: sessionId } });
      if (fresh && !fresh.savePhotoConsent) {
        await this.purgeInputOnly(fresh);
      }
    } catch (err) {
      const code =
        err instanceof FashionProviderError
          ? err.code
          : err instanceof Error && /timeout/i.test(err.message)
            ? "PROVIDER_TIMEOUT"
            : "PROVIDER_UNAVAILABLE";
      const message = this.friendly(code, err instanceof Error ? err.message : undefined);
      this.logger.warn(`Try-on ${sessionId} failed: ${code}`);
      await this.prisma.tryOnSession.update({
        where: { id: sessionId },
        data: {
          status: "FAILED",
          errorCode: code,
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      await this.prisma.tryOnUsage.updateMany({
        where: { sessionId },
        data: { status: "FAILED", durationMs: Date.now() - started },
      });
    }
  }

  private async resolveGarmentForProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    return product ? this.resolveGarmentUrl(product.images) : null;
  }

  async expireDueSessions() {
    const due = await this.prisma.tryOnSession.findMany({
      where: {
        deletedAt: null,
        status: { in: ["COMPLETED", "FAILED", "CANCELLED"] },
        expiresAt: { lte: new Date() },
      },
      take: 50,
    });
    for (const s of due) {
      await this.purgeMedia(s, { includeResult: !s.savePhotoConsent });
      await this.prisma.tryOnSession.update({
        where: { id: s.id },
        data: {
          status: "EXPIRED",
          inputImageUrl: s.savePhotoConsent ? s.inputImageUrl : "",
          resultImageUrl: s.savePhotoConsent ? s.resultImageUrl : null,
        },
      });
    }
    return due.length;
  }

  private async purgeInputOnly(session: {
    id: string;
    inputPublicId: string | null;
    inputImageUrl: string;
  }) {
    if (session.inputPublicId) {
      await this.media.deleteByPublicId(session.inputPublicId).catch((err) => {
        this.logger.warn(
          `Try-on ${session.id}: input destroy failed: ${err instanceof Error ? err.message : "unknown"}`,
        );
      });
    }
    await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: { inputImageUrl: "", inputPublicId: null },
    });
  }

  private async purgeMedia(
    session: {
      id: string;
      inputPublicId: string | null;
      resultPublicId: string | null;
      inputImageUrl: string;
      resultImageUrl: string | null;
    },
    opts: { includeResult: boolean },
  ) {
    if (session.inputPublicId) {
      await this.media.deleteByPublicId(session.inputPublicId).catch((err) => {
        this.logger.warn(
          `Try-on ${session.id}: input destroy failed: ${err instanceof Error ? err.message : "unknown"}`,
        );
      });
    }
    if (opts.includeResult && session.resultPublicId) {
      await this.media.deleteByPublicId(session.resultPublicId).catch((err) => {
        this.logger.warn(
          `Try-on ${session.id}: result destroy failed: ${err instanceof Error ? err.message : "unknown"}`,
        );
      });
    }
  }

  // --- Admin ---

  async adminDashboard() {
    const [total, completed, failed, processing, queued, cancelled] = await Promise.all([
      this.prisma.tryOnSession.count({ where: { deletedAt: null } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "COMPLETED" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "FAILED" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "PROCESSING" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "QUEUED" } }),
      this.prisma.tryOnSession.count({ where: { deletedAt: null, status: "CANCELLED" } }),
    ]);
    const usage = await this.prisma.tryOnUsage.findMany({
      where: { status: "COMPLETED", durationMs: { not: null } },
      take: 200,
      orderBy: { createdAt: "desc" },
    });
    const avgMs =
      usage.length === 0
        ? 0
        : Math.round(usage.reduce((s, u) => s + (u.durationMs ?? 0), 0) / usage.length);
    const top = await this.prisma.tryOnSession.groupBy({
      by: ["productId"],
      where: { deletedAt: null },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: top.map((t) => t.productId) } },
      select: { id: true, name: true, slug: true },
    });
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    return {
      counts: { total, completed, failed, processing, queued, cancelled },
      averageProcessingMs: avgMs,
      topProducts: top.map((t) => ({
        productId: t.productId,
        count: t._count.productId,
        product: byId[t.productId] ?? null,
      })),
    };
  }

  async adminList(opts: { status?: string; page?: number; pageSize?: number }) {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 30;
    const where = {
      deletedAt: null,
      ...(opts.status ? { status: opts.status } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.tryOnSession.count({ where }),
      this.prisma.tryOnSession.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          customer: { select: { id: true, email: true, mobile: true } },
        },
      }),
    ]);
    return { items: rows.map((r) => this.toDto(r)), page, pageSize, total };
  }

  async adminRetry(id: string) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!session) throw new NotFoundException({ code: "NOT_FOUND", message: "Not found" });
    if (session.status !== "FAILED") {
      throw new BadRequestException({
        code: "NOT_RETRYABLE",
        message: "Only failed sessions can be retried",
      });
    }
    await this.prisma.tryOnSession.update({
      where: { id },
      data: { status: "QUEUED", errorCode: null, errorMessage: null },
    });
    await this.queue.enqueueTryOn({ tryOnSessionId: id });
    return this.getAdminSession(id);
  }

  async adminCancel(id: string) {
    const session = await this.prisma.tryOnSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!session) throw new NotFoundException({ code: "NOT_FOUND", message: "Not found" });
    if (session.status !== "QUEUED") {
      throw new BadRequestException({
        code: "NOT_CANCELLABLE",
        message: "Only queued sessions can be cancelled",
      });
    }
    await this.prisma.tryOnSession.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await this.queue.removeTryOnJob(id);
    return this.getAdminSession(id);
  }

  async adminDelete(id: string) {
    const session = await this.prisma.tryOnSession.findFirst({ where: { id } });
    if (!session) throw new NotFoundException({ code: "NOT_FOUND", message: "Not found" });
    await this.purgeMedia(session, { includeResult: true });
    await this.prisma.tryOnSession.update({
      where: { id },
      data: { deletedAt: new Date(), inputImageUrl: "", resultImageUrl: null },
    });
    return { deleted: true };
  }

  private async getAdminSession(id: string) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        customer: { select: { id: true, email: true, mobile: true } },
      },
    });
    if (!session) throw new NotFoundException({ code: "NOT_FOUND", message: "Not found" });
    return this.toDto(session);
  }

  private toDto(session: {
    id: string;
    customerId: string;
    productId: string;
    variantId: string | null;
    inputImageUrl: string;
    resultImageUrl: string | null;
    status: string;
    provider: string;
    providerJobId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    savePhotoConsent: boolean;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
    product?: { id: string; name: string; slug: string } | null;
    customer?: { id: string; email: string | null; mobile: string | null } | null;
  }) {
    const expired =
      session.status === "EXPIRED" ||
      (session.expiresAt != null && session.expiresAt.getTime() < Date.now());
    return {
      id: session.id,
      customerId: session.customerId,
      productId: session.productId,
      variantId: session.variantId,
      // Never expose input after privacy clear / expiry to clients that shouldn't see it
      inputImageUrl:
        session.status === "EXPIRED" || !session.inputImageUrl
          ? null
          : session.inputImageUrl || null,
      resultImageUrl: expired && session.status === "EXPIRED" ? null : session.resultImageUrl,
      status: expired && session.status === "COMPLETED" ? "EXPIRED" : session.status,
      provider: session.provider,
      providerJobId: session.providerJobId,
      errorCode: session.errorCode,
      errorMessage: session.errorMessage,
      savePhotoConsent: session.savePhotoConsent,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      completedAt: session.completedAt,
      expiresAt: session.expiresAt,
      product: session.product ?? undefined,
      customer: session.customer ?? undefined,
      expiredMessage: expired ? "This try-on has expired." : undefined,
    };
  }
}
