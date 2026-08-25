import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  aiFashionApproveSchema,
  aiFashionGenerateSchema,
  aiFashionJobsQuerySchema,
  aiFashionModelCreateSchema,
  aiFashionModelGenerateSchema,
  aiFashionModelUpdateSchema,
  aiFashionSettingsUpdateSchema,
  type AiFashionApproveInput,
  type AiFashionGenerateInput,
  type AiFashionJobsQuery,
  type AiFashionModelCreateInput,
  type AiFashionModelGenerateInput,
  type AiFashionModelUpdateInput,
  type AiFashionSettingsUpdateInput,
} from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AiFashionService } from "./ai-fashion.service";

@ApiTags("admin-ai-fashion")
@ApiBearerAuth()
@Controller("admin/ai-fashion")
export class AiFashionAdminController {
  constructor(private readonly fashion: AiFashionService) {}

  private reqId(req: Request) {
    return (req as Request & { requestId?: string }).requestId;
  }

  @Get("dashboard")
  @RequirePermissions("ai_fashion.view")
  async dashboard(@Req() req: Request) {
    return { success: true, data: await this.fashion.getDashboard(), requestId: this.reqId(req) };
  }

  @Get("settings")
  @RequirePermissions("ai_settings.view")
  async getSettings(@Req() req: Request) {
    return { success: true, data: await this.fashion.getSettings(), requestId: this.reqId(req) };
  }

  @Patch("settings")
  @RequirePermissions("ai_settings.update")
  async updateSettings(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(aiFashionSettingsUpdateSchema)) body: AiFashionSettingsUpdateInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.updateSettings(body, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Get("usage")
  @RequirePermissions("ai_fashion.view")
  async usage(@Req() req: Request) {
    return { success: true, data: await this.fashion.getUsage(), requestId: this.reqId(req) };
  }

  @Post("generate")
  @RequirePermissions("ai_fashion.generate")
  async generate(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(aiFashionGenerateSchema)) body: AiFashionGenerateInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.generate(body, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Get("jobs")
  @RequirePermissions("ai_fashion.view")
  async listJobs(
    @Query(new ZodValidationPipe(aiFashionJobsQuerySchema)) query: AiFashionJobsQuery,
    @Req() req: Request,
  ) {
    const result = await this.fashion.listJobs(query);
    return {
      success: true,
      data: result.items,
      meta: result.meta,
      requestId: this.reqId(req),
    };
  }

  @Get("jobs/:id")
  @RequirePermissions("ai_fashion.view")
  async getJob(@Param("id") id: string, @Req() req: Request) {
    return { success: true, data: await this.fashion.getJob(id), requestId: this.reqId(req) };
  }

  @Post("jobs/:id/retry")
  @RequirePermissions("ai_fashion.retry")
  async retry(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.retryJob(id, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Post("jobs/:id/approve")
  @RequirePermissions("ai_fashion.approve")
  async approve(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body(new ZodValidationPipe(aiFashionApproveSchema)) body: AiFashionApproveInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.approveJob(id, body.as, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Delete("jobs/:id")
  @RequirePermissions("ai_fashion.delete")
  async deleteJob(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.deleteJob(id, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Get("models")
  @RequirePermissions("ai_models.view")
  async listModels(@Query("activeOnly") activeOnly: string | undefined, @Req() req: Request) {
    return {
      success: true,
      data: await this.fashion.listModels({ activeOnly: activeOnly === "true" }),
      requestId: this.reqId(req),
    };
  }

  @Post("models")
  @RequirePermissions("ai_models.create")
  async createModel(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(aiFashionModelCreateSchema)) body: AiFashionModelCreateInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.createModel(body, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Post("models/generate")
  @RequirePermissions("ai_models.create")
  async generateModel(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(aiFashionModelGenerateSchema)) body: AiFashionModelGenerateInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.generateModel(body, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Get("models/:id")
  @RequirePermissions("ai_models.view")
  async getModel(@Param("id") id: string, @Req() req: Request) {
    return { success: true, data: await this.fashion.getModel(id), requestId: this.reqId(req) };
  }

  @Patch("models/:id")
  @RequirePermissions("ai_models.update")
  async updateModel(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body(new ZodValidationPipe(aiFashionModelUpdateSchema)) body: AiFashionModelUpdateInput,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.updateModel(id, body, user.userId),
      requestId: this.reqId(req),
    };
  }

  @Delete("models/:id")
  @RequirePermissions("ai_models.delete")
  async deleteModel(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.fashion.deleteModel(id, user.userId),
      requestId: this.reqId(req),
    };
  }
}
