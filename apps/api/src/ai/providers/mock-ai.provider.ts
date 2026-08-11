import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AiChatInput, AiChatResult, AiProvider, AiToolCall } from "./ai-provider";

@Injectable()
export class MockAiProvider implements AiProvider {
  async chat(input: AiChatInput): Promise<AiChatResult> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const toolResults = input.messages.filter((m) => m.role === "tool");
    const text = (lastUser?.content ?? "").toLowerCase();

    if (toolResults.length > 0) {
      return { content: this.summarize(toolResults.map((t) => t.content), text) };
    }

    const calls = this.pickTools(text, input.audience, input.tools.map((t) => t.name));
    if (calls.length === 0) {
      return {
        content:
          "I can help with products, stock, orders, loyalty, and offers using live store data. Ask about a product, category, or your order.",
      };
    }
    return { content: null, toolCalls: calls };
  }

  private pickTools(text: string, audience: "customer" | "admin", available: string[]): AiToolCall[] {
    const has = (n: string) => available.includes(n);
    const call = (name: string, args: Record<string, unknown> = {}): AiToolCall => ({
      id: randomUUID(),
      name,
      arguments: args,
    });

    if (audience === "admin") {
      if (/caption|copy|social/.test(text) && has("draftProductCaption")) {
        const idMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return [call("draftProductCaption", { productId: idMatch?.[0] ?? "", q: text })];
      }
      if (/low.?stock|out of stock/.test(text) && has("lowStockHighSellers")) {
        return [call("lowStockHighSellers", {})];
      }
      if (/best.?seller|top product/.test(text) && has("bestSellers")) {
        return [call("bestSellers", {})];
      }
      if (/sales|revenue|summary/.test(text) && has("salesSummary")) {
        return [call("salesSummary", {})];
      }
      if (has("salesSummary")) return [call("salesSummary", {})];
      return [];
    }

    if (/loyalt|points|reward/.test(text) && has("getCustomerLoyalty")) {
      return [call("getCustomerLoyalty", {})];
    }
    if (/order|track|shipment|deliver/.test(text) && has("getOrderStatus")) {
      const idMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      return [call("getOrderStatus", idMatch ? { orderId: idMatch[0] } : {})];
    }
    if (/offer|coupon|discount/.test(text) && has("getOffers")) {
      return [call("getOffers", {})];
    }
    if (/categor/.test(text) && has("searchCategories")) {
      return [call("searchCategories", { q: text })];
    }
    if (/branch.*(stock|avail)|avail.*branch/.test(text) && has("getBranchAvailability")) {
      return [call("getBranchAvailability", { q: text })];
    }
    if (/stock|availab|in stock/.test(text) && has("checkStock")) {
      return [call("checkStock", { q: text })];
    }
    if (/uuid|product id|slug|get product/.test(text) && has("getProduct")) {
      const idMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      return [call("getProduct", { slugOrId: idMatch?.[0] ?? text })];
    }
    if (has("searchProducts")) {
      const maxPrice = this.extractMaxPrice(text);
      return [
        call("searchProducts", {
          q: this.extractQuery(text),
          ...(maxPrice != null ? { maxPrice } : {}),
          pageSize: 5,
        }),
      ];
    }
    return [];
  }

  private extractMaxPrice(text: string): number | null {
    const m = text.match(/(?:under|below|less than|<)\s*₹?\s*(\d+)/i) || text.match(/₹\s*(\d+)/);
    return m ? Number(m[1]) : null;
  }

  private extractQuery(text: string): string {
    return text
      .replace(/under\s*₹?\s*\d+/gi, "")
      .replace(/below\s*₹?\s*\d+/gi, "")
      .replace(/₹\s*\d+/g, "")
      .trim()
      .slice(0, 120) || "readymades";
  }

  private summarize(toolContents: string[], userText: string): string {
    const parsed = toolContents.map((c) => {
      try {
        return JSON.parse(c) as unknown;
      } catch {
        return c;
      }
    });

    for (const p of parsed) {
      if (p && typeof p === "object" && "error" in (p as object)) {
        return `I could not complete that lookup: ${String((p as { error: string }).error)}. Please try again with more detail.`;
      }
      if (p && typeof p === "object" && "unavailable" in (p as object)) {
        return String((p as { unavailable: string }).unavailable);
      }
      if (Array.isArray(p) && p.length === 0) {
        return "I could not find matching items in the live catalogue for that request. Nothing is available that matches those filters.";
      }
      if (p && typeof p === "object" && "items" in (p as object)) {
        const items = (p as { items: unknown[] }).items;
        if (!Array.isArray(items) || items.length === 0) {
          return "No products matched that search in our catalogue. I will not invent products or prices.";
        }
      }
    }

    const blob = JSON.stringify(parsed, null, 0);
    if (blob.length < 20 || blob === "[]" || blob === "{}") {
      return "Live data returned nothing useful for that question. Please rephrase or ask about a different product.";
    }

    return [
      "Here is what I found from live store data (not guessed):",
      "```json",
      JSON.stringify(parsed, null, 2).slice(0, 3500),
      "```",
      userText.includes("caption")
        ? "Use only the product fields above for any marketing copy."
        : "Ask a follow-up if you need stock by branch or a specific product.",
    ].join("\n");
  }
}
