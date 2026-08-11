import { Injectable, Logger } from "@nestjs/common";
import { WhatsappProvider, WhatsappTemplatePayload } from "./whatsapp-provider";

@Injectable()
export class MockWhatsappProvider implements WhatsappProvider {
  readonly name = "mock";
  private readonly logger = new Logger("MockWhatsappProvider");

  async sendTemplate(payload: WhatsappTemplatePayload): Promise<{ messageId?: string }> {
    const messageId = `mock_wa_${Date.now()}`;
    this.logger.warn(
      `[DEV MOCK WA] to=${payload.to} template=${payload.templateName} id=${messageId}`,
    );
    return { messageId };
  }

  verifyWebhookSignature(_rawBody: string, _signatureHeader: string | undefined): boolean {
    return true;
  }
}
