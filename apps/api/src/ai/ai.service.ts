import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { AiToolsService } from "./ai-tools.service";
import { AI_PROVIDER, type AiChatMessage, type AiProvider } from "./providers/ai-provider";

const MAX_ROUNDS = 3;

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tools: AiToolsService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  private async assertEnabled() {
    const row = await this.prisma.systemSetting.findUnique({ where: { key: "ai.enabled" } });
    const enabled = row?.value === true || row?.value === "true" || row == null;
    if (!enabled) {
      throw new ServiceUnavailableException({
        code: "AI_DISABLED",
        message: "Tharagai AI is temporarily disabled",
      });
    }
  }

  private async assertRateLimit(userId: string) {
    const key = `rate:ai:${userId}`;
    const count = await this.redis.client.incr(key);
    if (count === 1) await this.redis.client.expire(key, 600);
    if (count > 30) {
      throw new ForbiddenException({
        code: "RATE_LIMITED",
        message: "Too many AI requests. Try again later.",
      });
    }
  }

  listConversations(userId: string, audience: "customer" | "admin") {
    return this.prisma.aIConversation.findMany({
      where: { userId, audience },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, audience: true, createdAt: true, updatedAt: true },
    });
  }

  async getConversation(userId: string, id: string, audience: "customer" | "admin") {
    const conv = await this.prisma.aIConversation.findFirst({
      where: { id, userId, audience },
      include: {
        messages: {
          where: { role: { in: ["user", "assistant"] } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!conv) {
      throw new NotFoundException({ code: "AI_CONVERSATION_NOT_FOUND", message: "Conversation not found" });
    }
    return conv;
  }

  async chat(
    userId: string,
    audience: "customer" | "admin",
    input: { conversationId?: string | null; message: string },
  ) {
    await this.assertEnabled();
    await this.assertRateLimit(userId);

    let conversationId = input.conversationId ?? undefined;
    if (conversationId) {
      const existing = await this.prisma.aIConversation.findFirst({
        where: { id: conversationId, userId, audience },
      });
      if (!existing) {
        throw new NotFoundException({
          code: "AI_CONVERSATION_NOT_FOUND",
          message: "Conversation not found",
        });
      }
    } else {
      const created = await this.prisma.aIConversation.create({
        data: {
          userId,
          audience,
          title: input.message.slice(0, 80),
        },
      });
      conversationId = created.id;
    }

    await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: "user",
        content: input.message,
      },
    });

    const history = await this.prisma.aIMessage.findMany({
      where: { conversationId, role: { in: ["user", "assistant"] } },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const toolDefs =
      audience === "admin" ? this.tools.adminToolDefs() : this.tools.customerToolDefs();

    const messages: AiChatMessage[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let reply = "I could not complete that request.";
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const result = await this.provider.chat({ messages, tools: toolDefs, audience });
      if (result.toolCalls?.length) {
        for (const tc of result.toolCalls) {
          let payload: unknown;
          try {
            payload = await this.tools.execute(tc.name, tc.arguments ?? {}, { userId, audience });
          } catch (e) {
            payload = {
              error: e instanceof Error ? e.message : "Tool failed",
            };
          }
          const content = JSON.stringify(payload);
          await this.prisma.aIMessage.create({
            data: {
              conversationId,
              role: "tool",
              content,
              toolName: tc.name,
              toolPayload: payload as Prisma.InputJsonValue,
            },
          });
          messages.push({
            role: "tool",
            content,
            toolName: tc.name,
            toolCallId: tc.id,
          });
        }
        continue;
      }
      reply = result.content?.trim() || reply;
      break;
    }

    await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: reply,
      },
    });
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId,
      reply,
    };
  }

  async generateProductContent(productId: string) {
    await this.assertEnabled();
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: { category: true, brand: true, variants: { take: 1 } },
    });
    if (!product) {
      throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Product not found" });
    }

    const prompt = `Generate ecommerce product content for THARAGAI Readymades (Indian fashion, Pudukkottai).
Product: ${product.name}
Category: ${product.category?.name ?? "unknown"}
Brand: ${product.brand?.name ?? "THARAGAI"}
Current description: ${product.description?.slice(0, 500) ?? ""}

Return ONLY valid JSON with keys: title, description, highlights (array of strings), seoTitle, seoDescription, keywords (array), tags (array), altText, suggestedCategorySlug, suggestedAttributes (object).
Do not publish — admin will review.`;

    const result = await this.provider.chat({
      messages: [{ role: "user", content: prompt }],
      tools: [],
      audience: "admin",
    });

    const raw = result.content ?? "{}";
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
      return { draft: parsed, raw };
    } catch {
      return {
        draft: {
          title: product.name,
          description: raw.slice(0, 2000),
          highlights: [],
          seoTitle: product.name,
          seoDescription: product.description?.slice(0, 160) ?? "",
          keywords: [],
          tags: [],
          altText: product.name,
        },
        raw,
      };
    }
  }
}
