export interface MediaAsset {
  url: string;
  publicId?: string;
}

export interface MediaStorage {
  uploadFromUrl(
    url: string,
    publicId?: string,
    opts?: { resourceType?: "image" | "video" | "auto" },
  ): Promise<MediaAsset>;
  uploadBuffer?(
    buffer: Buffer,
    opts?: { publicId?: string; mimeType?: string; folder?: string },
  ): Promise<MediaAsset>;
  /** Best-effort provider-side destroy. No-op when publicId is empty. */
  deleteByPublicId(
    publicId: string,
    opts?: { resourceType?: "image" | "video" | "raw" },
  ): Promise<{ deleted: boolean }>;
}

export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");
