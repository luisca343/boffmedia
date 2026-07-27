"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import type { NoteFolder, NoteTag } from "@boffmedia/shared";
import { Icon, Tooltip, MiniTag, Avatar } from "./ui";
import { rgbOf, colorKey, hashColor, COLOR_RGB } from "../_utils/colors";
import { timeAgo } from "../_utils/format";
import type { NoteVM, View, SortKey } from "../_types";

const SORT_LABELS: Record<SortKey, string> = {
  updated: "sort.updated",
  created: "sort.created",
  title: "sort.title",
};

interface NoteListProps {
  notes: NoteVM[];
  folders: NoteFolder[];
  tags: NoteTag[];
  view: View;
  search: string;
  setSearch: (s: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  activeId: number | null;
  onOpen: (id: number) => void;
  onNew: () => void;
  newBusy?: boolean;
  onContext: (n: NoteVM, e: MouseEvent) => void;
}

export function NoteList(props: NoteListProps) {
  const t = useTranslations("notas");
  const { notes, folders, tags, view, search, setSearch, sort, setSort, activeId } = props;
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const folderById = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);
  const [sortOpen, setSortOpen] = useState(false);

  const viewTitle = () => {
    if (view.type === "folder") return folderById.get(Number(view.id))?.name || "Carpeta";
    if (view.type === "tag") return `#${tagById.get(Number(view.id))?.label || ""}`;
    const map: Record<string, string> = {
      all: t("sidebar.smartViews.all"),
      recent: t("sidebar.smartViews.recent"),
      pinned: t("sidebar.smartViews.pinned"),
      shared: t("sidebar.smartViews.shared"),
      trash: t("sidebar.smartViews.trash"),
    };
    return map[String(view.id)] || t("list.title");
  };

  return (
    <section
      className="flex w-[300px] flex-none flex-col border-r border-nt-border bg-nt-bg-1 max-md:w-full"
      aria-label={t("list.title")}
    >
      <div className="border-b border-nt-border px-3.5 pb-2 pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="m-0 flex items-center gap-2 text-[15px] font-[650] tracking-[-.01em] text-nt-fg">
            {view.type === "tag" && (
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: `rgb(${rgbOf(colorKey(tagById.get(Number(view.id))?.color))})` }}
              />
            )}
            {viewTitle()}
          </h2>
          <Tooltip label={t("sidebar.newNote")}>
            <button
              onClick={props.onNew}
              disabled={props.newBusy}
              aria-label={t("sidebar.newNote")}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-nt-sm text-nt-fg-muted transition-all hover:bg-nt-hover-strong hover:text-nt-fg"
            >
              <Icon name="plus" size={17} />
            </button>
          </Tooltip>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-nt-fg-subtle">
            <Icon name="search" size={15} />
          </span>
          <input
            className="h-[34px] w-full rounded-nt-md border border-nt-border bg-nt-bg-2 pl-8 pr-2.5 text-[13px] text-nt-fg outline-none transition-colors placeholder:text-nt-fg-subtle focus:border-nt-accent focus:shadow-[0_0_0_3px_rgb(var(--nt-accent)/.15)]"
            placeholder={t("list.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("common.search")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-3.5 py-2 text-[12px] text-nt-fg-subtle">
        <span>
          {t("list.count", { count: notes.length })}
        </span>
        <div className="relative">
          <button
            className="inline-flex items-center gap-1.5 text-nt-fg-muted hover:text-nt-fg"
            onClick={() => setSortOpen((o) => !o)}
          >
            <Icon name="sort" size={13} /> {t(SORT_LABELS[sort])}
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-[9]" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-[120%] z-10 min-w-[150px] rounded-nt-md border border-nt-border-2 bg-nt-elevated p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,.6)]">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <div
                    key={k}
                    className="flex h-[30px] cursor-pointer items-center gap-2 rounded-nt-sm px-2 text-[13px] text-nt-fg-muted hover:bg-nt-hover hover:text-nt-fg"
                    onClick={() => {
                      setSort(k);
                      setSortOpen(false);
                    }}
                  >
                    {sort === k ? <Icon name="check" size={14} /> : <span className="w-[14px]" />}
                    <span>{t(SORT_LABELS[k])}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="nt-scroll flex-1 overflow-auto px-2 pb-5 pt-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-[50px] text-center text-nt-fg-subtle">
            <Icon name="file-text" size={34} className="opacity-40" />
            <p className="m-0 text-[13.5px]">{search ? t("list.noResults") : t("list.emptyTitle")}</p>
            {!search && (
              <button
                className="mt-1.5 inline-flex h-9 items-center gap-2 rounded-nt-md border border-nt-border bg-nt-hover px-3.5 text-[13px] text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
                onClick={props.onNew}
                disabled={props.newBusy}
              >
                <Icon name="plus" size={14} /> {t("list.createNote")}
              </button>
            )}
          </div>
        ) : (
          notes.map((n) => {
            const noteTags = n.tags.map((t) => tagById.get(t)).filter(Boolean) as NoteTag[];
            const active = activeId === n.id;
            return (
              <div
                key={n.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/note", String(n.id))}
                onClick={() => props.onOpen(n.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  props.onContext(n, e);
                }}
                className={`relative mb-[3px] cursor-pointer rounded-nt-md border px-3 py-[11px] transition-colors ${
                  active
                    ? "border-nt-accent/25 bg-nt-accent/15"
                    : "border-transparent hover:bg-nt-hover"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`line-clamp-1 flex-1 text-[13.5px] font-semibold leading-[1.35] ${
                      active ? "text-nt-accent-fg" : "text-nt-fg"
                    }`}
                  >
                    {n.title || t("list.untitled")}
                  </span>
                  {!!n.pinned && <Icon name="pin" size={13} className="flex-none text-nt-accent-fg" />}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="whitespace-nowrap text-[11px] text-nt-fg-subtle">
                    {timeAgo(n.updatedMs)}
                  </span>
                  {noteTags.slice(0, 2).map((t) => (
                    <MiniTag key={t.id} label={t.label} color={t.color} />
                  ))}
                  {noteTags.length > 2 && (
                    <span className="text-[11px] text-nt-fg-subtle">+{noteTags.length - 2}</span>
                  )}
                  {n.sharedWith.length > 0 && (
                    <span className="ml-auto flex">
                      {n.sharedWith.slice(0, 3).map((u) => (
                        <Avatar
                          key={u}
                          name={u}
                          color={`rgb(${COLOR_RGB[hashColor(u)]})`}
                          size={18}
                          className="-ml-1.5"
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
