import { Injectable, Logger } from "@nestjs/common";
import { SmsProvider } from "./sms-provider";

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger("MockSmsProvider");

  async sendOtp(mobile: string, code: string): Promise<void> {
    this.logger.warn(`[DEV MOCK SMS] OTP for ${mobile}: ${code}`);
  }

  async send(to: string, body: string): Promise<{ messageId?: string }> {
    const messageId = `mock_sms_${Date.now()}`;
    this.logger.warn(`[DEV MOCK SMS] to=${to} body=${body} id=${messageId}`);
    return { messageId };
  }
}
