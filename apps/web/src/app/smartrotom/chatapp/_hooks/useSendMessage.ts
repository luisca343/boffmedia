import { useCallback } from "react";
import { toast } from "react-toastify";
import { CreateMessageDto } from "@boffmedia/shared";
import { getSmartRotomUser } from "@/lib/utils";
import { ChatAppService } from "@/services/api/smartrotom/chatAppService";
import type { Screenshot } from "@/stores/cameraGalleryStore";
import type { ChatMessageVM } from "../_types/view";

const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const emojis = t.match(EMOJI_RE);
  if (!emojis?.length) return false;
  return t.replace(EMOJI_RE, "").replace(/[‍️\s]/g, "").trim().length === 0;
}

function youTubeId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/, /youtube\.com\/shorts\/([^&\n?#]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

const isYouTube = (t: string) => /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(t.trim());

/** Centralised, real send handlers (optimistic + `createMessage`). */
export function useSendMessage(chatId: number, session: unknown, onSent: (m: ChatMessageVM) => void) {
  const uuid = getSmartRotomUser(session).uuid;

  const push = useCallback(
    (content: string, type: string, apiType: CreateMessageDto.type, apiMessage = content, fail = "No se pudo enviar el mensaje") => {
      onSent({ id: Date.now(), content, createdAt: new Date().toISOString(), uuid, chatId, type, status: "sent" });
      ChatAppService.createMessage(chatId, { message: apiMessage, uuid, type: apiType }).catch((e) => {
        console.error(fail, e);
        toast.error(fail);
      });
    },
    [chatId, uuid, onSent],
  );

  const sendText = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      if (isYouTube(text)) {
        const id = youTubeId(text);
        if (id) {
          const data = JSON.stringify({ videoId: id, url: text, title: "Vídeo de YouTube" });
          return push(data, "video", CreateMessageDto.type.VIDEO, data, "No se pudo enviar el vídeo");
        }
      }
      const emoji = isEmojiOnly(text);
      push(text, emoji ? "emoji" : "text", emoji ? CreateMessageDto.type.EMOJI : CreateMessageDto.type.TEXT);
    },
    [push],
  );

  const sendSticker = useCallback((path: string) => push(path, "sticker", CreateMessageDto.type.STICKER), [push]);

  const sendWaypoint = useCallback(
    (w: { name: string; x: number; y: number; z: number; dimension?: string; color?: string }) => {
      const data = JSON.stringify(w);
      push(data, "waypoint", CreateMessageDto.type.WAYPOINT, data, "No se pudo enviar el waypoint");
    },
    [push],
  );

  const sendDocument = useCallback(
    (d: { id: string; title: string; content: string }) => {
      const data = JSON.stringify({ documentId: parseInt(d.id, 10), title: d.title, content: d.content });
      push(data, "document", CreateMessageDto.type.DOCUMENT, data, "No se pudo enviar el documento");
    },
    [push],
  );

  const sendImage = useCallback(
    (screenshot: Screenshot, caption?: string) => {
      const optimistic = JSON.stringify({
        imageUrl: screenshot.image,
        meta: { id: screenshot.id, timestamp: screenshot.timestamp, location: screenshot.location, entities: screenshot.entities, ...(caption ? { caption } : {}) },
      });
      const backend = JSON.stringify({ caption, screenshot });
      push(optimistic, "image", CreateMessageDto.type.IMAGE, backend, "No se pudo enviar la imagen");
    },
    [push],
  );

  return { sendText, sendSticker, sendWaypoint, sendDocument, sendImage };
}
