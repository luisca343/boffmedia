import type { NotePreview } from "@boffmedia/shared";

export type ViewType = "smart" | "folder" | "tag" | "trash";

// Smart-view ids: all | pinned | shared | recent
export interface View {
  type: ViewType;
  id: string | number;
}

// A note as the UI holds it: the preview fields plus optional loaded content and
// normalized epoch-ms timestamps for sorting/formatting.
export interface NoteVM extends NotePreview {
  content?: string;
  createdMs: number;
  updatedMs: number;
}

export type SortKey = "updated" | "created" | "title";

export type ModalKind =
  | "cmdk"
  | "qc"
  | "share"
  | "history"
  | "templates"
  | "graph";
