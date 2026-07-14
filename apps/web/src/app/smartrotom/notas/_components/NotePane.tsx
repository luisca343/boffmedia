"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { NoteFolder, NoteTag } from "@boffmedia/shared";
import { Icon, IconButton, Tooltip, MiniTag, Avatar, type IconName } from "./ui";
import { Toolbar } from "./editor/Toolbar";
import { TableMenu } from "./editor/TableMenu";
import { LinkPicker, buildLinkOptions, type LinkOption } from "./editor/LinkPicker";
import { closestInDoc, exec } from "./editor/commands";
import { markdownShortcut } from "./editor/markdown";
import { tableTab } from "./editor/tableOps";
import { useNoteContent } from "../_hooks/useNoteContent";
import { extractTitle, wordCount } from "../_utils/content";
import { rgbOf, hashColor, COLOR_RGB } from "../_utils/colors";
import type { NoteVM } from "../_types";
import type { Reading, Width } from "../_hooks/useNotesTheme";

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

/** An in-progress `[[…` (or a just-closed `[[…]]`) sitting immediately before the caret. */
interface LinkTrigger {
  node: Text;
  start: number;
  end: number;
  query: string;
  closed: boolean;
}

export function NotePane(props: NotePaneProps) {
  const { note, tags, folders } = props;
  const { note: loaded } = useNoteContent(note.id);
  const docRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededFor = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissed = useRef(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [wc, setWc] = useState(0);
  const [picker, setPicker] = useState<{ query: string; x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);

  const folder = folders.find((f) => f.id === note.folderId);
  const noteTags = note.tags.map((t) => tags.find((x) => x.id === t)).filter(Boolean) as NoteTag[];

  const options = useMemo(
    () => (picker ? buildLinkOptions(props.notes, picker.query) : []),
    [picker, props.notes],
  );
  const activeIndex = Math.min(index, Math.max(0, options.length - 1));

  // Chromium's default block separator is <div>; everything downstream (nt-doc
  // styles, markdown shortcuts, extractTitle) speaks <p>.
  useEffect(() => {
    exec("defaultParagraphSeparator", "p");
  }, []);

  // Load content into the editable surface once it arrives / when the note changes.
  // Every commit refetches this note, so `loaded.content` changes again mid-typing;
  // re-seeding then would stomp everything typed since the commit's snapshot. Once
  // seeded, a focused doc is the source of truth — never overwrite it.
  useEffect(() => {
    const doc = docRef.current;
    if (doc && loaded?.content != null) {
      const typing = seededFor.current === note.id && document.activeElement === doc;
      if (!typing) {
        doc.innerHTML = loaded.content;
        sealLinks(doc);
        setWc(wordCount(loaded.content));
        seededFor.current = note.id;
        props.onContentLoaded?.(note.id, loaded.content);
      }
    }
    setPicker(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded?.content, note.id]);

  const commit = useCallback(() => {
    const html = docRef.current?.innerHTML ?? loaded?.content ?? "";
    props.onCommit(note.id, html, extractTitle(html) || "Sin título");
    setSaveState("saved");
  }, [note.id, loaded?.content, props]);

  /** Reads the `[[…` the caret sits in, if any. Recomputed on demand, never stored. */
  const caretTrigger = useCallback((): LinkTrigger | null => {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    if (!sel?.isCollapsed || !node || node.nodeType !== Node.TEXT_NODE) return null;
    if (!docRef.current?.contains(node)) return null;
    if ((node.parentElement as HTMLElement | null)?.closest(".wikilink")) return null;

    const caret = sel.anchorOffset;
    const match = /\[\[([^[\]]*)(\]\])?$/.exec((node.textContent ?? "").slice(0, caret));
    if (!match) return null;
    return {
      node: node as Text,
      start: caret - match[0].length,
      end: caret,
      query: match[1],
      closed: !!match[2],
    };
  }, []);

  // Swaps the trigger for the anchor the rest of the app reads (backlinks, graph,
  // click-to-open). Only the caret's own text node is rewritten, so the rest of the
  // document is left alone.
  const insertLink = useCallback((title: string, trigger: LinkTrigger) => {
    const range = document.createRange();
    range.setStart(trigger.node, trigger.start);
    range.setEnd(trigger.node, trigger.end);
    range.deleteContents();

    const anchor = document.createElement("a");
    anchor.className = "wikilink";
    anchor.setAttribute("data-title", title);
    anchor.textContent = title;
    anchor.contentEditable = "false";
    // A non-breaking space: the caret needs a landing spot after a sealed link.
    const tail = document.createTextNode(" ");
    range.insertNode(tail);
    range.insertNode(anchor);

    const after = document.createRange();
    after.setStart(tail, 1);
    after.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(after);
  }, []);

  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    if (docRef.current) setWc(wordCount(docRef.current.innerHTML));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(commit, 700);
  }, [commit]);

  const choose = useCallback(
    (option: LinkOption) => {
      const trigger = caretTrigger();
      setPicker(null);
      if (!trigger) return;
      insertLink(option.title, trigger);
      if (option.kind === "create") props.onCreateLinked(option.title);
      scheduleSave();
    },
    [caretTrigger, insertLink, props, scheduleSave],
  );

  const onInput = useCallback(() => {
    const trigger = caretTrigger();
    const title = trigger?.query.trim();

    if (trigger?.closed && title) {
      // Brackets typed out in full: link the title verbatim, no picker, nothing created.
      insertLink(title, trigger);
      setPicker(null);
    } else if (trigger && !trigger.closed && !dismissed.current) {
      setPicker({ query: trigger.query, ...anchorPoint(trigger) });
      setIndex(0);
    } else {
      setPicker(null);
    }
    if (!trigger) dismissed.current = false;

    scheduleSave();
  }, [caretTrigger, insertLink, scheduleSave]);

  // The caret IS the picker's input, so the picker never takes focus and the
  // editor arbitrates its keys.
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (picker && options.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setIndex((i) => (i + 1) % options.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setIndex((i) => (i - 1 + options.length) % options.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          choose(options[activeIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          dismissed.current = true;
          setPicker(null);
          return;
        }
      }
      if (markdownShortcut(e, docRef.current)) {
        scheduleSave();
        return;
      }
      if (e.key === "Tab") {
        if (tableTab(docRef.current, e.shiftKey)) {
          e.preventDefault();
          scheduleSave();
        } else if (closestInDoc(docRef.current, "li")) {
          e.preventDefault();
          exec(e.shiftKey ? "outdent" : "indent");
          scheduleSave();
        }
      }
    },
    [picker, options, activeIndex, choose, scheduleSave],
  );

  const onDocClick = (e: MouseEvent<HTMLDivElement>) => {
    setPicker(null);
    const target = e.target as HTMLElement;
    const wl = target.closest(".wikilink");
    if (wl) {
      e.preventDefault();
      props.onOpenTitle(wl.getAttribute("data-title") || "");
      return;
    }
    const li = target.closest("ul.todo > li") as HTMLElement | null;
    if (li && !window.getSelection()?.toString()) {
      const rect = li.getBoundingClientRect();
      if (e.clientX - rect.left < 32) {
        li.setAttribute("data-done", li.getAttribute("data-done") === "true" ? "false" : "true");
        onInput();
      }
    }
  };

  const readMin = Math.max(1, Math.round(wc / 200));

  return (
    <div
      className="flex min-w-0 flex-1 flex-col border-r border-nt-border last:border-r-0"
      onMouseDown={props.onFocusPane}
    >
      <Toolbar onCmd={onInput} docRef={docRef} />

      <div className="border-b border-nt-border bg-nt-bg-1 px-6 pb-3 pt-3.5">
        <div className="flex items-center gap-2.5">
          {props.mobileBack && (
            <button
              className="inline-flex md:hidden"
              onClick={props.mobileBack}
              aria-label="Volver"
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
            <span className="min-w-0 truncate text-nt-fg-muted">{note.title || "Sin título"}</span>
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
            {saveState === "saving" ? "Guardando…" : "Guardado"}
          </div>
          <div className="flex flex-none items-center gap-0.5">
            <Tooltip label={note.pinned ? "Desanclar" : "Anclar"}>
              <IconButton active={!!note.pinned} onClick={() => props.onTogglePin(note)} aria-label="Anclar">
                <Icon name="pin" size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip label="Historial de versiones">
              <IconButton onClick={() => props.onHistory(note)} aria-label="Historial">
                <Icon name="history" size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip label="Compartir">
              <IconButton onClick={() => props.onShare(note)} aria-label="Compartir">
                <Icon name="share" size={15} />
              </IconButton>
            </Tooltip>
            {!props.isSplit && props.onSplit && (
              <Tooltip label="Vista dividida">
                <IconButton
                  className="max-md:hidden"
                  onClick={() => props.onSplit!(note.id)}
                  aria-label="Dividir"
                >
                  <Icon name="split" size={16} />
                </IconButton>
              </Tooltip>
            )}
            {props.isSplit && (
              <Tooltip label="Cerrar panel">
                <IconButton onClick={props.onCloseSplit} aria-label="Cerrar panel">
                  <Icon name="x" size={16} />
                </IconButton>
              </Tooltip>
            )}
            {!props.isSplit && props.onToggleCtx && (
              <Tooltip label="Panel lateral">
                <IconButton
                  active={props.ctxOn}
                  className="max-lg:hidden"
                  onClick={props.onToggleCtx}
                  aria-label="Panel lateral"
                >
                  <Icon name={"file-text" as IconName} size={16} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip label="Más">
              <IconButton onClick={(e) => props.onMore(note, e)} aria-label="Más">
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
            <Icon name="plus" size={11} /> etiqueta
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
            {wc} palabras · {readMin} min
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="nt-scroll flex-1 overflow-auto bg-nt-bg-1">
        <div
          ref={docRef}
          key={note.id}
          className={`nt-doc font-nt ${props.reading === "serif" ? "serif" : ""} ${
            props.width === "wide" ? "wide" : ""
          }`}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onClick={onDocClick}
          onBlur={() => {
            commit();
            setPicker(null);
          }}
          role="textbox"
          aria-multiline="true"
          aria-label="Contenido de la nota"
        />
      </div>

      <TableMenu docRef={docRef} scrollRef={scrollRef} onCmd={scheduleSave} />

      {picker && (
        <LinkPicker
          options={options}
          index={activeIndex}
          query={picker.query}
          x={picker.x}
          y={picker.y}
          onPick={choose}
          onHover={setIndex}
        />
      )}
    </div>
  );
}

// Chrome grows an editable inline <a> when the caret rests on its trailing boundary,
// so the next thing typed lands INSIDE the link (and a `[[` there can never open the
// picker, because the caret is already in a wikilink). Sealing the anchor makes it an
// atomic chip: typing flows around it, and its label can no longer drift from its
// data-title. Links saved before this ran get sealed on load.
function sealLinks(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".wikilink").forEach((el) => {
    el.contentEditable = "false";
  });
}

// Anchors the picker under the opening brackets rather than the moving caret, so it
// does not drift sideways while the query is typed. A collapsed range reports zero
// width but a real height; if the browser gives nothing at all, fall back to the line.
function anchorPoint(trigger: LinkTrigger): { x: number; y: number } {
  const range = document.createRange();
  range.setStart(trigger.node, trigger.start);
  range.collapse(true);
  let rect = range.getBoundingClientRect();
  if (!rect.height) {
    const el = trigger.node.parentElement;
    rect = el ? el.getBoundingClientRect() : rect;
  }
  return { x: rect.left, y: rect.bottom + 6 };
}
