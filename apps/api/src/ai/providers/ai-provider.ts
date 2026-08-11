export type AiChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolCallId?: string;
};

export type AiToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AiToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AiChatInput = {
  messages: AiChatMessage[];
  tools: AiToolDef[];
  audience: "customer" | "admin";
};

export type AiChatResult = {
  content: string | null;
  toolCalls?: AiToolCall[];
};

export interface AiProvider {
  chat(input: AiChatInput): Promise<AiChatResult>;
}

export const AI_PROVIDER = Symbol("AI_PROVIDER");
