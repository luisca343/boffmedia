"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("notas");
  const locale = useLocale();
  const { note, activeContent, notes, contentById, folders, tags } = props;
  const [tab, setTab] = useState<Tab>("outline");

  const headings = useMemo(() => outline(activeContent), [activeContent]);
  const folder = folders.find((f) => f.id === note.folderId);

  const backlinks = useMemo(() => {
    return notes
      .filter((n) => n.id !== note.id && extractLinks(contentById[n.id] ?? "").includes(note.title))
      .map((n) => ({ id: n.id, title: n.title, ctx: stripHtml(contentById[n.id] ?? "").slice(0, 90) }));
  }, [notes, contentById, note.id, note.title]);

  // Links this note makes. A title with no matching note is still shown (dimmed)
  // — the target is created the moment the writer picks «Crear …».
  const outgoing = useMemo(() => {
    return extractLinks(activeContent).map((title) => ({
      title,
      target: notes.find((n) => n.title === title) ?? null,
    }));
  }, [activeContent, notes]);

  const linkCount = outgoing.length + backlinks.length;

  const tabCls = (t: Tab) =>
    `inline-flex cursor-pointer items-center gap-1.5 rounded-t-nt-sm border-b-2 px-2.5 py-[0.4375rem] text-[0.75rem] ${
      tab === t ? "border-nt-accent text-nt-fg" : "border-transparent text-nt-fg-muted"
    }`;

  return (
    <aside
      className="flex w-[17.5rem] flex-none flex-col border-l border-nt-border bg-nt-bg-2 max-lg:hidden"
      aria-label={t("context.outline")}
    >
      <div className="flex gap-0.5 border-b border-nt-border px-2.5 pt-2">
        <div className={tabCls("outline")} onClick={() => setTab("outline")}>
          <Icon name="list" size={14} /> {t("context.outline")}
        </div>
        <div className={tabCls("backlinks")} onClick={() => setTab("backlinks")}>
          <Icon name="link" size={14} /> {t("context.links")}{linkCount ? ` ${linkCount}` : ""}
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
                className={`block w-full cursor-pointer rounded-nt-sm px-2 py-[0.3125rem] text-left text-[0.8125rem] leading-[1.4] text-nt-fg-muted hover:bg-nt-hover hover:text-nt-fg ${
                  h.level === 2 ? "pl-5 text-[0.78125rem]" : h.level === 3 ? "pl-8 text-[0.75rem] text-nt-fg-subtle" : ""
                }`}
              >
                {h.text}
              </button>
            ))
          ) : (
            <div className="px-2.5 py-[1.875rem] text-center text-[0.78125rem] leading-[1.6] text-nt-fg-subtle">
              {t("context.outlineHint")}
            </div>
          ))}

        {tab === "backlinks" &&
          (linkCount ? (
            <>
              {outgoing.length > 0 && (
                <>
                  <SectionLabel>{t("context.outgoing")}</SectionLabel>
                  {outgoing.map((o, i) => (
                    <button
                      key={i}
                      disabled={!o.target}
                      onClick={() => o.target && props.onOpenNote(o.target.id)}
                      className="mb-1.5 flex w-full items-center gap-1.5 rounded-nt-md border border-nt-border bg-nt-bg-1 px-[0.6875rem] py-2 text-left text-[0.8125rem] transition-colors enabled:cursor-pointer enabled:hover:border-nt-border-2 enabled:hover:bg-nt-hover disabled:opacity-55"
                    >
                      <Icon name="link" size={13} className="flex-none text-nt-accent-fg" />
                      <span className="min-w-0 flex-1 truncate font-medium text-nt-fg">{o.title}</span>
                      {!o.target && (
                        <span className="flex-none text-[0.65625rem] text-nt-fg-subtle">{t("context.uncreated")}</span>
                      )}
                    </button>
                  ))}
                </>
              )}
              {backlinks.length > 0 && (
                <>
                  <SectionLabel>{t("context.incoming")}</SectionLabel>
                  {backlinks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => props.onOpenNote(b.id)}
                      className="mb-2 cursor-pointer rounded-nt-md border border-nt-border bg-nt-bg-1 px-[0.6875rem] py-2.5 transition-colors hover:border-nt-border-2 hover:bg-nt-hover"
                    >
                      <div className="mb-[3px] flex items-center gap-1.5 text-[0.8125rem] font-semibold text-nt-fg">
                        <Icon name="pencil" size={13} className="text-nt-accent-fg" />
                        {b.title}
                      </div>
                      {b.ctx && <div className="text-[0.75rem] leading-[1.5] text-nt-fg-muted">…{b.ctx}…</div>}
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="px-2.5 py-[1.875rem] text-center text-[0.78125rem] leading-[1.6] text-nt-fg-subtle">
              {t("context.noBacklinks")}
              <br />
              {t("context.useWikilinks")}{" "}
              <code className="rounded bg-nt-hover-strong px-1.5 py-px font-nt-mono text-nt-accent-fg">[[</code>{" "}
              {t("context.toCreateLinks")}
            </div>
          ))}

        {tab === "info" && (
          <div className="flex flex-col gap-3.5 text-[0.8125rem] text-nt-fg-muted">
            <InfoRow label={t("context.folder")}>{folder?.name || "—"}</InfoRow>
            <InfoRow label={t("context.tags")}>
              <div className="flex flex-wrap gap-1.5">
                {note.tags.length
                  ? note.tags.map((t) => {
                      const tag = tags.find((x) => x.id === t);
                      return tag ? <MiniTag key={t} label={tag.label} color={tag.color} /> : null;
                    })
                  : "—"}
              </div>
            </InfoRow>
            <InfoRow label={t("context.sharedWith")}>
              {note.sharedWith.length ? (
                note.sharedWith.map((u) => (
                  <div key={u} className="mb-1.5 flex items-center gap-2">
                    <Avatar name={u} color={`rgb(${COLOR_RGB[hashColor(u)]})`} size={22} />
                    <span className="truncate text-[0.78125rem]">{u}</span>
                  </div>
                ))
              ) : (
                t("context.private")
              )}
            </InfoRow>
            <InfoRow label={t("context.created")}>{fullDate(note.createdMs, locale)}</InfoRow>
            <InfoRow label={t("context.modified")}>{fullDate(note.updatedMs, locale)}</InfoRow>
            <InfoRow label={t("context.visibility")}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name={note.public ? "globe" : "lock"} size={14} />
                {note.public ? t("context.public") : t("context.private")}
              </span>
            </InfoRow>
          </div>
        )}
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-1 px-0.5 font-nt-display text-[0.625rem] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle first:mt-0">
      {children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 font-nt-display text-[0.625rem] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}
