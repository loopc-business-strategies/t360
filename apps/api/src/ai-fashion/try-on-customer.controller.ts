import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  tryOnCreateSchema,
  tryOnHistoryQuerySchema,
  type TryOnCreateInput,
  type TryOnHistoryQuery,
} from "@t360/validation";
import { CurrentUser } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { TryOnService } from "./try-on.service";

@ApiTags("customer-try-on")
@ApiBearerAuth()
@Controller("ai/fashion/try-on")
export class TryOnCustomerController {
  constructor(private readonly tryOn: TryOnService) {}

  private reqId(req: Request) {
    return (req as Request & { requestId?: string }).requestId;
  }

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: "FILE_REQUIRED",
        message: "Please choose a photo to continue.",
      });
    }
    const data = await this.tryOn.uploadPersonPhoto(user.userId, file);
    return { success: true, data, requestId: this.reqId(req) };
  }

  @Post()
  async create(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(tryOnCreateSchema)) body: TryOnCreateInput,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    const data = await this.tryOn.create(user.userId, body, idempotencyKey?.trim() || undefined);
    return { success: true, data, requestId: this.reqId(req) };
  }

  @Get("config")
  async config(@Req() req: Request) {
    const s = await this.tryOn.getSettings();
    return {
      success: true,
      data: {
        enabled: s.enabled,
        consentRequired: s.consentRequired,
        allowCamera: s.allowCamera,
        allowUpload: s.allowUpload,
        maxImageBytes: s.maxImageBytes,
        retentionHours: s.retentionHours,
      },
      requestId: this.reqId(req),
    };
  }

  @Get("history")
  async history(
    @CurrentUser() user: { userId: string },
    @Query(new ZodValidationPipe(tryOnHistoryQuerySchema)) query: TryOnHistoryQuery,
    @Req() req: Request,
  ) {
    const data = await this.tryOn.history(user.userId, query);
    return { success: true, data, requestId: this.reqId(req) };
  }

  @Get(":id")
  async getOne(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const data = await this.tryOn.getForCustomer(user.userId, id);
    return { success: true, data, requestId: this.reqId(req) };
  }

  @Post(":id/cancel")
  async cancel(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const data = await this.tryOn.cancel(user.userId, id);
    return { success: true, data, requestId: this.reqId(req) };
  }

  @Delete(":id")
  async remove(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const data = await this.tryOn.deleteForCustomer(user.userId, id);
    return { success: true, data, requestId: this.reqId(req) };
  }
}
