import { Injectable, Logger } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { MediaAsset, MediaStorage } from "./media-storage";

/**
 * Cloudinary adapter — activated when CLOUDINARY_CLOUD_NAME + API keys are set.
 */
@Injectable()
export class CloudinaryMediaStorage implements MediaStorage {
  private readonly logger = new Logger(CloudinaryMediaStorage.name);
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return;
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud_name || !api_key || !api_secret) {
      throw new Error("Cloudinary credentials are incomplete");
    }
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    this.configured = true;
  }

  async uploadFromUrl(
    url: string,
    publicId?: string,
    opts?: { resourceType?: "image" | "video" | "auto" },
  ): Promise<MediaAsset> {
    this.ensureConfigured();
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: publicId?.includes("/") ? undefined : "t360",
        public_id: publicId,
        overwrite: false,
        resource_type: opts?.resourceType ?? "image",
      });
      return {
        url: result.secure_url ?? result.url,
        publicId: result.public_id,
      };
    } catch (err) {
      this.logger.error(`Cloudinary upload failed: ${err instanceof Error ? err.message : "unknown"}`);
      throw err;
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    opts?: { publicId?: string; mimeType?: string; folder?: string },
  ): Promise<MediaAsset> {
    this.ensureConfigured();
    const dataUri = `data:${opts?.mimeType ?? "image/jpeg"};base64,${buffer.toString("base64")}`;
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: opts?.folder ?? "t360/uploads",
        public_id: opts?.publicId,
        overwrite: false,
        resource_type: "image",
      });
      return {
        url: result.secure_url ?? result.url,
        publicId: result.public_id,
      };
    } catch (err) {
      this.logger.error(
        `Cloudinary buffer upload failed: ${err instanceof Error ? err.message : "unknown"}`,
      );
      throw err;
    }
  }

  async deleteByPublicId(
    publicId: string,
    opts?: { resourceType?: "image" | "video" | "raw" },
  ): Promise<{ deleted: boolean }> {
    const id = publicId?.trim();
    if (!id) return { deleted: false };
    this.ensureConfigured();
    try {
      const result = await cloudinary.uploader.destroy(id, {
        resource_type: opts?.resourceType ?? "image",
        invalidate: true,
      });
      const ok = result?.result === "ok" || result?.result === "not found";
      if (!ok) {
        this.logger.warn(
          `Cloudinary destroy unexpected result for ${id}: ${String(result?.result)}`,
        );
      }
      return { deleted: ok };
    } catch (err) {
      this.logger.error(
        `Cloudinary destroy failed for ${id}: ${err instanceof Error ? err.message : "unknown"}`,
      );
      // Best-effort: callers still clear DB records
      return { deleted: false };
    }
  }
}
