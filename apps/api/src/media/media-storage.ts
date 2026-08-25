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
}

export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");
