"use client";

import { useMemo, useState } from "react";
import type { NoteFolder, NoteTag } from "@boffmedia/shared";
import { Icon, MiniTag, Avatar } from "./ui";
import { outline, extractLinks } from "../_utils/wikilinks";
import { stripHtml } from "../_utils/content";
import { fullDate } from "../_utils/format";
import { hashColor, COLOR_RGB } from "../_utils/colors";
import type { NoteVM } from "../_types";

interface ContextPanelProps {
  note: NoteVM;
  activeContent: string;
  notes: NoteVM[];
  contentById: Record<number, string>;
  folders: NoteFolder[];
  tags: NoteTag[];
  onOpenNote: (id: number) => void;
  onScrollTo: (title: string) => void;
}

type Tab = "outline" | "backlinks" | "info";

export function ContextPanel(props: ContextPanelProps) {
  const { note, activeContent, notes, contentById, folders, tags } = props;
  const [tab, setTab] = useState<Tab>("outline");

  const headings = useMemo(() => outline(activeContent), [activeContent]);
  const folder = folders.find((f) => f.id === note.folderId);

  const backlinks = useMemo(() => {
    return notes
      .filter((n) => n.id !== note.id && extractLinks(contentById[n.id] ?? "").includes(note.title))
      .map((n) => ({ id: n.id, title: n.title, ctx: stripHtml(contentById[n.id] ?? "").slice(0, 90) }));
  }, [notes, contentById, note.id, note.title]);

  const tabCls = (t: Tab) =>
    `inline-flex cursor-pointer items-center gap-1.5 rounded-t-nt-sm border-b-2 px-2.5 py-[7px] text-[12px] ${
      tab === t ? "border-nt-accent text-nt-fg" : "border-transparent text-nt-fg-muted"
    }`;

  return (
    <aside
      className="flex w-[280px] flex-none flex-col border-l border-nt-border bg-nt-bg-2 max-lg:hidden"
      aria-label="Panel de contexto"
    >
      <div className="flex gap-0.5 border-b border-nt-border px-2.5 pt-2">
        <div className={tabCls("outline")} onClick={() => setTab("outline")}>
          <Icon name="list" size={14} /> Esquema
        </div>
        <div className={tabCls("backlinks")} onClick={() => setTab("backlinks")}>
          <Icon name="link" size={14} /> Enlaces{backlinks.length ? ` ${backlinks.length}` : ""}
        </div>
        <div className={tabCls("info")} onClick={() => setTab("info")}>
          <Icon name="settings" size={14} />
        </div>
      </div>

      <div className="nt-scroll flex-1 overflow-auto p-3">
        {tab === "outline" &&
          (headings.length ? (
            headings.map((h, i) => (
              <button
                key={i}
                onClick={() => props.onScrollTo(h.text)}
                className={`block w-full cursor-pointer rounded-nt-sm px-2 py-[5px] text-left text-[13px] leading-[1.4] text-nt-fg-muted hover:bg-nt-hover hover:text-nt-fg ${
                  h.level === 2 ? "pl-5 text-[12.5px]" : h.level === 3 ? "pl-8 text-[12px] text-nt-fg-subtle" : ""
                }`}
              >
                {h.text}
              </button>
            ))
          ) : (
            <div className="px-2.5 py-[30px] text-center text-[12.5px] leading-[1.6] text-nt-fg-subtle">
              Añade títulos para ver el esquema del documento.
            </div>
          ))}

        {tab === "backlinks" &&
          (backlinks.length ? (
            backlinks.map((b) => (
              <div
                key={b.id}
                onClick={() => props.onOpenNote(b.id)}
                className="mb-2 cursor-pointer rounded-nt-md border border-nt-border bg-nt-bg-1 px-[11px] py-2.5 transition-colors hover:border-nt-border-2 hover:bg-nt-hover"
              >
                <div className="mb-[3px] flex items-center gap-1.5 text-[13px] font-semibold text-nt-fg">
                  <Icon name="pencil" size={13} className="text-nt-accent-fg" />
                  {b.title}
                </div>
                {b.ctx && <div className="text-[12px] leading-[1.5] text-nt-fg-muted">…{b.ctx}…</div>}
              </div>
            ))
          ) : (
            <div className="px-2.5 py-[30px] text-center text-[12.5px] leading-[1.6] text-nt-fg-subtle">
              Ninguna nota enlaza aquí todavía.
              <br />
              Usa{" "}
              <code className="rounded bg-nt-hover-strong px-1.5 py-px font-nt-mono text-nt-accent-fg">[[</code>{" "}
              para crear enlaces.
            </div>
          ))}

        {tab === "info" && (
          <div className="flex flex-col gap-3.5 text-[13px] text-nt-fg-muted">
            <InfoRow label="Carpeta">{folder?.name || "—"}</InfoRow>
            <InfoRow label="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {note.tags.length
                  ? note.tags.map((t) => {
                      const tag = tags.find((x) => x.id === t);
                      return tag ? <MiniTag key={t} label={tag.label} color={tag.color} /> : null;
                    })
                  : "—"}
              </div>
            </InfoRow>
            <InfoRow label="Compartida con">
              {note.sharedWith.length ? (
                note.sharedWith.map((u) => (
                  <div key={u} className="mb-1.5 flex items-center gap-2">
                    <Avatar name={u} color={`rgb(${COLOR_RGB[hashColor(u)]})`} size={22} />
                    <span className="truncate text-[12.5px]">{u}</span>
                  </div>
                ))
              ) : (
                "Privada"
              )}
            </InfoRow>
            <InfoRow label="Creada">{fullDate(note.createdMs)}</InfoRow>
            <InfoRow label="Modificada">{fullDate(note.updatedMs)}</InfoRow>
            <InfoRow label="Visibilidad">
              <span className="inline-flex items-center gap-1.5">
                <Icon name={note.public ? "globe" : "lock"} size={14} />
                {note.public ? "Pública" : "Privada"}
              </span>
            </InfoRow>
          </div>
        )}
      </div>
    </aside>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 font-nt-display text-[10px] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}
