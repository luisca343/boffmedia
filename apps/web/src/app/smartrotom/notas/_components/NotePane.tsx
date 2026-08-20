"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { NoteFolder, NoteTag } from "@boffmedia/shared";
import { Icon, IconButton, Tooltip, MiniTag, Avatar, type IconName } from "./ui";
import { useNoteContent } from "../_hooks/useNoteContent";
import { extractTitle, wordCount } from "../_utils/content";
import { rgbOf, hashColor, COLOR_RGB } from "../_utils/colors";
import type { NoteVM } from "../_types";
import type { Reading, Width } from "../_hooks/useNotesTheme";

// The CKEditor bundle touches window at module scope — client-render only.
const NotesEditor = dynamic(() => import("./editor/NotesEditor"), { ssr: false });

export interface PaneHandlers {
  onCommit: (id: number, html: string, title: string) => void;
  onTogglePin: (n: NoteVM) => void;
  onShare: (n: NoteVM) => void;
  onHistory: (n: NoteVM) => void;
  onMore: (n: NoteVM, e: MouseEvent) => void;
  onOpenTitle: (title: string) => void;
  onCreateLinked: (title: string) => void;
  onAddTag: (n: NoteVM, e: MouseEvent) => void;
  onRemoveTag: (id: number, tagId: number) => void;
}

interface NotePaneProps extends PaneHandlers {
  note: NoteVM;
  notes: NoteVM[];
  tags: NoteTag[];
  folders: NoteFolder[];
  reading: Reading;
  width: Width;
  isSplit?: boolean;
  onCloseSplit?: () => void;
  onSplit?: (id: number) => void;
  ctxOn?: boolean;
  onToggleCtx?: () => void;
  isActive?: boolean;
  onFocusPane?: () => void;
  onContentLoaded?: (id: number, content: string) => void;
  mobileBack?: (() => void) | null;
}

export function NotePane(props: NotePaneProps) {
  const t = useTranslations("notas");
  const { note, tags, folders } = props;
  const { note: loaded } = useNoteContent(note.id);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [wc, setWc] = useState(0);

  const folder = folders.find((f) => f.id === note.folderId);
  const noteTags = note.tags.map((t) => tags.find((x) => x.id === t)).filter(Boolean) as NoteTag[];

  // Seed the word count + the page-level content cache (backlinks, graph).
  useEffect(() => {
    if (loaded?.content != null) {
      setWc(wordCount(loaded.content));
      props.onContentLoaded?.(note.id, loaded.content);
    }
  }, [loaded?.content, note.id]);

  const commit = useCallback(
    (html: string) => {
      props.onCommit(note.id, html, extractTitle(html) || t("editor.untitled"));
      setSaveState("saved");
    },
    [note.id, props],
  );

  const onDirty = useCallback(() => setSaveState("saving"), []);

  const linkTargets = useCallback(
    () =>
      props.notes
        .filter((n) => n.id !== note.id)
        .map((n) => n.title)
        .filter(Boolean),
    [props.notes, note.id],
  );

  const readMin = Math.max(1, Math.round(wc / 200));

  return (
    <div
      className="flex min-w-0 flex-1 flex-col border-r border-nt-border last:border-r-0"
      onMouseDown={props.onFocusPane}
    >
      <div className="border-b border-nt-border bg-nt-bg-1 px-6 pb-3 pt-3.5">
        <div className="flex items-center gap-2.5">
          {props.mobileBack && (
            <button
              className="inline-flex md:hidden"
              onClick={props.mobileBack}
              aria-label={t("common.back")}
            >
              <Icon name="chevron-left" size={18} className="text-nt-fg-muted" />
            </button>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px] text-nt-fg-subtle">
            <Icon
              name={folder ? "folder" : "file"}
              size={13}
              style={folder ? { color: `rgb(${rgbOf(folder.color)})` } : undefined}
            />
            <span>{folder ? folder.name : "SmartRotom"}</span>
            <Icon name="chevron-right" size={12} />
            <span className="min-w-0 truncate text-nt-fg-muted">{note.title || t("editor.untitled")}</span>
          </div>
          <div
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-nt-border bg-nt-hover px-2.5 text-[12px] text-nt-fg-subtle"
            aria-live="polite"
          >
            <span
              className={`h-[7px] w-[7px] rounded-full ${
                saveState === "saving" ? "animate-pulse bg-nt-c-warning" : "bg-nt-c-success"
              }`}
            />
            {saveState === "saving" ? t("editor.saving") : t("editor.saved")}
          </div>
          <div className="flex flex-none items-center gap-0.5">
            <Tooltip label={note.pinned ? t("common.unpin") : t("common.pin")}>
              <IconButton active={!!note.pinned} onClick={() => props.onTogglePin(note)} aria-label={t("common.pin")}>
                <Icon name="pin" size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip label={t("editor.versionHistory")}>
              <IconButton onClick={() => props.onHistory(note)} aria-label={t("editor.versionHistory")}>
                <Icon name="history" size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip label={t("common.share")}>
              <IconButton onClick={() => props.onShare(note)} aria-label={t("common.share")}>
                <Icon name="share" size={15} />
              </IconButton>
            </Tooltip>
            {!props.isSplit && props.onSplit && (
              <Tooltip label={t("editor.splitView")}>
                <IconButton
                  className="max-md:hidden"
                  onClick={() => props.onSplit!(note.id)}
                  aria-label={t("editor.splitView")}
                >
                  <Icon name="split" size={16} />
                </IconButton>
              </Tooltip>
            )}
            {props.isSplit && (
              <Tooltip label={t("editor.closePanel")}>
                <IconButton onClick={props.onCloseSplit} aria-label={t("editor.closePanel")}>
                  <Icon name="x" size={16} />
                </IconButton>
              </Tooltip>
            )}
            {!props.isSplit && props.onToggleCtx && (
              <Tooltip label={t("editor.sidePanel")}>
                <IconButton
                  active={props.ctxOn}
                  className="max-lg:hidden"
                  onClick={props.onToggleCtx}
                  aria-label={t("editor.sidePanel")}
                >
                  <Icon name={"file-text" as IconName} size={16} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip label={t("editor.more")}>
              <IconButton onClick={(e) => props.onMore(note, e)} aria-label={t("editor.more")}>
                <Icon name="more-v" size={16} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {noteTags.map((t) => (
            <MiniTag
              key={t.id}
              label={t.label}
              color={t.color}
              removable
              onRemove={() => props.onRemoveTag(note.id, t.id)}
            />
          ))}
          <button
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-nt-border-2 px-2 py-0.5 text-[11px] text-nt-fg-subtle hover:border-nt-fg-subtle hover:text-nt-fg-muted"
            onClick={(e) => props.onAddTag(note, e)}
          >
            <Icon name="plus" size={11} /> {t("editor.addTag")}
          </button>
          <span className="flex-1" />
          <span className="flex items-center gap-2 text-[11.5px] text-nt-fg-subtle">
            {note.sharedWith.length > 0 && (
              <span className="mr-1 flex">
                {note.sharedWith.slice(0, 3).map((u) => (
                  <Avatar key={u} name={u} color={`rgb(${COLOR_RGB[hashColor(u)]})`} size={20} className="-ml-1.5" />
                ))}
              </span>
            )}
            {t("editor.words", { count: wc })} · {readMin} min
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-nt-bg-1">
        {loaded?.content != null && (
          <NotesEditor
            key={note.id}
            noteId={note.id}
            initialData={loaded.content}
            content={loaded.content}
            linkTargets={linkTargets}
            reading={props.reading}
            width={props.width}
            onSave={commit}
            onDirty={onDirty}
            onWords={setWc}
            onOpenTitle={props.onOpenTitle}
            onCreateLinked={props.onCreateLinked}
          />
        )}
      </div>
    </div>
  );
}
