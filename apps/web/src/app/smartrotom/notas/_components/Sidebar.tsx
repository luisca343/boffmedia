"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { NoteFolder, NoteTag } from "@boffmedia/shared";
import { Icon, IconButton, Tooltip, type IconName } from "./ui";
import { rgbOf, colorKey } from "../_utils/colors";
import type { NoteVM, View } from "../_types";
import type { Theme } from "../_hooks/useNotesTheme";

const NAV_BASE =
  "group/nav relative flex h-8 cursor-pointer select-none items-center gap-[0.5625rem] rounded-nt-sm px-2 text-[0.84375rem] transition-colors";
const NAV_IDLE = "text-nt-fg-muted hover:bg-nt-hover hover:text-nt-fg";
const NAV_ACTIVE = "bg-nt-accent/15 font-[550] text-nt-accent-fg";

interface SidebarProps {
  folders: NoteFolder[];
  tags: NoteTag[];
  notes: NoteVM[];
  view: View;
  setView: (v: View) => void;
  expanded: Record<number, boolean>;
  toggleExpand: (id: number) => void;
  onNew: () => void;
  newBusy?: boolean;
  onCapture: () => void;
  onNewFolder: () => void;
  newFolderBusy?: boolean;
  onMoveNote: (id: number, folderId: number) => void;
  dropTarget: number | null;
  setDropTarget: (id: number | null) => void;
  theme: Theme;
  toggleTheme: () => void;
  railOpen: boolean;
}

export function Sidebar(props: SidebarProps) {
  const t = useTranslations("notas");
  const { folders, tags, notes, view, setView, expanded, theme } = props;

  const counts = useMemo(() => {
    const byFolder: Record<number, number> = {};
    const byTag: Record<number, number> = {};
    for (const n of notes) {
      if (n.folderId != null) byFolder[n.folderId] = (byFolder[n.folderId] || 0) + 1;
      for (const t of n.tags) byTag[t] = (byTag[t] || 0) + 1;
    }
    return {
      byFolder,
      byTag,
      pinned: notes.filter((n) => n.pinned).length,
      shared: notes.filter((n) => n.sharedWith.length).length,
    };
  }, [notes]);

  const childrenOf = (pid: number | null) => folders.filter((f) => (f.parentId ?? null) === pid);
  const folderCount = (fid: number): number =>
    (counts.byFolder[fid] || 0) + childrenOf(fid).reduce((s, ch) => s + folderCount(ch.id), 0);

  const isActive = (type: View["type"], id: string | number) =>
    view.type === type && view.id === id;

  const smart: { id: string; label: string; icon: IconName; count?: number }[] = [
    { id: "all", label: t("sidebar.smartViews.all"), icon: "layers", count: notes.length },
    { id: "recent", label: t("sidebar.smartViews.recent"), icon: "clock" },
    { id: "pinned", label: t("sidebar.smartViews.pinned"), icon: "pin", count: counts.pinned },
    { id: "shared", label: t("sidebar.smartViews.shared"), icon: "share", count: counts.shared },
    { id: "trash", label: t("sidebar.smartViews.trash"), icon: "trash" },
  ];

  const FolderNode = ({ f, depth }: { f: NoteFolder; depth: number }) => {
    const kids = childrenOf(f.id);
    const open = expanded[f.id];
    const active = isActive("folder", f.id);
    const drop = props.dropTarget === f.id;
    return (
      <div>
        <div
          className={`${NAV_BASE} ${active ? NAV_ACTIVE : NAV_IDLE} ${
            drop ? "bg-nt-accent/15 shadow-[inset_0_0_0_1px_rgb(var(--nt-accent))]" : ""
          }`}
          style={{ paddingLeft: 8 + depth * 16 }}
          onClick={() => setView({ type: "folder", id: f.id })}
          onDragOver={(e) => {
            e.preventDefault();
            props.setDropTarget(f.id);
          }}
          onDragLeave={() => props.dropTarget === f.id && props.setDropTarget(null)}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/note");
            if (id) props.onMoveNote(Number(id), f.id);
            props.setDropTarget(null);
          }}
        >
          {kids.length > 0 ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                props.toggleExpand(f.id);
              }}
            >
              <Icon
                name="chevron-right"
                size={14}
                className={`transition-transform ${open ? "rotate-90" : ""}`}
              />
            </span>
          ) : (
            <span className="w-[0.875rem]" />
          )}
          <Icon
            name={open && kids.length ? "folder-open" : "folder"}
            size={15}
            style={{ color: active ? "rgb(var(--nt-accent-fg))" : `rgb(${rgbOf(f.color)})` }}
          />
          <span className="min-w-0 flex-1 truncate">{f.name}</span>
          <span className="text-[0.6875rem] tabular-nums text-nt-fg-subtle">{folderCount(f.id) || ""}</span>
        </div>
        {open && kids.map((ch) => <FolderNode key={ch.id} f={ch} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <aside
      className={`flex w-[15rem] flex-none flex-col border-r border-nt-border bg-nt-bg-2 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:top-12 max-md:z-[60] max-md:shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)] max-md:transition-transform ${
        props.railOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
      }`}
      role="navigation"
      aria-label={t("sidebar.newNote")}
    >
      <div className="flex flex-col gap-2 p-3 pb-2">
        <button
          onClick={props.onNew}
          disabled={props.newBusy}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-nt-md bg-gradient-to-b from-nt-500 to-nt-600 px-3.5 text-[0.84375rem] font-[550] text-white shadow-[inset_0_1px_0_rgb(255_255_255/.12),0_6px_16px_-8px_rgb(234_88_12/.8)] transition-all hover:brightness-[1.06] active:brightness-95"
        >
          <Icon name="plus" size={16} /> {t("sidebar.newNote")}
        </button>
        <div className="flex gap-2">
          <button
            onClick={props.onCapture}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-nt-md border border-nt-border bg-nt-hover px-3.5 text-[0.84375rem] font-[550] text-nt-fg-muted transition-all hover:bg-nt-hover-strong hover:text-nt-fg"
          >
            <Icon name="zap" size={15} /> {t("sidebar.capture")}
          </button>
          <Tooltip label={theme === "dark" ? t("sidebar.lightMode") : t("sidebar.darkMode")}>
            <button
              onClick={props.toggleTheme}
              aria-label={t("sidebar.changeTheme")}
              className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-nt-md border border-nt-border bg-nt-hover text-nt-fg-muted transition-all hover:bg-nt-hover-strong hover:text-nt-fg"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="nt-scroll flex-1 overflow-auto px-2 pb-4 pt-1.5">
        <div className="mt-3">
          {smart.map((s) => (
            <div
              key={s.id}
              className={`${NAV_BASE} ${
                isActive("smart", s.id) ? NAV_ACTIVE : NAV_IDLE
              }`}
              onClick={() => setView({ type: s.id === "trash" ? "trash" : "smart", id: s.id })}
            >
              <Icon name={s.icon} size={15} className="opacity-85" />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {s.count != null && (
                <span className="text-[0.6875rem] tabular-nums text-nt-fg-subtle">{s.count || ""}</span>
              )}
            </div>
          ))}
        </div>

        <div className="group mt-3">
          <div className="mb-0.5 flex items-center justify-between px-2 py-1">
            <span className="font-nt-display text-[0.625rem] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle">
              {t("sidebar.folders")}
            </span>
            <span
              className="cursor-pointer text-nt-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
              onClick={props.onNewFolder}
              aria-disabled={props.newFolderBusy}
            >
              <Icon name="plus" size={13} />
            </span>
          </div>
          {childrenOf(null).map((f) => (
            <FolderNode key={f.id} f={f} depth={0} />
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-0.5 flex items-center justify-between px-2 py-1">
            <span className="font-nt-display text-[0.625rem] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle">
              {t("sidebar.tags")}
            </span>
          </div>
          {tags.map((t) => (
            <div
              key={t.id}
              className={`${NAV_BASE} ${isActive("tag", t.id) ? NAV_ACTIVE : NAV_IDLE}`}
              onClick={() => setView({ type: "tag", id: t.id })}
            >
              <span
                className="h-2 w-2 flex-none rounded-full"
                style={{ background: `rgb(${rgbOf(colorKey(t.color))})` }}
              />
              <span className="min-w-0 flex-1 truncate">{t.label}</span>
              <span className="text-[0.6875rem] tabular-nums text-nt-fg-subtle">{counts.byTag[t.id] || ""}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
