import type { PresenceStatus } from "../_components/ui";
import type { Chat, ChatMember, ChatMessage, MessageReaction } from "@boffmedia/shared";

/** Chat type discriminator as stored by the API. */
export const CHAT_TYPE = { PUBLIC: 0, SAVED: 1, DIRECT: 2, GROUP: 3 } as const;

export type Reaction = MessageReaction;

export type MessageStatus = "sent" | "delivered" | "read";

export type ChatMemberVM = ChatMember;

export interface ChatMessageVM extends Omit<ChatMessage, "type" | "status" | "uuid"> {
  uuid: string;
  chatId: number;
  // The entity declares `type?: string | null`, but NestJS/swagger can't reflect a
  // union design:type and falls back to `object`, so the generated model widens it
  // to `Record<string, any>`. Narrowed back to what the wire actually sends.
  type: string;
  // Optional until the API returns them
  status?: MessageStatus;
  replyTo?: number | null; // [deferred] no reply API yet
}

export interface ChatVM extends Omit<Chat, "description" | "createdAt" | "updatedAt" | "messages" | "members"> {
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  messages: ChatMessageVM[];
  members: ChatMemberVM[];
  // Optional until backed by the API
  presence?: PresenceStatus;
  pinned?: boolean;
  muted?: boolean;
  typing?: boolean;
  summary?: string; // [deferred] no AI-summary API yet
}
