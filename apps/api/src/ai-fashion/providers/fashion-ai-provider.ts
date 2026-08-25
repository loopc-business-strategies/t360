export type FashionJobStatus =
  | "starting"
  | "in_queue"
  | "processing"
  | "completed"
  | "failed";

export type FashionRunResult = {
  jobId: string;
};

export type FashionJobResult = {
  status: FashionJobStatus;
  outputUrls?: string[];
  error?: { code: string; message: string };
  creditsUsed?: number;
};

export type ProductToModelInput = {
  productImageUrl: string;
  /** When set, provider uses try-on with this model image */
  modelImageUrl?: string;
  /** Face identity for product-to-model without full-body model image */
  faceReferenceUrl?: string;
  prompt?: string;
  backgroundReferenceUrl?: string;
  imagePromptUrl?: string;
  numImages?: number;
  resolution?: "1k" | "2k" | "4k";
  generationMode?: "fast" | "balanced" | "quality";
  aspectRatio?: string;
  seed?: number;
};

export type VirtualTryOnInput = {
  productImageUrl: string;
  personImageUrl: string;
  prompt?: string;
  numImages?: number;
  resolution?: "1k" | "2k" | "4k";
  generationMode?: "fast" | "balanced" | "quality";
};

export type CreateModelInput = {
  prompt: string;
  imageReferenceUrl?: string;
  faceReferenceUrl?: string;
  aspectRatio?: string;
  numImages?: number;
  resolution?: "1k" | "2k" | "4k";
  generationMode?: "fast" | "balanced" | "quality";
  seed?: number;
};

export class FashionProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "FashionProviderError";
  }
}

export class ProviderCapabilityError extends FashionProviderError {
  constructor(capability: string) {
    super("NOT_IMPLEMENTED", `${capability} is not available for this provider yet`);
    this.name = "ProviderCapabilityError";
  }
}

export interface FashionAIProvider {
  readonly name: string;
  isConfigured(): boolean;
  productToModel(input: ProductToModelInput): Promise<FashionRunResult>;
  virtualTryOn(input: VirtualTryOnInput): Promise<FashionRunResult>;
  createModel(input: CreateModelInput): Promise<FashionRunResult>;
  removeBackground(input: { imageUrl: string }): Promise<FashionRunResult>;
  generateVideo(input: { imageUrl: string; duration?: 5 | 10 }): Promise<FashionRunResult>;
  getJobStatus(jobId: string): Promise<FashionJobResult>;
}

export const FASHION_AI_PROVIDER = Symbol("FASHION_AI_PROVIDER");
