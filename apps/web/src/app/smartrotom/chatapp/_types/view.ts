import type { PresenceStatus } from "../_components/ui";

/** Chat type discriminator as stored by the API. */
export const CHAT_TYPE = { PUBLIC: 0, SAVED: 1, DIRECT: 2, GROUP: 3 } as const;

export interface Reaction {
  emoji: string;
  /** UUIDs of users who reacted. */
  by: string[];
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatMemberVM {
  uuid: string;
  username?: string;
}

export interface ChatMessageVM {
  id: number;
  content: string;
  createdAt: string;
  uuid: string;
  chatId: number;
  type: string;
  // Phase 5 (optional until the API returns them)
  reactions?: Reaction[];
  status?: MessageStatus;
  replyTo?: number | null; // [deferred] no reply API yet
}

export interface ChatVM {
  id: number;
  name: string;
  type: number;
  description?: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
  messages: ChatMessageVM[];
  unread: number;
  members: ChatMemberVM[];
  // Phase 5 wiring (optional until backed by the API)
  presence?: PresenceStatus;
  pinned?: boolean;
  muted?: boolean;
  typing?: boolean;
  summary?: string; // [deferred] no AI-summary API yet
}
