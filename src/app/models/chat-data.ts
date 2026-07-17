export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

// Mirror of the API's request-shape limits (portfolio-api lambda/chat-schema.ts);
// requests outside these bounds are rejected with a 400.
export const CHAT_MAX_MESSAGES = 8;
export const CHAT_MAX_MESSAGE_CHARS = 1000;
