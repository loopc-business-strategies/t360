import { createHmac, timingSafeEqual } from "crypto";
import { Injectable, Logger } from "@nestjs/common";
import { WhatsappProvider, WhatsappTemplatePayload } from "./whatsapp-provider";

@Injectable()
export class CloudWhatsappProvider implements WhatsappProvider {
  readonly name = "whatsapp_cloud";
  private readonly logger = new Logger("CloudWhatsappProvider");

  async sendTemplate(payload: WhatsappTemplatePayload): Promise<{ messageId?: string }> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing");
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: payload.to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: payload.templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: payload.params.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`WA send failed: ${text}`);
      throw new Error(`WhatsApp error ${res.status}`);
    }
    const json = (await res.json()) as { messages?: Array<{ id: string }> };
    return { messageId: json.messages?.[0]?.id };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    const secret = process.env.WHATSAPP_APP_SECRET ?? "";
    if (!secret) return false;
    if (!signatureHeader?.startsWith("sha256=")) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const received = signatureHeader.slice("sha256=".length);
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
    } catch {
      return false;
    }
  }
}
