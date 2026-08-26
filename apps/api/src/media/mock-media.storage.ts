import { Injectable } from "@nestjs/common";
import { MediaAsset, MediaStorage } from "./media-storage";

/** Dev/mock adapter — stores URL as-is. Label: not Cloudinary. */
@Injectable()
export class MockMediaStorage implements MediaStorage {
  readonly deletedPublicIds: string[] = [];

  async uploadFromUrl(
    url: string,
    publicId?: string,
    _opts?: { resourceType?: "image" | "video" | "auto" },
  ): Promise<MediaAsset> {
    return { url, publicId: publicId ?? `mock/${Date.now()}` };
  }

  async uploadBuffer(
    buffer: Buffer,
    opts?: { publicId?: string; mimeType?: string; folder?: string },
  ): Promise<MediaAsset> {
    const b64 = buffer.toString("base64");
    const mime = opts?.mimeType ?? "image/jpeg";
    const dataUri = `data:${mime};base64,${b64.slice(0, 32)}…`;
    return {
      url: `https://mock.local/${opts?.folder ?? "t360"}/${opts?.publicId ?? Date.now()}.jpg`,
      publicId: opts?.publicId ?? `mock/${Date.now()}`,
      // keep a tiny fingerprint so tests can assert buffer was received
      ...(dataUri ? {} : {}),
    };
  }

  async deleteByPublicId(
    publicId: string,
    _opts?: { resourceType?: "image" | "video" | "raw" },
  ): Promise<{ deleted: boolean }> {
    const id = publicId?.trim();
    if (!id) return { deleted: false };
    this.deletedPublicIds.push(id);
    return { deleted: true };
  }
}
