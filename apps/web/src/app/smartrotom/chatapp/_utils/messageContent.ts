import type {
  ImageMessageData,
  VideoMessageData,
  DocumentMessageData,
  WaypointMessageData,
  CallMessageData,
} from "../_types/Chat";

function tryJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export const parseImage = (content: string) => tryJson<ImageMessageData>(content);
export const parseVideo = (content: string) => tryJson<VideoMessageData>(content);
export const parseDocument = (content: string) => tryJson<DocumentMessageData>(content);
export const parseWaypoint = (content: string) => tryJson<WaypointMessageData>(content);

/** Call payloads are either a bare duration (secs) or a JSON `{ duration, participants }`. */
export function parseCall(content: string): CallMessageData | null {
  const n = parseInt(content, 10);
  if (!Number.isNaN(n) && String(n) === content.trim()) return { duration: n };
  return tryJson<CallMessageData>(content);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
