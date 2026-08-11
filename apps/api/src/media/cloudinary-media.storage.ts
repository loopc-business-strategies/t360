import { Injectable, Logger } from "@nestjs/common";
import { MediaAsset, MediaStorage } from "./media-storage";

/**
 * Cloudinary adapter — activated when CLOUDINARY_CLOUD_NAME + API keys are set.
 * Without credentials, construction should not happen (factory uses mock).
 */
@Injectable()
export class CloudinaryMediaStorage implements MediaStorage {
  private readonly logger = new Logger(CloudinaryMediaStorage.name);

  async uploadFromUrl(url: string, publicId?: string): Promise<MediaAsset> {
    // Placeholder: full SDK upload in later hardening when credentials exist.
    // For now, return delivery-style URL shape without claiming upload succeeded remotely.
    this.logger.warn(
      "Cloudinary adapter stub — returning source URL. Configure CLOUDINARY_* and implement upload SDK for production.",
    );
    const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "demo";
    return {
      url,
      publicId: publicId ?? `tharagai/${cloud}/${Date.now()}`,
    };
  }
}
