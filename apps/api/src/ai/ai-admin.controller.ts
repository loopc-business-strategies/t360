import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { aiChatSchema } from "@t360/validation";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AiService } from "./ai.service";

@ApiTags("admin-ai")
@ApiBearerAuth()
@Controller("admin/ai")
export class AiAdminController {
  constructor(private readonly ai: AiService) {}

  @Post("chat")
  @RequirePermissions("ai.admin")
  async chat(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(aiChatSchema)) body: { conversationId?: string | null; message: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.ai.chat(user.userId, "admin", body),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("conversations")
  @RequirePermissions("ai.admin")
  async list(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.ai.listConversations(user.userId, "admin"),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("conversations/:id")
  @RequirePermissions("ai.admin")
  async get(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.ai.getConversation(user.userId, id, "admin"),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("products/:productId/generate-content")
  @RequirePermissions("products.update")
  async generateProductContent(
    @Param("productId") productId: string,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.ai.generateProductContent(productId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
