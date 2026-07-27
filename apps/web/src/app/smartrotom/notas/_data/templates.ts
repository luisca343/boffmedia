import type { IconName } from "../_components/ui";

export interface NoteTemplate {
  id: string;
  /** `notas` message key — the picker resolves it with `t(...)`. */
  nameKey: string;
  icon: IconName;
  descKey: string;
  contentKey: string;
}

// Built-in starter templates (client-side; creating one POSTs a new note).
export const TEMPLATES: NoteTemplate[] = [
  {
    id: "set",
    nameKey: "templates.items.set.name",
    icon: "swatch",
    descKey: "templates.items.set.desc",
    contentKey: "templates.items.set.content",
  },
  {
    id: "team",
    nameKey: "templates.items.team.name",
    icon: "layers",
    descKey: "templates.items.team.desc",
    contentKey: "templates.items.team.content",
  },
  {
    id: "raid",
    nameKey: "templates.items.raid.name",
    icon: "zap",
    descKey: "templates.items.raid.desc",
    contentKey: "templates.items.raid.content",
  },
  {
    id: "diary",
    nameKey: "templates.items.diary.name",
    icon: "file-text",
    descKey: "templates.items.diary.desc",
    contentKey: "templates.items.diary.content",
  },
  {
    id: "blank",
    nameKey: "templates.items.blank.name",
    icon: "file",
    descKey: "templates.items.blank.desc",
    contentKey: "templates.items.blank.content",
  },
];
