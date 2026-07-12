import type { IconName } from "../_components/ui";
import type { ChatVM } from "../_types/view";
import { isGroupLike, lastMessage, memberName } from "./chat";

export interface Preview {
  icon?: IconName;
  text: string;
}

const LABELS: Record<string, { icon?: IconName; text: string }> = {
  image: { icon: "image", text: "Foto" },
  sticker: { icon: "sticker", text: "Sticker" },
  document: { icon: "file", text: "Documento" },
  waypoint: { icon: "mappin", text: "Ubicación" },
  video: { icon: "play", text: "Vídeo" },
  audio: { icon: "volume", text: "Nota de voz" },
};

/** One-line inbox preview of a chat's most recent message. */
export function previewOf(chat: ChatVM, myUuid: string): Preview {
  const m = lastMessage(chat);
  if (!m) return { text: "No hay mensajes" };

  const mine = m.uuid === myUuid;
  const prefix = mine ? "Tú: " : isGroupLike(chat.type) && m.type !== "system" ? `${memberName(chat, m.uuid)}: ` : "";

  if (m.type === "text" || m.type === "chat" || m.type === "emoji") return { text: prefix + m.content };
  if (m.type === "system") return { text: m.content };
  if (m.type === "call") {
    let missed = false;
    try {
      missed = !!JSON.parse(m.content)?.missed;
    } catch {
      /* legacy call payloads are plain values */
    }
    return { icon: "phone", text: missed ? "Llamada perdida" : "Llamada" };
  }
  const label = LABELS[m.type];
  if (label) return { icon: label.icon, text: prefix + label.text };
  return { text: prefix + "Mensaje" };
}
