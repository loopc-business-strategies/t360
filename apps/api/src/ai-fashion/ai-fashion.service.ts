import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  AiFashionGenerateInput,
  AiFashionModelCreateInput,
  AiFashionModelGenerateInput,
  AiFashionModelUpdateInput,
  AiFashionSettingsUpdateInput,
  AiFashionJobsQuery,
} from "@t360/validation";
import { PrismaService } from "../prisma/prisma.service";
import { MEDIA_STORAGE, MediaStorage } from "../media/media-storage";
import { AuditService } from "../audit/audit.service";
import {
  FASHION_AI_PROVIDER,
  FashionAIProvider,
  FashionProviderError,
} from "./providers/fashion-ai-provider";
import { AiFashionQueueService } from "./ai-fashion-queue.service";
import { NotificationsService } from "../notifications/notifications.service";

const DEFAULT_PROMPT =
  "Professional ecommerce fashion photography. The model is wearing the provided product exactly. Preserve the product's original colour, pattern, design, logos, collar, buttons, sleeves and overall appearance. Natural realistic fit. Clean professional composition.";

const POSE_PROMPTS: Record<string, string> = {
  standing: "standing pose, full body, facing camera",
  casual: "casual relaxed pose",
  fashion: "editorial fashion pose",
  custom: "",
};

const BG_PROMPTS: Record<string, string> = {
  studio: "clean studio background",
  white: "plain white background",
  outdoor: "soft outdoor natural light background",
  custom: "",
};

type FashionConfig = {
  defaultNumImages: number;
  defaultModelId: string | null;
  autoGenerateOnCreate: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  defaultResolution: "1k" | "2k" | "4k";
  defaultGenerationMode: "fast" | "balanced" | "quality";
  maintenanceMode: boolean;
  productToModelEnabled: boolean;
  virtualTryOnEnabled: boolean;
  modelCreationEnabled: boolean;
  requireApproval: boolean;
  maxImagesPerJob: number;
  maxConcurrentJobs: number;
};

const DEFAULT_CONFIG: FashionConfig = {
  defaultNumImages: 1,
  defaultModelId: null,
  autoGenerateOnCreate: false,
  dailyLimit: 50,
  monthlyLimit: 500,
  defaultResolution: "1k",
  defaultGenerationMode: "balanced",
  maintenanceMode: false,
  productToModelEnabled: true,
  virtualTryOnEnabled: true,
  modelCreationEnabled: true,
  requireApproval: true,
  maxImagesPerJob: 4,
  maxConcurrentJobs: 6,
};

@Injectable()
export class AiFashionService {
  private readonly logger = new Logger(AiFashionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly queue: AiFashionQueueService,
    @Inject(FASHION_AI_PROVIDER) private readonly provider: FashionAIProvider,
    @Inject(MEDIA_STORAGE) private readonly media: MediaStorage,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async getDashboard() {
    const [queued, processing, completed, failed, models, recent] = await Promise.all([
      this.prisma.aiGeneratedImage.count({ where: { status: "QUEUED" } }),
      this.prisma.aiGeneratedImage.count({ where: { status: "PROCESSING" } }),
      this.prisma.aiGeneratedImage.count({ where: { status: "COMPLETED" } }),
      this.prisma.aiGeneratedImage.count({ where: { status: "FAILED" } }),
      this.prisma.aiFashionModel.count({ where: { isActive: true } }),
      this.prisma.aiGeneratedImage.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
        },
      }),
    ]);
    const settings = await this.getSettings();
    return {
      counts: { queued, processing, completed, failed, activeModels: models },
      provider: settings.provider,
      apiKeyConfigured: settings.apiKeyConfigured,
      enabled: settings.enabled,
      recent,
    };
  }

  async getSettings() {
    const enabledRow = await this.prisma.systemSetting.findUnique({
      where: { key: "ai.fashion.enabled" },
    });
    const config = await this.readConfig();
    const providerName = process.env.FASHION_AI_PROVIDER?.trim() || "disabled";
    return {
      provider: providerName,
      apiKeyConfigured: this.provider.isConfigured(),
      enabled: enabledRow?.value === true || enabledRow?.value === "true",
      ...config,
    };
  }

  async updateSettings(input: AiFashionSettingsUpdateInput, actorId?: string) {
    if (input.enabled !== undefined) {
      await this.prisma.systemSetting.upsert({
        where: { key: "ai.fashion.enabled" },
        create: { key: "ai.fashion.enabled", value: input.enabled },
        update: { value: input.enabled },
      });
      await this.prisma.systemSetting.upsert({
        where: { key: "feature.ai_fashion.enabled" },
        create: { key: "feature.ai_fashion.enabled", value: input.enabled },
        update: { value: input.enabled },
      });
    }

    const current = await this.readConfig();
    const next: FashionConfig = {
      defaultNumImages: input.defaultNumImages ?? current.defaultNumImages,
      defaultModelId:
        input.defaultModelId === undefined ? current.defaultModelId : input.defaultModelId,
      autoGenerateOnCreate: input.autoGenerateOnCreate ?? current.autoGenerateOnCreate,
      dailyLimit: input.dailyLimit ?? current.dailyLimit,
      monthlyLimit: input.monthlyLimit ?? current.monthlyLimit,
      defaultResolution: input.defaultResolution ?? current.defaultResolution,
      defaultGenerationMode: input.defaultGenerationMode ?? current.defaultGenerationMode,
      maintenanceMode: input.maintenanceMode ?? current.maintenanceMode,
      productToModelEnabled: input.productToModelEnabled ?? current.productToModelEnabled,
      virtualTryOnEnabled: input.virtualTryOnEnabled ?? current.virtualTryOnEnabled,
      modelCreationEnabled: input.modelCreationEnabled ?? current.modelCreationEnabled,
      requireApproval: input.requireApproval ?? current.requireApproval,
      maxImagesPerJob: input.maxImagesPerJob ?? current.maxImagesPerJob,
      maxConcurrentJobs: input.maxConcurrentJobs ?? current.maxConcurrentJobs,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: "ai.fashion.config" },
      create: { key: "ai.fashion.config", value: next },
      update: { value: next },
    });

    await this.audit.log({
      actorId,
      action: "ai_fashion.settings.update",
      entityType: "SystemSetting",
      metadata: { keys: Object.keys(input) },
    });

    return this.getSettings();
  }

  async getUsage(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.prisma.aiFashionUsage.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const creditsUsed = rows.reduce((sum, r) => sum + (r.creditsUsed ?? 0), 0);
    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    return { since: since.toISOString(), total: rows.length, creditsUsed, byStatus, items: rows };
  }

  // --- Models ---

  async listModels(opts?: { activeOnly?: boolean }) {
    return this.prisma.aiFashionModel.findMany({
      where: opts?.activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async getModel(id: string) {
    const model = await this.prisma.aiFashionModel.findUnique({ where: { id } });
    if (!model) {
      throw new NotFoundException({ code: "MODEL_NOT_FOUND", message: "AI fashion model not found" });
    }
    return model;
  }

  async createModel(input: AiFashionModelCreateInput, actorId?: string) {
    const asset = await this.media.uploadFromUrl(
      input.imageUrl,
      `t360/ai-fashion/models/${Date.now()}`,
    );
    const model = await this.prisma.aiFashionModel.create({
      data: {
        name: input.name,
        gender: input.gender,
        ageRange: input.ageRange ?? null,
        style: input.style ?? null,
        bodyType: input.bodyType ?? null,
        skinTone: input.skinTone ?? null,
        hairStyle: input.hairStyle ?? null,
        imageUrl: asset.url,
        publicId: asset.publicId,
        provider: input.provider ?? "fashn",
        providerModelId: input.providerModelId ?? null,
        isActive: input.isActive ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: "ai_fashion.model.create",
      entityType: "AiFashionModel",
      entityId: model.id,
    });
    return model;
  }

  async updateModel(id: string, input: AiFashionModelUpdateInput, actorId?: string) {
    await this.getModel(id);
    let imageUrl = input.imageUrl;
    let publicId: string | undefined;
    if (input.imageUrl) {
      const asset = await this.media.uploadFromUrl(
        input.imageUrl,
        `t360/ai-fashion/models/${id}`,
      );
      imageUrl = asset.url;
      publicId = asset.publicId;
    }
    const model = await this.prisma.aiFashionModel.update({
      where: { id },
      data: {
        name: input.name,
        gender: input.gender,
        ageRange: input.ageRange === undefined ? undefined : input.ageRange,
        style: input.style === undefined ? undefined : input.style,
        bodyType: input.bodyType === undefined ? undefined : input.bodyType,
        skinTone: input.skinTone === undefined ? undefined : input.skinTone,
        hairStyle: input.hairStyle === undefined ? undefined : input.hairStyle,
        imageUrl,
        publicId,
        provider: input.provider,
        providerModelId: input.providerModelId === undefined ? undefined : input.providerModelId,
        isActive: input.isActive,
      },
    });
    await this.audit.log({
      actorId,
      action: "ai_fashion.model.update",
      entityType: "AiFashionModel",
      entityId: id,
    });
    return model;
  }

  async deleteModel(id: string, actorId?: string) {
    await this.getModel(id);
    await this.prisma.aiFashionModel.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: "ai_fashion.model.delete",
      entityType: "AiFashionModel",
      entityId: id,
    });
    return { deleted: true };
  }

  async generateModel(input: AiFashionModelGenerateInput, userId: string) {
    await this.assertReady("MODEL_CREATED");
    await this.assertWithinLimits(userId);

    const prompt = this.buildModelCreatePrompt(input);
    const config = await this.readConfig();
    const job = await this.prisma.aiGeneratedImage.create({
      data: {
        type: "MODEL_CREATED",
        status: "QUEUED",
        inputImageUrl: "model-create://pending",
        provider: this.provider.name,
        prompt,
        params: {
          gender: input.gender,
          ageRange: input.ageRange,
          style: input.style,
          bodyType: input.bodyType,
          skinTone: input.skinTone,
          hairStyle: input.hairStyle,
          saveToLibrary: input.saveToLibrary ?? false,
          modelName: input.name,
          numImages: input.numImages ?? config.defaultNumImages,
          resolution: input.resolution ?? config.defaultResolution,
          generationMode: input.generationMode ?? config.defaultGenerationMode,
        } as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });

    await this.prisma.aiGeneratedImage.update({
      where: { id: job.id },
      data: { inputImageUrl: `model-create://${job.id}` },
    });

    await this.prisma.aiFashionUsage.create({
      data: {
        provider: this.provider.name,
        generationType: "MODEL_CREATED",
        userId,
        jobId: job.id,
        status: "QUEUED",
      },
    });

    await this.queue.enqueue({ generatedImageId: job.id });
    return this.getJob(job.id);
  }

  // --- Jobs ---

  async generate(input: AiFashionGenerateInput, userId: string) {
    await this.assertReady(input.type ?? "PRODUCT_TO_MODEL");
    await this.assertWithinLimits(userId);

    const config = await this.readConfig();
    const requestedImages = input.numImages ?? config.defaultNumImages;
    if (requestedImages > config.maxImagesPerJob) {
      throw new BadRequestException({
        code: "MAX_IMAGES",
        message: `Maximum images per job is ${config.maxImagesPerJob}`,
      });
    }

    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) {
      throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Product not found" });
    }

    let inputImageUrl = input.inputImageUrl;
    if (input.productImageId) {
      const img = product.images.find((i) => i.id === input.productImageId);
      if (!img) {
        throw new BadRequestException({
          code: "IMAGE_NOT_FOUND",
          message: "Product image not found on this product",
        });
      }
      inputImageUrl = img.url;
    }
    if (!inputImageUrl) {
      if (!product.images[0]) {
        throw new BadRequestException({
          code: "IMAGE_REQUIRED",
          message: "Product has no images. Upload a product image first.",
        });
      }
      inputImageUrl = product.images[0].url;
    }

    const validation = this.validateImageUrl(inputImageUrl);
    if (!validation.ok) {
      throw new BadRequestException({ code: validation.code, message: validation.message });
    }

    if (input.type === "VIRTUAL_TRY_ON" && !input.personImageUrl) {
      throw new BadRequestException({
        code: "PERSON_IMAGE_REQUIRED",
        message: "personImageUrl is required for virtual try-on",
      });
    }

    let modelId = input.modelId ?? null;
    let modelImageUrl: string | undefined;
    if (modelId) {
      const model = await this.getModel(modelId);
      if (!model.isActive) {
        throw new BadRequestException({
          code: "MODEL_INACTIVE",
          message: "Selected AI model is inactive",
        });
      }
      modelImageUrl = model.imageUrl;
    }

    const duplicate = await this.prisma.aiGeneratedImage.findFirst({
      where: {
        productId: product.id,
        inputImageUrl,
        type: input.type,
        modelId,
        status: { in: ["QUEUED", "PROCESSING"] },
      },
    });
    if (duplicate) {
      throw new ConflictException({
        code: "DUPLICATE_GENERATION",
        message: "A generation is already in progress for this product image and model",
        jobId: duplicate.id,
      });
    }

    const prompt = this.buildProductPrompt(input);
    const job = await this.prisma.aiGeneratedImage.create({
      data: {
        productId: product.id,
        modelId,
        type: input.type,
        status: "QUEUED",
        inputImageUrl,
        personImageUrl: input.personImageUrl ?? null,
        provider: this.provider.name,
        prompt,
        params: {
          gender: input.gender,
          pose: input.pose,
          background: input.background,
          numImages: requestedImages,
          resolution: input.resolution ?? config.defaultResolution,
          generationMode: input.generationMode ?? config.defaultGenerationMode,
          modelImageUrl,
          qualityWarning: validation.warning,
        } as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });

    await this.prisma.aiFashionUsage.create({
      data: {
        provider: this.provider.name,
        generationType: input.type,
        productId: product.id,
        userId,
        jobId: job.id,
        status: "QUEUED",
      },
    });

    await this.queue.enqueue({ generatedImageId: job.id });
    await this.audit.log({
      actorId: userId,
      action: "ai_fashion.generate",
      entityType: "AiGeneratedImage",
      entityId: job.id,
      metadata: { productId: product.id, type: input.type },
    });

    const result = await this.getJob(job.id);
    return {
      ...result,
      warning: validation.warning,
    };
  }

  /** Fire-and-forget helper for product create when generateAiFashion is requested or autoGenerateOnCreate is on */
  async maybeEnqueueOnProductCreate(productId: string, userId: string, force: boolean) {
    try {
      const settings = await this.getSettings();
      if (!force && !settings.autoGenerateOnCreate) return;
      if (!settings.apiKeyConfigured) {
        this.logger.warn(`Skip auto AI Fashion for ${productId}: provider not configured`);
        return;
      }
      if (!settings.enabled && force) {
        await this.prisma.systemSetting.upsert({
          where: { key: "ai.fashion.enabled" },
          create: { key: "ai.fashion.enabled", value: true },
          update: { value: true },
        });
      } else if (!settings.enabled) {
        return;
      }

      const product = await this.prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      if (!product?.images[0]) return;

      await this.generate(
        {
          productId,
          inputImageUrl: product.images[0].url,
          type: "PRODUCT_TO_MODEL",
          modelId: settings.defaultModelId,
          numImages: settings.defaultNumImages,
          resolution: settings.defaultResolution,
          generationMode: settings.defaultGenerationMode,
        },
        userId,
      );
    } catch (err) {
      this.logger.warn(
        `Auto AI Fashion enqueue failed for product ${productId}: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  async listJobs(query: AiFashionJobsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.AiGeneratedImageWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.aiGeneratedImage.count({ where }),
      this.prisma.aiGeneratedImage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          model: { select: { id: true, name: true, gender: true } },
        },
      }),
    ]);
    return {
      items: items.map((j) => this.sanitizeJob(j)),
      meta: { page, pageSize, total },
    };
  }

  async getJob(id: string) {
    const job = await this.prisma.aiGeneratedImage.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        model: { select: { id: true, name: true, gender: true, imageUrl: true } },
      },
    });
    if (!job) {
      throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Generation job not found" });
    }
    return this.sanitizeJob(job);
  }

  async retryJob(id: string, userId: string) {
    const job = await this.prisma.aiGeneratedImage.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Generation job not found" });
    }
    if (job.status !== "FAILED" && job.status !== "CANCELLED") {
      throw new BadRequestException({
        code: "RETRY_NOT_ALLOWED",
        message: "Only failed or cancelled jobs can be retried",
      });
    }
    await this.assertReady(
      job.type as "PRODUCT_TO_MODEL" | "VIRTUAL_TRY_ON" | "MODEL_CREATED",
    );
    await this.assertWithinLimits(userId);

    await this.prisma.aiGeneratedImage.update({
      where: { id },
      data: {
        status: "QUEUED",
        error: null,
        errorDetail: null,
        outputImageUrl: null,
        outputPublicId: null,
        providerJobId: null,
        completedAt: null,
        approvedAt: null,
        approvedAs: null,
      },
    });
    await this.prisma.aiFashionUsage.updateMany({
      where: { jobId: id },
      data: { status: "QUEUED", creditsUsed: null },
    });
    await this.queue.enqueue({ generatedImageId: id });
    return this.getJob(id);
  }

  async approveJob(id: string, as: "primary" | "gallery", userId: string) {
    const job = await this.prisma.aiGeneratedImage.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Generation job not found" });
    }
    if (job.status !== "COMPLETED" || !job.outputImageUrl) {
      throw new BadRequestException({
        code: "NOT_READY",
        message: "Only completed generations with an output image can be approved",
      });
    }
    if (!job.productId) {
      // MODEL_CREATED → save to library instead
      if (job.type === "MODEL_CREATED") {
        const params = (job.params ?? {}) as Record<string, unknown>;
        const model = await this.prisma.aiFashionModel.create({
          data: {
            name: (params.modelName as string) || `Generated Model ${job.id.slice(0, 8)}`,
            gender: (params.gender as string) || "unisex",
            ageRange: (params.ageRange as string) || null,
            style: (params.style as string) || null,
            bodyType: (params.bodyType as string) || null,
            skinTone: (params.skinTone as string) || null,
            hairStyle: (params.hairStyle as string) || null,
            imageUrl: job.outputImageUrl,
            publicId: job.outputPublicId,
            provider: job.provider,
            providerModelId: job.providerJobId,
            isActive: true,
          },
        });
        await this.prisma.aiGeneratedImage.update({
          where: { id },
          data: { approvedAt: new Date(), approvedAs: "gallery", modelId: model.id },
        });
        return { model, job: await this.getJob(id) };
      }
      throw new BadRequestException({
        code: "NO_PRODUCT",
        message: "This generation is not linked to a product",
      });
    }

    if (as === "primary") {
      const images = await this.prisma.productImage.findMany({
        where: { productId: job.productId },
        orderBy: { sortOrder: "asc" },
      });
      await this.prisma.$transaction(
        images.map((img, idx) =>
          this.prisma.productImage.update({
            where: { id: img.id },
            data: { sortOrder: idx + 1 },
          }),
        ),
      );
    }

    const imageCount = await this.prisma.productImage.count({
      where: { productId: job.productId },
    });
    const sortOrder = as === "primary" ? 0 : imageCount;
    const productImage = await this.prisma.productImage.create({
      data: {
        productId: job.productId,
        url: job.outputImageUrl,
        publicId: job.outputPublicId,
        alt: "AI Fashion",
        sortOrder,
      },
    });

    await this.prisma.aiGeneratedImage.update({
      where: { id },
      data: { approvedAt: new Date(), approvedAs: as },
    });

    await this.audit.log({
      actorId: userId,
      action: "ai_fashion.approve",
      entityType: "AiGeneratedImage",
      entityId: id,
      metadata: { as, productImageId: productImage.id },
    });

    return { productImage, job: await this.getJob(id) };
  }

  async deleteJob(id: string, userId: string) {
    const job = await this.prisma.aiGeneratedImage.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Generation job not found" });
    }
    if (job.status === "QUEUED" || job.status === "PROCESSING") {
      await this.prisma.aiGeneratedImage.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      await this.prisma.aiFashionUsage.updateMany({
        where: { jobId: id },
        data: { status: "CANCELLED" },
      });
      await this.queue.removeJobByGeneratedImageId(id).catch(() => undefined);
    } else {
      await this.prisma.aiGeneratedImage.delete({ where: { id } });
    }
    await this.audit.log({
      actorId: userId,
      action: "ai_fashion.job.delete",
      entityType: "AiGeneratedImage",
      entityId: id,
    });
    return { deleted: true };
  }

  // --- Worker processing ---

  async processJob(generatedImageId: string) {
    const job = await this.prisma.aiGeneratedImage.findUnique({
      where: { id: generatedImageId },
      include: { model: true },
    });
    if (!job) return;
    if (job.status === "CANCELLED" || job.status === "COMPLETED") return;

    await this.prisma.aiGeneratedImage.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });
    await this.prisma.aiFashionUsage.updateMany({
      where: { jobId: job.id },
      data: { status: "PROCESSING" },
    });

    const params = (job.params ?? {}) as Record<string, unknown>;
    const numImages = Number(params.numImages ?? 1);
    const resolution = (params.resolution as "1k" | "2k" | "4k") || "1k";
    const generationMode =
      (params.generationMode as "fast" | "balanced" | "quality") || undefined;

    try {
      let run: { jobId: string };
      if (job.type === "MODEL_CREATED") {
        run = await this.provider.createModel({
          prompt: job.prompt || "Full body fashion model, studio lighting",
          numImages,
          resolution,
          generationMode,
        });
      } else if (job.type === "VIRTUAL_TRY_ON") {
        if (!job.personImageUrl) {
          throw new FashionProviderError("IMAGE_INVALID", "Person image is required");
        }
        run = await this.provider.virtualTryOn({
          productImageUrl: job.inputImageUrl,
          personImageUrl: job.personImageUrl,
          prompt: job.prompt ?? undefined,
          numImages,
          resolution,
          generationMode,
        });
      } else {
        const modelImageUrl =
          job.model?.imageUrl || (params.modelImageUrl as string | undefined);
        run = await this.provider.productToModel({
          productImageUrl: job.inputImageUrl,
          modelImageUrl,
          prompt: job.prompt ?? undefined,
          numImages,
          resolution,
          generationMode,
        });
      }

      await this.prisma.aiGeneratedImage.update({
        where: { id: job.id },
        data: { providerJobId: run.jobId },
      });

      const status = await this.pollProvider(run.jobId);
      if (status.status !== "completed" || !status.outputUrls?.[0]) {
        throw new FashionProviderError(
          status.error?.code ?? "GENERATION_FAILED",
          status.error?.message ?? "AI generation failed. Please try again.",
        );
      }

      const folder = job.productId
        ? `t360/products/${job.productId}/ai-fashion/${job.id}`
        : `t360/ai-fashion/models/${job.id}`;
      const asset = await this.media.uploadFromUrl(status.outputUrls[0], folder);

      await this.prisma.aiGeneratedImage.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          outputImageUrl: asset.url,
          outputPublicId: asset.publicId,
          completedAt: new Date(),
          error: null,
          errorDetail: null,
        },
      });
      await this.prisma.aiFashionUsage.updateMany({
        where: { jobId: job.id },
        data: {
          status: "COMPLETED",
          creditsUsed: status.creditsUsed ?? null,
        },
      });

      // Auto-save model to library when requested
      if (job.type === "MODEL_CREATED" && params.saveToLibrary) {
        await this.approveJob(job.id, "gallery", job.createdBy);
      } else if (job.productId && job.type !== "MODEL_CREATED") {
        const settings = await this.getSettings();
        if (!settings.requireApproval) {
          await this.approveJob(job.id, "gallery", job.createdBy);
        }
      }

      await this.notifyCreator(job.createdBy, "ai_fashion.completed", {
        jobId: job.id,
        productId: job.productId ?? undefined,
        type: job.type,
      });
    } catch (err) {
      const code =
        err instanceof FashionProviderError ? err.code : "GENERATION_FAILED";
      const message =
        err instanceof FashionProviderError
          ? err.message
          : "AI generation failed. Please try again.";
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job ${job.id} failed: ${code}`);
      await this.prisma.aiGeneratedImage.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: message,
          errorDetail: detail.slice(0, 2000),
          completedAt: new Date(),
        },
      });
      await this.prisma.aiFashionUsage.updateMany({
        where: { jobId: job.id },
        data: { status: "FAILED" },
      });
      await this.notifyCreator(job.createdBy, "ai_fashion.failed", {
        jobId: job.id,
        productId: job.productId ?? undefined,
        type: job.type,
        error: message,
      });
      throw err;
    }
  }

  private async notifyCreator(
    userId: string,
    eventCode: string,
    data: Record<string, string | number | undefined>,
  ) {
    if (!this.notifications) return;
    try {
      await this.notifications.dispatch({ userId, eventCode, data });
    } catch (err) {
      this.logger.warn(
        `AI Fashion notify failed: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  private async pollProvider(providerJobId: string, maxMs = 300_000) {
    const start = Date.now();
    let delay = 2000;
    while (Date.now() - start < maxMs) {
      const status = await this.provider.getJobStatus(providerJobId);
      if (status.status === "completed" || status.status === "failed") {
        return status;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay + 1000, 8000);
    }
    throw new FashionProviderError("TIMEOUT", "AI generation timed out. Please try again.");
  }

  private async assertReady(mode?: "PRODUCT_TO_MODEL" | "VIRTUAL_TRY_ON" | "MODEL_CREATED") {
    const enabledRow = await this.prisma.systemSetting.findUnique({
      where: { key: "ai.fashion.enabled" },
    });
    const enabled = enabledRow?.value === true || enabledRow?.value === "true";
    if (!enabled) {
      throw new ServiceUnavailableException({
        code: "AI_FASHION_DISABLED",
        message: "AI Fashion is temporarily unavailable.",
      });
    }
    const config = await this.readConfig();
    if (config.maintenanceMode) {
      throw new ServiceUnavailableException({
        code: "AI_FASHION_MAINTENANCE",
        message: "AI Fashion is temporarily unavailable.",
      });
    }
    if (!this.provider.isConfigured()) {
      throw new ServiceUnavailableException({
        code: "PROVIDER_UNAVAILABLE",
        message:
          "AI generation is not configured. Set FASHION_AI_PROVIDER=fashn and FASHN_API_KEY on the server.",
      });
    }
    if (mode === "PRODUCT_TO_MODEL" && !config.productToModelEnabled) {
      throw new BadRequestException({
        code: "MODE_DISABLED",
        message: "Product to Model generation is disabled.",
      });
    }
    if (mode === "VIRTUAL_TRY_ON" && !config.virtualTryOnEnabled) {
      throw new BadRequestException({
        code: "MODE_DISABLED",
        message: "Virtual Try-On is disabled.",
      });
    }
    if (mode === "MODEL_CREATED" && !config.modelCreationEnabled) {
      throw new BadRequestException({
        code: "MODE_DISABLED",
        message: "AI Model creation is disabled.",
      });
    }

    const concurrent = await this.prisma.aiGeneratedImage.count({
      where: { status: { in: ["QUEUED", "PROCESSING"] } },
    });
    if (concurrent >= config.maxConcurrentJobs) {
      throw new BadRequestException({
        code: "CONCURRENT_LIMIT",
        message: "AI generation limit reached. Please contact the administrator.",
      });
    }
  }

  /** Mark stuck QUEUED/PROCESSING jobs as FAILED (idempotent). */
  async failStaleJobs(maxAgeMinutes = 20) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const result = await this.prisma.aiGeneratedImage.updateMany({
      where: {
        status: { in: ["QUEUED", "PROCESSING"] },
        updatedAt: { lt: cutoff },
      },
      data: {
        status: "FAILED",
        error: "Job timed out or stalled. Please retry.",
        errorDetail: "STALE_JOB_SWEEP",
        completedAt: new Date(),
      },
    });
    if (result.count > 0) {
      await this.prisma.aiFashionUsage.updateMany({
        where: {
          status: { in: ["QUEUED", "PROCESSING"] },
          createdAt: { lt: cutoff },
        },
        data: { status: "FAILED" },
      });
      this.logger.warn(`Marked ${result.count} stale AI Fashion job(s) as FAILED`);
    }
    return result.count;
  }

  private async assertWithinLimits(userId: string) {
    const config = await this.readConfig();
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [daily, monthly] = await Promise.all([
      this.prisma.aiFashionUsage.count({
        where: {
          userId,
          createdAt: { gte: dayStart },
          status: { not: "CANCELLED" },
        },
      }),
      this.prisma.aiFashionUsage.count({
        where: {
          userId,
          createdAt: { gte: monthStart },
          status: { not: "CANCELLED" },
        },
      }),
    ]);

    if (config.dailyLimit > 0 && daily >= config.dailyLimit) {
      throw new BadRequestException({
        code: "DAILY_LIMIT",
        message: "AI generation limit reached. Please contact the administrator.",
      });
    }
    if (config.monthlyLimit > 0 && monthly >= config.monthlyLimit) {
      throw new BadRequestException({
        code: "MONTHLY_LIMIT",
        message: "AI generation limit reached. Please contact the administrator.",
      });
    }
  }

  private async readConfig(): Promise<FashionConfig> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: "ai.fashion.config" },
    });
    if (!row?.value || typeof row.value !== "object" || Array.isArray(row.value)) {
      return DEFAULT_CONFIG;
    }
    return { ...DEFAULT_CONFIG, ...(row.value as Partial<FashionConfig>) };
  }

  private validateImageUrl(url: string): {
    ok: boolean;
    code?: string;
    message?: string;
    warning?: string;
  } {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { ok: false, code: "IMAGE_INVALID", message: "Image URL must be http(s)" };
      }
    } catch {
      return { ok: false, code: "IMAGE_INVALID", message: "Invalid image URL" };
    }

    const lower = url.toLowerCase();
    const supported = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const hasExt = supported.some((ext) => lower.includes(ext));
    const warning = hasExt
      ? undefined
      : "This image may produce poor AI results. Use a clear front-facing product image with good lighting.";

    return { ok: true, warning };
  }

  private buildProductPrompt(input: AiFashionGenerateInput): string {
    const parts = [DEFAULT_PROMPT];
    if (input.gender && input.gender !== "unisex") {
      parts.push(`The model is ${input.gender}.`);
    }
    if (input.pose && POSE_PROMPTS[input.pose]) parts.push(POSE_PROMPTS[input.pose]);
    if (input.background && BG_PROMPTS[input.background]) {
      parts.push(BG_PROMPTS[input.background]);
    }
    if (input.customPrompt) parts.push(input.customPrompt);
    return parts.filter(Boolean).join(" ");
  }

  private buildModelCreatePrompt(input: AiFashionModelGenerateInput): string {
    const bits = [
      "Full body shot of a fashion model",
      input.gender !== "unisex" ? input.gender : undefined,
      input.ageRange ? `age ${input.ageRange}` : undefined,
      input.bodyType ? `${input.bodyType} body type` : undefined,
      input.skinTone ? `${input.skinTone} skin tone` : undefined,
      input.hairStyle ? `${input.hairStyle} hair` : undefined,
      input.style ? `${input.style} style` : undefined,
      "wearing a plain neutral t-shirt and dark trousers",
      "studio lighting, ecommerce look",
    ];
    return bits.filter(Boolean).join(", ");
  }

  private sanitizeJob<T extends { errorDetail?: string | null }>(job: T) {
    const { errorDetail: _detail, ...rest } = job;
    return rest;
  }
}
