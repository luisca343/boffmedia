"use client";

import { useEffect, useRef, useState } from "react";
import { Portal, Icon } from "../ui";
import { ThemedLayer } from "../ui/ThemedLayer";
import type { NoteVM } from "../../_types";

export interface LinkOption {
  /** `note` links an existing note · `link` links a title that does not exist yet · `create` also creates it. */
  kind: "note" | "link" | "create";
  title: string;
  id?: number;
}

const MAX_MATCHES = 7;

/**
 * A title with no note behind it is still a valid link — clicking it later creates
 * the note — so the picker offers that and the eager "create now" as separate rows
 * rather than guessing which one the writer meant.
 */
export function buildLinkOptions(notes: NoteVM[], query: string): LinkOption[] {
  const q = query.trim().toLowerCase();
  const matches: LinkOption[] = notes
    .filter((n) => (q ? n.title.toLowerCase().includes(q) : true))
    .slice(0, MAX_MATCHES)
    .map((n) => ({ kind: "note", title: n.title, id: n.id }));

  if (!q || notes.some((n) => n.title.toLowerCase() === q)) return matches;

  const title = query.trim();
  return [...matches, { kind: "link", title }, { kind: "create", title }];
}

const ROW_ICON = { note: "file-text", link: "link", create: "plus" } as const;

export function LinkPicker({
  options,
  index,
  query,
  x,
  y,
  onPick,
  onHover,
}: {
  options: LinkOption[];
  index: number;
  query: string;
  x: number;
  y: number;
  onPick: (option: LinkOption) => void;
  onHover: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Flip above the caret / pull inside the right edge once the real size is known.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - width - 8));
    const top = y + height > window.innerHeight - 8 ? Math.max(8, y - height - 26) : y;
    setPos({ left, top });
  }, [x, y, options.length]);

  if (options.length === 0) return null;

  return (
    <Portal>
      <ThemedLayer>
        <div
          ref={ref}
          // Focus must stay in the editor — the caret is the picker's input.
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-[300] w-[290px] animate-in fade-in zoom-in-95 overflow-hidden rounded-nt-md border border-nt-border-2 bg-nt-panel p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]"
          style={{ left: pos.left, top: pos.top }}
          role="listbox"
          aria-label="Enlazar nota"
        >
          <div className="flex items-center gap-1.5 px-2 pb-1.5 pt-1 font-nt-display text-[10px] font-semibold uppercase tracking-[.12em] text-nt-fg-subtle">
            <Icon name="link" size={12} />
            {query.trim() ? `Enlazar «${query.trim()}»` : "Enlazar nota"}
          </div>

          {options.map((option, i) => (
            <button
              key={`${option.kind}-${option.id ?? option.title}`}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => onHover(i)}
              onClick={() => onPick(option)}
              className={`flex w-full items-center gap-2.5 rounded-nt-sm px-2.5 py-2 text-left text-[13px] transition-colors ${
                i === index ? "bg-nt-accent/15 text-nt-accent-fg" : "text-nt-fg-muted"
              }`}
            >
              <Icon name={ROW_ICON[option.kind]} size={14} className="flex-none" />
              <span className="min-w-0 flex-1 truncate">
                {option.kind === "create" ? `Crear nota «${option.title}»` : option.title}
              </span>
              {option.kind === "link" && (
                <span className="flex-none text-[11px] text-nt-fg-subtle">sin crear</span>
              )}
            </button>
          ))}

          <div className="mt-1 border-t border-nt-border px-2.5 pb-0.5 pt-1.5 text-[11px] text-nt-fg-subtle">
            ↑↓ elegir · ↵ enlazar · esc descartar
          </div>
        </div>
      </ThemedLayer>
    </Portal>
  );
}
