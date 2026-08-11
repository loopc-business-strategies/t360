import { Injectable, Logger } from "@nestjs/common";
import { PushPayload, PushProvider } from "./push-provider";

@Injectable()
export class MockPushProvider implements PushProvider {
  private readonly logger = new Logger("MockPushProvider");

  async send(payload: PushPayload): Promise<{ messageId?: string }> {
    const messageId = `mock_push_${Date.now()}`;
    this.logger.warn(
      `[DEV MOCK PUSH] tokens=${payload.tokens.length} title=${payload.title} id=${messageId}`,
    );
    return { messageId };
  }
}
