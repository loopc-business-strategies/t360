import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AiChatInput, AiChatResult, AiProvider, AiToolCall } from "./ai-provider";

/**
 * OpenAI Chat Completions tool-calling adapter.
 * Only used when AI_PROVIDER=openai and OPENAI_API_KEY is set.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  async chat(input: AiChatInput): Promise<AiChatResult> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY missing");
    }
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const messages = input.messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool" as const,
          content: m.content,
          tool_call_id: m.toolCallId ?? randomUUID(),
        };
      }
      return { role: m.role, content: m.content };
    });

    const tools = input.tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are Tharagai AI for Tharagai Readymades. Use only provided tools for catalogue, stock, orders, loyalty, and offers. Never invent prices, stock, products, or discounts. If tools return empty, say data is unavailable.",
          },
          ...messages,
        ],
        tools: tools.length ? tools : undefined,
        tool_choice: tools.length ? "auto" : undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`OpenAI error ${res.status}: ${body.slice(0, 500)}`);
      throw new Error(`OpenAI request failed (${res.status})`);
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const msg = json.choices?.[0]?.message;
    const toolCalls: AiToolCall[] | undefined = msg?.tool_calls?.map((tc) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return { id: tc.id, name: tc.function.name, arguments: args };
    });

    if (toolCalls?.length) {
      return { content: msg?.content ?? null, toolCalls };
    }
    return { content: msg?.content ?? "I could not generate a response." };
  }
}
