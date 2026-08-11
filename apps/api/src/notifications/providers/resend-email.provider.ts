import { Injectable, Logger } from "@nestjs/common";
import { EmailPayload, EmailProvider } from "./email-provider";

/** Thin Resend HTTP stub — used when EMAIL_PROVIDER=resend and RESEND_API_KEY set. */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger("ResendEmailProvider");

  async send(payload: EmailPayload): Promise<{ messageId?: string }> {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY missing");
    }
    const from = process.env.RESEND_FROM ?? "Tharagai <noreply@tharagai.local>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? payload.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Resend failed: ${text}`);
      throw new Error(`Resend error ${res.status}`);
    }
    const json = (await res.json()) as { id?: string };
    return { messageId: json.id };
  }
}
