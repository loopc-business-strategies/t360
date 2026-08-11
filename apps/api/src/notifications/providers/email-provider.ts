export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ messageId?: string }>;
}

export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");
