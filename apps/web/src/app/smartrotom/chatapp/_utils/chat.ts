import { CHAT_TYPE, type ChatMessageVM, type ChatVM } from "../_types/view";

export type ChatKind = "saved" | "direct" | "group" | "public";

export function chatKind(type: number): ChatKind {
  if (type === CHAT_TYPE.SAVED) return "saved";
  if (type === CHAT_TYPE.DIRECT) return "direct";
  if (type === CHAT_TYPE.PUBLIC) return "public";
  return "group";
}

/** Public + group chats show sender names/avatars; direct + saved do not. */
export const isGroupLike = (type: number) => type === CHAT_TYPE.PUBLIC || type === CHAT_TYPE.GROUP;
export const isDirect = (type: number) => type === CHAT_TYPE.DIRECT;
export const isSaved = (type: number) => type === CHAT_TYPE.SAVED;

/** Messages come newest-first from the API, so the latest is index 0. */
export const lastMessage = (chat: ChatVM): ChatMessageVM | undefined => chat.messages[0];

/** Resolve a member UUID to its display name (falls back to a short UUID). */
export function memberName(chat: ChatVM, uuid: string): string {
  const m = chat.members.find((x) => x.uuid === uuid);
  return m?.username || uuid.slice(0, 8);
}
