export interface SmsProvider {
  sendOtp(mobile: string, code: string): Promise<void>;
  send(to: string, body: string): Promise<{ messageId?: string }>;
}

export const SMS_PROVIDER = Symbol("SMS_PROVIDER");
