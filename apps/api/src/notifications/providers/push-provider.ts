export type PushPayload = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

export interface PushProvider {
  send(payload: PushPayload): Promise<{ messageId?: string }>;
}

export const PUSH_PROVIDER = Symbol("PUSH_PROVIDER");
