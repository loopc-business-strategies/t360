export function renderTemplate(body: string, data: Record<string, string | number | undefined>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = data[key];
    return v == null ? "" : String(v);
  });
}

/** Order lifecycle events are transactional — ignore marketing preference flags. */
export function isTransactionalEvent(eventCode: string): boolean {
  return eventCode.startsWith("order.");
}

export function eventToTemplateCode(eventCode: string): string {
  return eventCode;
}

export function statusToEventCode(status: string): string | null {
  switch (status) {
    case "Confirmed":
      return "order.confirmed";
    case "Packed":
    case "OutForDelivery":
      return "order.shipped";
    case "Delivered":
      return "order.delivered";
    case "Cancelled":
      return "order.cancelled";
    default:
      return null;
  }
}

export function channelAllowedByPrefs(
  channel: string,
  transactional: boolean,
  prefs: {
    marketingEmail: boolean;
    marketingSms: boolean;
    marketingPush: boolean;
    marketingWhatsapp: boolean;
  },
): boolean {
  if (transactional) return true;
  switch (channel) {
    case "email":
      return prefs.marketingEmail;
    case "sms":
      return prefs.marketingSms;
    case "push":
      return prefs.marketingPush;
    case "whatsapp":
      return prefs.marketingWhatsapp;
    default:
      return false;
  }
}
