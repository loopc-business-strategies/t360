import { Injectable, Logger } from "@nestjs/common";
import { PushPayload, PushProvider } from "./push-provider";

/** Legacy FCM HTTP stub when PUSH_PROVIDER=fcm. */
@Injectable()
export class FcmPushProvider implements PushProvider {
  private readonly logger = new Logger("FcmPushProvider");

  async send(payload: PushPayload): Promise<{ messageId?: string }> {
    const key = process.env.FCM_SERVER_KEY;
    if (!key) throw new Error("FCM_SERVER_KEY missing");
    if (!payload.tokens.length) return {};
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registration_ids: payload.tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`FCM failed: ${text}`);
      throw new Error(`FCM error ${res.status}`);
    }
    const json = (await res.json()) as { multicast_id?: number };
    return { messageId: String(json.multicast_id ?? Date.now()) };
  }
}
