import { Injectable, Logger } from "@nestjs/common";
import { EmailPayload, EmailProvider } from "./email-provider";

@Injectable()
export class MockEmailProvider implements EmailProvider {
  private readonly logger = new Logger("MockEmailProvider");

  async send(payload: EmailPayload): Promise<{ messageId?: string }> {
    const messageId = `mock_email_${Date.now()}`;
    this.logger.warn(
      `[DEV MOCK EMAIL] to=${payload.to} subject=${payload.subject} id=${messageId}`,
    );
    return { messageId };
  }
}
