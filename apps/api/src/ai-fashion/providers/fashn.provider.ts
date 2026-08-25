import { Injectable, Logger } from "@nestjs/common";
import {
  CreateModelInput,
  FashionAIProvider,
  FashionJobResult,
  FashionJobStatus,
  FashionProviderError,
  FashionRunResult,
  ProductToModelInput,
  ProviderCapabilityError,
  VirtualTryOnInput,
} from "./fashion-ai-provider";

const FASHN_BASE = "https://api.fashn.ai/v1";

type FashnRunResponse = { id?: string; error?: string | { name?: string; message?: string } | null };
type FashnStatusResponse = {
  id?: string;
  status?: string;
  output?: string[];
  error?: string | { name?: string; message?: string } | null;
};

@Injectable()
export class FashnProvider implements FashionAIProvider {
  readonly name = "fashn";
  private readonly logger = new Logger(FashnProvider.name);

  isConfigured(): boolean {
    return Boolean(process.env.FASHN_API_KEY?.trim());
  }

  private apiKey(): string {
    const key = process.env.FASHN_API_KEY?.trim();
    if (!key) {
      throw new FashionProviderError(
        "INVALID_API_KEY",
        "FASHN_API_KEY is not configured",
        503,
      );
    }
    return key;
  }

  async productToModel(input: ProductToModelInput): Promise<FashionRunResult> {
    // Library / full-body model → tryon-max for garment fidelity on that person
    if (input.modelImageUrl) {
      return this.run("tryon-max", {
        product_image: input.productImageUrl,
        model_image: input.modelImageUrl,
        prompt: input.prompt,
        num_images: input.numImages ?? 1,
        resolution: input.resolution ?? "1k",
        generation_mode: input.generationMode,
        output_format: "png",
        return_base64: false,
      });
    }

    return this.run("product-to-model", {
      product_image: input.productImageUrl,
      face_reference: input.faceReferenceUrl,
      face_reference_mode: input.faceReferenceUrl ? "match_reference" : undefined,
      prompt: input.prompt,
      background_reference: input.backgroundReferenceUrl,
      image_prompt: input.imagePromptUrl,
      num_images: input.numImages ?? 1,
      resolution: input.resolution ?? "1k",
      generation_mode: input.generationMode,
      aspect_ratio: input.aspectRatio,
      seed: input.seed,
      output_format: "png",
      return_base64: false,
    });
  }

  async virtualTryOn(input: VirtualTryOnInput): Promise<FashionRunResult> {
    return this.run("tryon-max", {
      product_image: input.productImageUrl,
      model_image: input.personImageUrl,
      prompt: input.prompt,
      num_images: input.numImages ?? 1,
      resolution: input.resolution ?? "1k",
      generation_mode: input.generationMode,
      output_format: "png",
      return_base64: false,
    });
  }

  async createModel(input: CreateModelInput): Promise<FashionRunResult> {
    return this.run("model-create", {
      prompt: input.prompt,
      image_reference: input.imageReferenceUrl,
      face_reference: input.faceReferenceUrl,
      face_reference_mode: input.faceReferenceUrl ? "match_reference" : undefined,
      aspect_ratio: input.aspectRatio ?? "3:4",
      num_images: input.numImages ?? 1,
      resolution: input.resolution ?? "1k",
      generation_mode: input.generationMode,
      seed: input.seed,
      output_format: "png",
      return_base64: false,
    });
  }

  async removeBackground(_input: { imageUrl: string }): Promise<FashionRunResult> {
    throw new ProviderCapabilityError("removeBackground");
  }

  async generateVideo(_input: { imageUrl: string; duration?: 5 | 10 }): Promise<FashionRunResult> {
    throw new ProviderCapabilityError("generateVideo");
  }

  async getJobStatus(jobId: string): Promise<FashionJobResult> {
    const res = await fetch(`${FASHN_BASE}/status/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey()}`,
        Accept: "application/json",
      },
    });

    const creditsHeader = res.headers.get("x-fashn-credits-used");
    const creditsUsed = creditsHeader ? Number(creditsHeader) : undefined;

    const body = (await res.json().catch(() => ({}))) as FashnStatusResponse;

    if (!res.ok) {
      throw this.mapHttpError(res.status, body);
    }

    const status = this.mapStatus(body.status);
    if (status === "failed") {
      const mapped = this.mapRuntimeError(body.error);
      return {
        status,
        error: mapped,
        creditsUsed: Number.isFinite(creditsUsed) ? creditsUsed : undefined,
      };
    }

    return {
      status,
      outputUrls: Array.isArray(body.output) ? body.output.filter(Boolean) : undefined,
      creditsUsed: Number.isFinite(creditsUsed) ? creditsUsed : undefined,
    };
  }

  private async run(modelName: string, inputs: Record<string, unknown>): Promise<FashionRunResult> {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(inputs)) {
      if (v !== undefined && v !== null && v !== "") cleaned[k] = v;
    }

    const apiKey = this.apiKey();

    let res: Response;
    try {
      res = await fetch(`${FASHN_BASE}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ model_name: modelName, inputs: cleaned }),
      });
    } catch {
      this.logger.error(`FASHN run network error for ${modelName}`);
      throw new FashionProviderError(
        "PROVIDER_UNAVAILABLE",
        "AI generation is temporarily unavailable. Please try again.",
        503,
      );
    }

    const body = (await res.json().catch(() => ({}))) as FashnRunResponse;

    if (!res.ok) {
      throw this.mapHttpError(res.status, body);
    }

    if (!body.id) {
      throw new FashionProviderError(
        "PROVIDER_UNAVAILABLE",
        "AI provider did not return a job id",
        502,
      );
    }

    return { jobId: body.id };
  }

  private mapStatus(status?: string): FashionJobStatus {
    switch (status) {
      case "starting":
      case "in_queue":
      case "processing":
      case "completed":
      case "failed":
        return status;
      default:
        return "processing";
    }
  }

  private mapHttpError(status: number, body: FashnRunResponse | FashnStatusResponse): FashionProviderError {
    const raw =
      typeof body.error === "string"
        ? body.error
        : body.error?.name || body.error?.message || `HTTP ${status}`;

    if (status === 401 || status === 403) {
      return new FashionProviderError("INVALID_API_KEY", "AI provider authentication failed", status);
    }
    if (status === 429) {
      return new FashionProviderError("RATE_LIMIT", "AI generation rate limit reached. Please try again later.", status);
    }
    if (status === 402 || /credit/i.test(String(raw))) {
      return new FashionProviderError("CREDITS", "Insufficient AI credits. Please top up the provider account.", status);
    }
    if (/image|input|validation/i.test(String(raw))) {
      return new FashionProviderError("IMAGE_INVALID", "The product or model image could not be processed.", status);
    }
    return new FashionProviderError(
      "PROVIDER_UNAVAILABLE",
      "AI generation is temporarily unavailable. Please try again.",
      status,
    );
  }

  private mapRuntimeError(
    error: string | { name?: string; message?: string } | null | undefined,
  ): { code: string; message: string } {
    const name = typeof error === "string" ? error : error?.name ?? "";
    const message = typeof error === "string" ? error : error?.message ?? "Generation failed";

    if (/ImageLoad|InputValidation|image/i.test(name + message)) {
      return { code: "IMAGE_INVALID", message: "The product or model image could not be processed." };
    }
    if (/credit|quota/i.test(name + message)) {
      return { code: "CREDITS", message: "Insufficient AI credits. Please top up the provider account." };
    }
    if (/rate|throttle/i.test(name + message)) {
      return { code: "RATE_LIMIT", message: "AI generation rate limit reached. Please try again later." };
    }
    return {
      code: "GENERATION_FAILED",
      message: "AI generation failed. Please try again.",
    };
  }
}
