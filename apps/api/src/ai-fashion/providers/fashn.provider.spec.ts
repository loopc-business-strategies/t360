import {
  FashionProviderError,
  ProductToModelInput,
} from "./fashion-ai-provider";
import { FashnProvider } from "./fashn.provider";
import { DisabledFashionAiProvider } from "./disabled-fashion.provider";
import { MockFashionAiProvider } from "./mock-fashion.provider";

describe("DisabledFashionAiProvider", () => {
  const provider = new DisabledFashionAiProvider();

  it("reports not configured", () => {
    expect(provider.isConfigured()).toBe(false);
  });

  it("fails fast without fake success", async () => {
    await expect(
      provider.productToModel({ productImageUrl: "https://example.com/shirt.jpg" }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });
});

describe("MockFashionAiProvider", () => {
  it("completes product-to-model for tests only", async () => {
    const mock = new MockFashionAiProvider();
    const run = await mock.productToModel({
      productImageUrl: "https://example.com/shirt.jpg",
    });
    const status = await mock.getJobStatus(run.jobId);
    expect(status.status).toBe("completed");
    expect(status.outputUrls?.[0]).toContain("cdn.example.test");
  });

  it("can simulate failure", async () => {
    const mock = new MockFashionAiProvider();
    mock.failNext = true;
    const run = await mock.productToModel({
      productImageUrl: "https://example.com/shirt.jpg",
    });
    const status = await mock.getJobStatus(run.jobId);
    expect(status.status).toBe("failed");
  });
});

describe("FashnProvider error mapping", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.FASHN_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.FASHN_API_KEY = originalKey;
  });

  it("requires API key", async () => {
    delete process.env.FASHN_API_KEY;
    const provider = new FashnProvider();
    expect(provider.isConfigured()).toBe(false);
    await expect(
      provider.productToModel({ productImageUrl: "https://example.com/a.jpg" }),
    ).rejects.toBeInstanceOf(FashionProviderError);
  });

  it("maps 401 to INVALID_API_KEY", async () => {
    process.env.FASHN_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
      json: async () => ({ error: "UnauthorizedAccess" }),
    }) as unknown as typeof fetch;

    const provider = new FashnProvider();
    await expect(
      provider.productToModel({ productImageUrl: "https://example.com/a.jpg" } as ProductToModelInput),
    ).rejects.toMatchObject({ code: "INVALID_API_KEY" });
  });

  it("uses tryon-max when model image is provided", async () => {
    process.env.FASHN_API_KEY = "test-key";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ id: "pred-1", error: null }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new FashnProvider();
    const result = await provider.productToModel({
      productImageUrl: "https://example.com/product.jpg",
      modelImageUrl: "https://example.com/model.jpg",
    });
    expect(result.jobId).toBe("pred-1");
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model_name).toBe("tryon-max");
    expect(body.inputs.model_image).toBe("https://example.com/model.jpg");
  });

  it("uses product-to-model without model image", async () => {
    process.env.FASHN_API_KEY = "test-key";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ id: "pred-2", error: null }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new FashnProvider();
    await provider.productToModel({
      productImageUrl: "https://example.com/product.jpg",
      prompt: "studio",
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model_name).toBe("product-to-model");
  });
});
