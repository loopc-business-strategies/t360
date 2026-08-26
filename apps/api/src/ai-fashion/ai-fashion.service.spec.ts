import { BadRequestException, ConflictException } from "@nestjs/common";
import { AiFashionService } from "./ai-fashion.service";
import { MockFashionAiProvider } from "./providers/mock-fashion.provider";

function createService(overrides?: {
  prisma?: Partial<Record<string, unknown>>;
  queue?: { enqueue: jest.Mock };
  provider?: MockFashionAiProvider;
}) {
  const provider = overrides?.provider ?? new MockFashionAiProvider();
  const queue = overrides?.queue ?? { enqueue: jest.fn().mockResolvedValue({ id: "q1" }) };
  const prisma = {
    systemSetting: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { key: string } }) => {
        if (where.key === "ai.fashion.enabled") return { value: true };
        if (where.key === "ai.fashion.config") {
          return {
            value: {
              defaultNumImages: 1,
              defaultModelId: null,
              autoGenerateOnCreate: false,
              dailyLimit: 20,
              monthlyLimit: 200,
              defaultResolution: "1k",
              defaultGenerationMode: "fast",
              videoEnabled: false,
            },
          };
        }
        return null;
      }),
      upsert: jest.fn(),
    },
    product: {
      findFirst: jest.fn().mockResolvedValue({
        id: "prod-1",
        deletedAt: null,
        images: [{ id: "img-1", url: "https://cdn.example.com/shirt.jpg", sortOrder: 0, mediaType: "image" }],
      }),
    },
    aiFashionModel: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    aiGeneratedImage: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          status: "QUEUED",
          type: "PRODUCT_TO_MODEL",
          productId: "prod-1",
          errorDetail: "secret",
          product: { id: "prod-1", name: "Shirt" },
          model: null,
        }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "job-1",
        status: "QUEUED",
        type: "PRODUCT_TO_MODEL",
        productId: "prod-1",
      }),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      delete: jest.fn(),
    },
    aiFashionUsage: {
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    productImage: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: "pi-1" }),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (ops: unknown) => ops),
    ...overrides?.prisma,
  };

  const audit = { log: jest.fn() };
  const media = {
    uploadFromUrl: jest.fn().mockResolvedValue({
      url: "https://res.cloudinary.com/demo/ai.png",
      publicId: "t360/ai",
    }),
    deleteByPublicId: jest.fn().mockResolvedValue({ deleted: true }),
  };

  const service = new AiFashionService(
    prisma as never,
    audit as never,
    queue as never,
    provider,
    media as never,
  );

  return { service, prisma, queue, provider, media, audit };
}

describe("AiFashionService", () => {
  it("rejects when provider not configured", async () => {
    const { service, prisma } = createService({
      provider: Object.assign(new MockFashionAiProvider(), {
        isConfigured: () => false,
        name: "disabled",
      }) as MockFashionAiProvider,
    });
    // override isConfigured via disabled-like provider
    (service as unknown as { provider: { isConfigured: () => boolean } }).provider = {
      isConfigured: () => false,
      name: "disabled",
    } as never;

    prisma.systemSetting.findUnique = jest.fn().mockResolvedValue({ value: true });

    await expect(
      service.generate(
        {
          productId: "prod-1",
          type: "PRODUCT_TO_MODEL",
        },
        "user-1",
      ),
    ).rejects.toMatchObject({ response: { code: "PROVIDER_UNAVAILABLE" } });
  });

  it("rejects when AI Fashion is disabled", async () => {
    const { service, prisma } = createService();
    prisma.systemSetting.findUnique = jest.fn().mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === "ai.fashion.enabled") return { value: false };
      if (where.key === "feature.ai_fashion.enabled") return { value: false };
      if (where.key === "ai.fashion.config") {
        return { value: { maintenanceMode: false, productToModelEnabled: true } };
      }
      return null;
    });
    await expect(
      service.generate(
        { productId: "00000000-0000-4000-8000-000000000001", type: "PRODUCT_TO_MODEL" },
        "user-1",
      ),
    ).rejects.toMatchObject({ response: { code: "AI_FASHION_DISABLED" } });
  });

  it("rejects when maintenance mode is on", async () => {
    const { service, prisma } = createService();
    prisma.systemSetting.findUnique = jest.fn().mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === "ai.fashion.enabled") return { value: true };
      if (where.key === "ai.fashion.config") {
        return {
          value: {
            maintenanceMode: true,
            productToModelEnabled: true,
            virtualTryOnEnabled: true,
            modelCreationEnabled: true,
            maxConcurrentJobs: 6,
            maxImagesPerJob: 4,
            dailyLimit: 20,
            monthlyLimit: 200,
            defaultNumImages: 1,
            defaultModelId: null,
            autoGenerateOnCreate: false,
            defaultResolution: "1k",
            defaultGenerationMode: "fast",
            videoEnabled: false,
          },
        };
      }
      return null;
    });
    await expect(
      service.generate(
        { productId: "00000000-0000-4000-8000-000000000001", type: "PRODUCT_TO_MODEL" },
        "user-1",
      ),
    ).rejects.toMatchObject({ response: { code: "AI_FASHION_MAINTENANCE" } });
  });

  it("creates a job and enqueues", async () => {
    const { service, queue, prisma } = createService();
    const result = await service.generate(
      {
        productId: "00000000-0000-4000-8000-000000000001",
        productImageId: "img-1",
        type: "PRODUCT_TO_MODEL",
      },
      "user-1",
    );
    expect(prisma.aiGeneratedImage.create).toHaveBeenCalled();
    expect(queue.enqueue).toHaveBeenCalledWith({ generatedImageId: "job-1" });
    expect(result).toMatchObject({ id: "job-1" });
    expect((result as { errorDetail?: string }).errorDetail).toBeUndefined();
  });

  it("prevents duplicate active generations", async () => {
    const { service, prisma } = createService();
    prisma.aiGeneratedImage.findFirst = jest.fn().mockResolvedValue({
      id: "existing",
      status: "PROCESSING",
    });
    await expect(
      service.generate(
        {
          productId: "00000000-0000-4000-8000-000000000001",
          type: "PRODUCT_TO_MODEL",
        },
        "user-1",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("requires product image", async () => {
    const { service, prisma } = createService();
    prisma.product.findFirst = jest.fn().mockResolvedValue({
      id: "prod-1",
      deletedAt: null,
      images: [],
    });
    await expect(
      service.generate(
        {
          productId: "00000000-0000-4000-8000-000000000001",
          type: "PRODUCT_TO_MODEL",
        },
        "user-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("retries failed jobs", async () => {
    const { service, prisma, queue } = createService();
    prisma.aiGeneratedImage.findUnique = jest.fn().mockResolvedValue({
      id: "job-1",
      status: "FAILED",
    });
    await service.retryJob("job-1", "user-1");
    expect(prisma.aiGeneratedImage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1" },
        data: expect.objectContaining({ status: "QUEUED" }),
      }),
    );
    expect(queue.enqueue).toHaveBeenCalled();
  });

  it("approves completed job into product gallery", async () => {
    const { service, prisma } = createService();
    prisma.aiGeneratedImage.findUnique = jest.fn().mockResolvedValue({
      id: "job-1",
      status: "COMPLETED",
      outputImageUrl: "https://cdn.example.com/out.png",
      outputPublicId: "t360/out",
      productId: "prod-1",
      type: "PRODUCT_TO_MODEL",
    });
    const result = await service.approveJob("job-1", "gallery", "user-1");
    expect(prisma.productImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: "prod-1",
          url: "https://cdn.example.com/out.png",
        }),
      }),
    );
    expect(result.productImage).toBeDefined();
  });

  it("processes job with mock provider and media upload", async () => {
    const provider = new MockFashionAiProvider();
    const { service, prisma, media } = createService({ provider });
    prisma.aiGeneratedImage.findUnique = jest.fn().mockResolvedValue({
      id: "job-1",
      status: "QUEUED",
      type: "PRODUCT_TO_MODEL",
      inputImageUrl: "https://cdn.example.com/shirt.jpg",
      productId: "prod-1",
      model: null,
      params: { numImages: 1, resolution: "1k" },
      prompt: "test",
      createdBy: "user-1",
    });
    await service.processJob("job-1");
    expect(media.uploadFromUrl).toHaveBeenCalled();
    expect(prisma.aiGeneratedImage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
  });

  it("destroys output asset when deleting a completed job", async () => {
    const { service, prisma, media, audit } = createService();
    prisma.aiGeneratedImage.findUnique = jest.fn().mockResolvedValue({
      id: "job-1",
      status: "COMPLETED",
      outputPublicId: "t360/out",
    });
    await service.deleteJob("job-1", "user-1");
    expect(media.deleteByPublicId).toHaveBeenCalledWith("t360/out");
    expect(prisma.aiGeneratedImage.delete).toHaveBeenCalledWith({ where: { id: "job-1" } });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ai_fashion.job.delete" }),
    );
  });

  it("destroys model asset when deleting a model", async () => {
    const { service, prisma, media } = createService();
    prisma.aiFashionModel.findUnique = jest.fn().mockResolvedValue({
      id: "m1",
      publicId: "t360/models/m1",
    });
    await service.deleteModel("m1", "user-1");
    expect(media.deleteByPublicId).toHaveBeenCalledWith("t360/models/m1");
    expect(prisma.aiFashionModel.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
  });
});
