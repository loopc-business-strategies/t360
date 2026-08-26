import { Injectable, Logger } from "@nestjs/common";
import { SmsProvider } from "./sms-provider";

/**
 * MSG91 OTP + transactional SMS.
 * Requires MSG91_AUTH_KEY; OTP templates need MSG91_OTP_TEMPLATE_ID.
 */
@Injectable()
export class Msg91SmsProvider implements SmsProvider {
  readonly providerName = "msg91";
  private readonly logger = new Logger("Msg91SmsProvider");

  private authKey() {
    const key = process.env.MSG91_AUTH_KEY?.trim();
    if (!key) throw new Error("MSG91_AUTH_KEY missing");
    return key;
  }

  async sendOtp(mobile: string, code: string): Promise<void> {
    const authkey = this.authKey();
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim();
    const digits = mobile.replace(/^\+/, "");
    const url = "https://control.msg91.com/api/v5/otp";
    const body: Record<string, string> = {
      mobile: digits,
      otp: code,
    };
    if (templateId) body.template_id = templateId;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authkey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`MSG91 OTP failed: ${text}`);
      throw new Error(`MSG91 OTP error ${res.status}`);
    }
  }

  async send(to: string, body: string): Promise<{ messageId?: string }> {
    const authkey = this.authKey();
    const sender = process.env.MSG91_SENDER_ID?.trim() || "THRGAI";
    const digits = to.replace(/^\+/, "");
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        short_url: "0",
        recipients: [{ mobiles: digits, message: body }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`MSG91 SMS failed: ${text}`);
      throw new Error(`MSG91 SMS error ${res.status}`);
    }
    const json = (await res.json().catch(() => ({}))) as { request_id?: string };
    return { messageId: json.request_id };
  }
}
