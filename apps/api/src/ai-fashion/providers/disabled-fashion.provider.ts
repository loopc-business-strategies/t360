import { Injectable } from "@nestjs/common";
import {
  CreateModelInput,
  FashionAIProvider,
  FashionJobResult,
  FashionProviderError,
  FashionRunResult,
  ImageToVideoInput,
  ProductToModelInput,
  VirtualTryOnInput,
} from "./fashion-ai-provider";

@Injectable()
export class DisabledFashionAiProvider implements FashionAIProvider {
  readonly name = "disabled";

  isConfigured(): boolean {
    return false;
  }

  private fail(): never {
    throw new FashionProviderError(
      "PROVIDER_UNAVAILABLE",
      "AI Fashion generation is not configured. Set FASHION_AI_PROVIDER=fashn and FASHN_API_KEY.",
      503,
    );
  }

  async productToModel(_input: ProductToModelInput): Promise<FashionRunResult> {
    this.fail();
  }

  async virtualTryOn(_input: VirtualTryOnInput): Promise<FashionRunResult> {
    this.fail();
  }

  async createModel(_input: CreateModelInput): Promise<FashionRunResult> {
    this.fail();
  }

  async removeBackground(_input: { imageUrl: string }): Promise<FashionRunResult> {
    this.fail();
  }

  async generateVideo(_input: ImageToVideoInput): Promise<FashionRunResult> {
    this.fail();
  }

  async getJobStatus(_jobId: string): Promise<FashionJobResult> {
    this.fail();
  }
}
