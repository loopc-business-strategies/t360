import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { TryOnService } from "./try-on.service";

describe("TryOnService", () => {
  const prisma = {
    systemSetting: { findUnique: jest.fn() },
    product: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    productVariant: { findFirst: jest.fn() },
    tryOnSession: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    tryOnUsage: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const redis = {
    client: {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
    },
  };
  const queue = {
    enqueueTryOn: jest.fn(),
    removeTryOnJob: jest.fn(),
  };
  const provider = {
    name: "fashn",
    isConfigured: jest.fn().mockReturnValue(true),
    virtualTryOn: jest.fn(),
    getJobStatus: jest.fn(),
  };
  const media = {
    uploadFromUrl: jest.fn(),
    uploadBuffer: jest.fn().mockResolvedValue({
      url: "https://cdn.example.com/person.jpg",
      publicId: "person_1",
    }),
    deleteByPublicId: jest.fn().mockResolvedValue({ deleted: true }),
  };

  function createService() {
    return new TryOnService(
      prisma as never,
      redis as never,
      queue as never,
      provider as never,
      media as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.systemSetting.findUnique.mockResolvedValue({
      value: {
        enabled: true,
        maxImageBytes: 8_000_000,
        retentionHours: 24,
        perUserPerHour: 10,
        maxConcurrentPerUser: 2,
      },
    });
    prisma.tryOnSession.count.mockResolvedValue(0);
  });

  it("rejects when product try-on disabled", async () => {
    const service = createService();
    prisma.product.findFirst.mockResolvedValue({
      id: "p1",
      tryOnEnabled: false,
      images: [{ url: "https://cdn.example.com/g.jpg", mediaType: "image", isTryOnSource: false, sortOrder: 0 }],
    });
    await expect(
      service.create("u1", {
        productId: "00000000-0000-4000-8000-000000000001",
        inputImageUrl: "https://cdn.example.com/person.jpg",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects when provider not configured", async () => {
    provider.isConfigured.mockReturnValue(false);
    const service = createService();
    await expect(
      service.create("u1", {
        productId: "00000000-0000-4000-8000-000000000001",
        inputImageUrl: "https://cdn.example.com/person.jpg",
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    provider.isConfigured.mockReturnValue(true);
  });

  it("creates session and enqueues", async () => {
    const service = createService();
    prisma.product.findFirst.mockResolvedValue({
      id: "p1",
      tryOnEnabled: true,
      images: [
        { url: "https://cdn.example.com/g.jpg", mediaType: "image", isTryOnSource: true, sortOrder: 0 },
      ],
    });
    prisma.tryOnSession.findFirst.mockResolvedValue(null);
    prisma.tryOnSession.create.mockResolvedValue({
      id: "s1",
      customerId: "u1",
      productId: "p1",
      variantId: null,
      inputImageUrl: "https://cdn.example.com/person.jpg",
      resultImageUrl: null,
      status: "QUEUED",
      provider: "fashn",
      providerJobId: null,
      errorCode: null,
      errorMessage: null,
      savePhotoConsent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });
    prisma.tryOnUsage.create.mockResolvedValue({});
    const result = await service.create("u1", {
      productId: "00000000-0000-4000-8000-000000000001",
      inputImageUrl: "https://cdn.example.com/person.jpg",
    });
    expect(result.status).toBe("QUEUED");
    expect(queue.enqueueTryOn).toHaveBeenCalledWith({ tryOnSessionId: "s1" });
  });

  it("blocks access to another customer session", async () => {
    const service = createService();
    prisma.tryOnSession.findFirst.mockResolvedValue(null);
    await expect(service.getForCustomer("u1", "s1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("forbids cancel by non-owner", async () => {
    const service = createService();
    prisma.tryOnSession.findFirst.mockResolvedValue({
      id: "s1",
      customerId: "other",
      deletedAt: null,
      status: "QUEUED",
    });
    await expect(service.cancel("u1", "s1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("resolves garment try-on source first", () => {
    const service = createService();
    const url = service.resolveGarmentUrl([
      { url: "a.jpg", mediaType: "image", isTryOnSource: false, sortOrder: 0 },
      { url: "b.jpg", mediaType: "image", isTryOnSource: true, sortOrder: 1 },
    ]);
    expect(url).toBe("b.jpg");
  });

  it("destroys Cloudinary assets when customer deletes try-on", async () => {
    const service = createService();
    prisma.tryOnSession.findFirst.mockResolvedValue({
      id: "s1",
      customerId: "u1",
      deletedAt: null,
      inputPublicId: "t360/in",
      resultPublicId: "t360/out",
      inputImageUrl: "https://cdn/in.jpg",
      resultImageUrl: "https://cdn/out.jpg",
    });
    prisma.tryOnSession.update.mockResolvedValue({});
    await service.deleteForCustomer("u1", "s1");
    expect(media.deleteByPublicId).toHaveBeenCalledWith("t360/in");
    expect(media.deleteByPublicId).toHaveBeenCalledWith("t360/out");
    expect(prisma.tryOnSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});
