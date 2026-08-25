/**
 * Test-only mock. NEVER register via FASHION_AI_PROVIDER in production modules.
 * Wire only in Jest specs.
 */
import {
  CreateModelInput,
  FashionAIProvider,
  FashionJobResult,
  FashionRunResult,
  ProductToModelInput,
  ProviderCapabilityError,
  VirtualTryOnInput,
} from "./fashion-ai-provider";

export class MockFashionAiProvider implements FashionAIProvider {
  readonly name = "mock";
  private jobs = new Map<string, FashionJobResult>();
  private counter = 0;
  failNext = false;
  delayMs = 0;

  isConfigured(): boolean {
    return true;
  }

  async productToModel(input: ProductToModelInput): Promise<FashionRunResult> {
    return this.enqueue(input.productImageUrl);
  }

  async virtualTryOn(input: VirtualTryOnInput): Promise<FashionRunResult> {
    return this.enqueue(input.productImageUrl);
  }

  async createModel(input: CreateModelInput): Promise<FashionRunResult> {
    return this.enqueue(input.prompt);
  }

  async removeBackground(_input: { imageUrl: string }): Promise<FashionRunResult> {
    throw new ProviderCapabilityError("removeBackground");
  }

  async generateVideo(_input: { imageUrl: string; duration?: 5 | 10 }): Promise<FashionRunResult> {
    throw new ProviderCapabilityError("generateVideo");
  }

  async getJobStatus(jobId: string): Promise<FashionJobResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { status: "failed", error: { code: "GENERATION_FAILED", message: "Unknown job" } };
    }
    return job;
  }

  private async enqueue(seed: string): Promise<FashionRunResult> {
    if (this.failNext) {
      this.failNext = false;
      const id = `mock_fail_${++this.counter}`;
      this.jobs.set(id, {
        status: "failed",
        error: { code: "GENERATION_FAILED", message: "Mock generation failed" },
      });
      return { jobId: id };
    }
    const id = `mock_${++this.counter}_${Buffer.from(seed).toString("base64url").slice(0, 8)}`;
    this.jobs.set(id, {
      status: "completed",
      outputUrls: [`https://cdn.example.test/ai-fashion/${id}.png`],
      creditsUsed: 1,
    });
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
    return { jobId: id };
  }
}
