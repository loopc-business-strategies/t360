import { Injectable } from "@nestjs/common";
import { MediaAsset, MediaStorage } from "./media-storage";

/** Dev/mock adapter — stores URL as-is. Label: not Cloudinary. */
@Injectable()
export class MockMediaStorage implements MediaStorage {
  async uploadFromUrl(url: string, publicId?: string): Promise<MediaAsset> {
    return { url, publicId: publicId ?? `mock/${Date.now()}` };
  }
}
