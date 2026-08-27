import { Injectable, Logger } from "@nestjs/common";
import { SmsProvider } from "./sms-provider";

@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly providerName = "mock";
  private readonly logger = new Logger("MockSmsProvider");

  async sendOtp(mobile: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      this.logger.warn(`[DEV MOCK SMS] OTP sent for ${mobile} (code suppressed in production)`);
    } else {
      this.logger.warn(`[DEV MOCK SMS] OTP for ${mobile}: ${code}`);
    }
  }

  async send(to: string, body: string): Promise<{ messageId?: string }> {
    const messageId = `mock_sms_${Date.now()}`;
    this.logger.warn(`[DEV MOCK SMS] to=${to} body=${body} id=${messageId}`);
    return { messageId };
  }
}
