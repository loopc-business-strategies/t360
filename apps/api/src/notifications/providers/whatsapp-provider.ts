export type WhatsappTemplatePayload = {
  to: string;
  templateName: string;
  params: string[];
  body?: string;
};

export interface WhatsappProvider {
  name: string;
  sendTemplate(payload: WhatsappTemplatePayload): Promise<{ messageId?: string }>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean;
}

export const WHATSAPP_PROVIDER = Symbol("WHATSAPP_PROVIDER");
