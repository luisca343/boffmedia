"use client";

import { useCallback, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import type { NoteFolder, NoteTag } from "@boffmedia/shared";
import { Icon, Kbd } from "./ui";
import { NotePane, type PaneHandlers } from "./NotePane";
import { ContextPanel } from "./ContextPanel";
import type { NoteVM } from "../_types";
import type { Reading, Width } from "../_hooks/useNotesTheme";

interface EditorColumnProps extends PaneHandlers {
  active: NoteVM | null;
  splitNote: NoteVM | null;
  tabs: NoteVM[];
  activeTab: number | null;
  onSelectTab: (id: number) => void;
  onCloseTab: (id: number) => void;
  onNewTab: () => void;
  showCtx: boolean;
  onToggleCtx: () => void;
  onSplit: (id: number) => void;
  onCloseSplit: () => void;
  notes: NoteVM[];
  folders: NoteFolder[];
  tags: NoteTag[];
  reading: Reading;
  width: Width;
  contentById: Record<number, string>;
  onCacheContent: (id: number, content: string) => void;
  onNew: () => void;
  onOpenTemplates: () => void;
  onOpenGraph: () => void;
}

export function EditorColumn(props: EditorColumnProps) {
  const t = useTranslations("notas");
  const { active, splitNote, tabs, activeTab } = props;

  const scrollTo = useCallback((title: string) => {
    const doc = document.querySelector('[data-pane="main"] .nt-doc');
    if (!doc) return;
    const h = Array.from(doc.querySelectorAll("h1,h2,h3")).find(
      (x) => x.textContent?.trim() === title,
    );
    const scroller = doc.closest(".nt-scroll");
    if (!h || !scroller) return;
    scroller.scrollTo({
      top:
        h.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        24,
      behavior: "smooth",
    });
  }, []);

  if (!active) {
    return (
      <div className="flex min-w-0 flex-1 flex-col bg-nt-bg-1">
        <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
          <span className="mb-[22px] grid h-[76px] w-[76px] place-items-center rounded-nt-2xl bg-nt-accent/15 text-nt-accent-fg">
            <Icon name="file-text" size={36} />
          </span>
          <h1 className="m-0 mb-2.5 font-nt-display text-[24px] font-bold text-nt-fg">{t("editor.welcomeTitle")}</h1>
          <p className="m-0 mb-6 max-w-[420px] text-[15px] leading-[1.6] text-nt-fg-muted">
            {t("editor.welcomeDesc")} <Kbd>⌘K</Kbd> {t("editor.welcomeSearch")}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={props.onNew}
              className="inline-flex h-9 items-center gap-2 rounded-nt-md bg-gradient-to-b from-nt-500 to-nt-600 px-3.5 text-[13.5px] font-[550] text-white hover:brightness-[1.06]"
            >
              <Icon name="plus" size={15} /> {t("sidebar.newNote")}
            </button>
            <button
              onClick={props.onOpenTemplates}
              className="inline-flex h-9 items-center gap-2 rounded-nt-md border border-nt-border bg-nt-hover px-3.5 text-[13.5px] font-[550] text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
            >
              <Icon name="layers" size={15} /> {t("editor.fromTemplate")}
            </button>
            <button
              onClick={props.onOpenGraph}
              className="inline-flex h-9 items-center gap-2 rounded-nt-md border border-nt-border bg-nt-hover px-3.5 text-[13.5px] font-[550] text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
            >
              <Icon name="network" size={15} /> {t("editor.graph")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const paneHandlers: PaneHandlers = {
    onCommit: props.onCommit,
    onCreateLinked: props.onCreateLinked,
    onTogglePin: props.onTogglePin,
    onShare: props.onShare,
    onHistory: props.onHistory,
    onMore: props.onMore,
    onOpenTitle: props.onOpenTitle,
    onAddTag: props.onAddTag,
    onRemoveTag: props.onRemoveTag,
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-nt-bg-1">
      <div className="nt-scroll flex h-10 flex-none items-stretch overflow-x-auto border-b border-nt-border bg-nt-bg-2" role="tablist">
        {tabs.map((n) => (
          <div
            key={n.id}
            role="tab"
            aria-selected={activeTab === n.id}
            onClick={() => props.onSelectTab(n.id)}
            onAuxClick={(e) => e.button === 1 && props.onCloseTab(n.id)}
            className={`relative flex min-w-[130px] max-w-[220px] cursor-pointer items-center gap-2 border-r border-nt-border pl-3.5 pr-2.5 text-[13px] transition-colors ${
              activeTab === n.id
                ? "bg-nt-bg-1 text-nt-fg before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-nt-accent"
                : "text-nt-fg-muted hover:bg-nt-hover"
            }`}
          >
            <span className="flex-1 truncate">{n.title || t("list.untitled")}</span>
            <span
              className="grid h-[18px] w-[18px] flex-none place-items-center rounded text-nt-fg-subtle hover:bg-nt-hover-strong hover:text-nt-fg"
              onClick={(e) => {
                e.stopPropagation();
                props.onCloseTab(n.id);
              }}
            >
              <Icon name="x" size={13} />
            </span>
          </div>
        ))}
        <button
          className="grid w-9 flex-none place-items-center text-nt-fg-subtle hover:bg-nt-hover hover:text-nt-fg"
          onClick={props.onNewTab}
          aria-label={t("editor.newTab")}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1" data-pane="main">
          <NotePane
            {...paneHandlers}
            note={active}
            notes={props.notes}
            tags={props.tags}
            folders={props.folders}
            reading={props.reading}
            width={props.width}
            ctxOn={props.showCtx}
            onToggleCtx={props.onToggleCtx}
            onSplit={props.onSplit}
            onContentLoaded={props.onCacheContent}
          />
        </div>
        {splitNote ? (
          <div className="flex min-w-0 flex-1" data-pane="split">
            <NotePane
              {...paneHandlers}
              note={splitNote}
              notes={props.notes}
              tags={props.tags}
              folders={props.folders}
              reading={props.reading}
              width={props.width}
              isSplit
              onCloseSplit={props.onCloseSplit}
              onContentLoaded={props.onCacheContent}
            />
          </div>
        ) : (
          props.showCtx && (
            <ContextPanel
              note={active}
              activeContent={props.contentById[active.id] ?? ""}
              notes={props.notes}
              contentById={props.contentById}
              folders={props.folders}
              tags={props.tags}
              onOpenNote={props.onSelectTab}
              onScrollTo={scrollTo}
            />
          )
        )}
      </div>
    </div>
  );
}
