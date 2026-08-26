import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequireAnyPermissions, RequirePermissions } from "../common/decorators";
import { MEDIA_STORAGE, MediaStorage } from "./media-storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

@ApiTags("admin-media")
@ApiBearerAuth()
@Controller("admin/media")
export class MediaAdminController {
  constructor(@Inject(MEDIA_STORAGE) private readonly media: MediaStorage) {}

  @Get("status")
  @RequirePermissions("settings.manage")
  async status(@Req() req: Request) {
    const cloud =
      Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()) &&
      Boolean(process.env.CLOUDINARY_API_KEY?.trim()) &&
      Boolean(process.env.CLOUDINARY_API_SECRET?.trim());
    return {
      success: true,
      data: {
        cloudinaryConfigured: cloud,
        uploadBufferSupported: typeof this.media.uploadBuffer === "function",
        provider: cloud ? "cloudinary" : "mock",
      },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("upload")
  @RequireAnyPermissions(
    "products.update",
    "products.create",
    "ai_models.create",
    "ai_models.update",
    "ai.fashion",
    "ai_fashion.generate",
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 12 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    if (!file?.buffer?.length) {
      throw new BadRequestException({ code: "FILE_REQUIRED", message: "Image file is required" });
    }
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Supported formats: JPEG, PNG, WebP, GIF",
      });
    }
    if (!this.media.uploadBuffer) {
      throw new BadRequestException({
        code: "UPLOAD_UNSUPPORTED",
        message: "Media upload is not available",
      });
    }
    const asset = await this.media.uploadBuffer(file.buffer, {
      mimeType: file.mimetype,
      folder: "t360/uploads",
      publicId: `upload_${Date.now()}`,
    });
    return {
      success: true,
      data: asset,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
