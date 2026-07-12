import type { ChatVM } from "../_types/view";
import type { ImageMessageData, WaypointMessageData, DocumentMessageData, VideoMessageData } from "../_types/Chat";
import { parseImage, parseVideo, parseDocument, parseWaypoint } from "./messageContent";

export interface SharedImage extends ImageMessageData {
  messageId: number;
}

/** Media/waypoints/docs/videos shared within a chat, derived from its messages (newest-first). */
export function sharedImages(chat: ChatVM): SharedImage[] {
  return chat.messages
    .filter((m) => m.type === "image")
    .map((m) => {
      const d = parseImage(m.content);
      return d ? { ...d, messageId: m.id } : null;
    })
    .filter((x): x is SharedImage => x != null);
}

export function sharedWaypoints(chat: ChatVM): WaypointMessageData[] {
  return chat.messages.filter((m) => m.type === "waypoint").map((m) => parseWaypoint(m.content)).filter((x): x is WaypointMessageData => x != null);
}

export function sharedDocuments(chat: ChatVM): DocumentMessageData[] {
  return chat.messages.filter((m) => m.type === "document").map((m) => parseDocument(m.content)).filter((x): x is DocumentMessageData => x != null);
}

export function sharedVideos(chat: ChatVM): VideoMessageData[] {
  return chat.messages.filter((m) => m.type === "video").map((m) => parseVideo(m.content)).filter((x): x is VideoMessageData => x != null);
}
