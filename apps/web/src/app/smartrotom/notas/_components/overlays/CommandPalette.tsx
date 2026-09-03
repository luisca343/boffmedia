"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Overlay, MODAL_PANEL, Icon, Kbd, type IconName } from "../ui";
import type { NoteVM } from "../../_types";

export interface Command {
  id: string;
  label: string;
  icon: IconName;
  kbd?: string;
  run: () => void;
}

export function CommandPalette({
  notes,
  commands,
  onClose,
  onOpenNote,
}: {
  notes: NoteVM[];
  commands: Command[];
  onClose: () => void;
  onOpenNote: (id: number) => void;
}) {
  const t = useTranslations("notas");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);

  const filteredCommands = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [commands, q],
  );
  const filteredNotes = useMemo(() => {
    if (!q) return notes.slice(0, 6);
    const ql = q.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(ql)).slice(0, 8);
  }, [notes, q]);

  const flat = useMemo(
    () => [
      ...filteredCommands.map((c) => ({ kind: "cmd" as const, cmd: c })),
      ...filteredNotes.map((n) => ({ kind: "note" as const, note: n })),
    ],
    [filteredCommands, filteredNotes],
  );

  const run = (i: number) => {
    const item = flat[i];
    if (!item) return;
    if (item.kind === "cmd") item.cmd.run();
    else onOpenNote(item.note.id);
    onClose();
  };

  return (
    <Overlay onClose={onClose} align="start">
      <div className={`${MODAL_PANEL} mt-[12vh] w-[37.5rem] max-w-[92vw]`}>
        <div className="flex items-center gap-3 border-b border-nt-border px-[1.125rem] py-4">
          <Icon name="search" size={18} className="text-nt-fg-subtle" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(sel);
              }
            }}
            placeholder={t("palette.placeholder")}
            className="flex-1 bg-transparent text-[1.0625rem] text-nt-fg outline-none placeholder:text-nt-fg-subtle"
          />
        </div>
        <div className="nt-scroll max-h-[23.75rem] overflow-auto p-2">
          {filteredCommands.length > 0 && (
            <div className="px-2.5 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[.08em] text-nt-fg-subtle">
              {t("palette.actions")}
            </div>
          )}
          {flat.map((item, i) => {
            const active = i === sel;
            const icon: IconName = item.kind === "cmd" ? item.cmd.icon : "file-text";
            const label = item.kind === "cmd" ? item.cmd.label : item.note.title || t("list.untitled");
            return (
              <div key={i}>
                {item.kind === "note" && i === filteredCommands.length && (
                  <div className="px-2.5 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[.08em] text-nt-fg-subtle">
                    {t("palette.notes")}
                  </div>
                )}
                <div
                  onMouseEnter={() => setSel(i)}
                  onClick={() => run(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-nt-md px-[0.6875rem] py-2.5 ${
                    active ? "bg-nt-accent/15 text-nt-fg" : "text-nt-fg-muted"
                  }`}
                >
                  <span
                    className={`grid h-[1.875rem] w-[1.875rem] flex-none place-items-center rounded-nt-md ${
                      active ? "bg-nt-accent text-nt-on-accent" : "bg-nt-hover-strong text-nt-fg-muted"
                    }`}
                  >
                    <Icon name={icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.875rem] text-nt-fg">{label}</span>
                  {item.kind === "cmd" && item.cmd.kbd && <Kbd>{item.cmd.kbd}</Kbd>}
                </div>
              </div>
            );
          })}
          {flat.length === 0 && (
            <div className="px-3 py-8 text-center text-[0.8125rem] text-nt-fg-subtle">{t("palette.noResults")}</div>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-nt-border px-4 py-2.5 text-[0.6875rem] text-nt-fg-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {t("palette.navigate")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> {t("palette.open")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>esc</Kbd> {t("palette.close")}
          </span>
        </div>
      </div>
    </Overlay>
  );
}
