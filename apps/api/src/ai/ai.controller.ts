import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { aiChatSchema } from "@t360/validation";
import { CurrentUser } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AiService } from "./ai.service";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("chat")
  async chat(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(aiChatSchema)) body: { conversationId?: string | null; message: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.ai.chat(user.userId, "customer", body),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("conversations")
  async list(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.ai.listConversations(user.userId, "customer"),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("conversations/:id")
  async get(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.ai.getConversation(user.userId, id, "customer"),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
