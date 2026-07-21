import type { IconName } from "../_components/ui";
import type { ChatVM } from "../_types/view";
import { isGroupLike, lastMessage, memberName } from "./chat";

export interface Preview {
  icon?: IconName;
  text: string;
}

const TYPE_ICONS: Record<string, IconName> = {
  image: "image",
  sticker: "sticker",
  document: "file",
  waypoint: "mappin",
  video: "play",
  audio: "volume",
};

const TYPE_KEYS: Record<string, string> = {
  image: "preview.photo",
  sticker: "preview.sticker",
  document: "preview.document",
  waypoint: "preview.location",
  video: "preview.video",
  audio: "preview.voiceNote",
};

/** One-line inbox preview of a chat's most recent message. */
export function previewOf(chat: ChatVM, myUuid: string, t: (key: string, values?: Record<string, string | number | Date>) => string): Preview {
  const m = lastMessage(chat);
  if (!m) return { text: t("preview.noMessages") };

  const mine = m.uuid === myUuid;
  const prefix = mine ? `${t("preview.you")}: ` : isGroupLike(chat.type) && m.type !== "system" ? `${memberName(chat, m.uuid)}: ` : "";

  if (m.type === "text" || m.type === "chat" || m.type === "emoji") return { text: prefix + m.content };
  if (m.type === "system") return { text: m.content };
  if (m.type === "call") {
    let missed = false;
    try {
      missed = !!JSON.parse(m.content)?.missed;
    } catch {
      /* legacy call payloads are plain values */
    }
    return { icon: "phone", text: missed ? t("preview.callMissed") : t("preview.call") };
  }
  const key = TYPE_KEYS[m.type];
  const icon = TYPE_ICONS[m.type];
  if (key) return { icon, text: prefix + t(key) };
  return { text: prefix + t("preview.message") };
}
