"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { Icon, Portal, Tooltip, type IconName } from "../ui";
import { ThemedLayer } from "../ui/ThemedLayer";
import {
  caretCell,
  deleteCol,
  deleteRow,
  deleteTable,
  insertCol,
  insertRow,
  toggleHeader,
} from "./tableOps";

export interface TableAction {
  icon: IconName;
  label: string;
  danger?: boolean;
  run: (doc: HTMLElement, cell: HTMLTableCellElement) => void;
}

/** One source of truth for the floating menu AND the toolbar's table dropdown. */
export const TABLE_ACTIONS: (TableAction | "sep")[] = [
  { icon: "row-above", label: "Fila encima", run: (d, c) => insertRow(d, c, "above") },
  { icon: "row-below", label: "Fila debajo", run: (d, c) => insertRow(d, c, "below") },
  "sep",
  { icon: "col-left", label: "Columna a la izquierda", run: (d, c) => insertCol(d, c, "left") },
  { icon: "col-right", label: "Columna a la derecha", run: (d, c) => insertCol(d, c, "right") },
  "sep",
  { icon: "rows", label: "Eliminar fila", danger: true, run: deleteRow },
  { icon: "columns", label: "Eliminar columna", danger: true, run: deleteCol },
  "sep",
  { icon: "header-row", label: "Alternar encabezado", run: toggleHeader },
  { icon: "trash", label: "Eliminar tabla", danger: true, run: deleteTable },
];

const MENU_W = 330;

// Compact control bar pinned over the table the caret sits in. Follows the
// pane's scroll and disappears the moment the selection leaves the table.
export function TableMenu({
  docRef,
  scrollRef,
  onCmd,
}: {
  docRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  onCmd: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const update = useCallback(() => {
    const cell = caretCell(docRef.current);
    const table = cell?.closest("table");
    if (!table) return setPos(null);
    const rect = table.getBoundingClientRect();
    const view = scrollRef.current?.getBoundingClientRect();
    if (view && (rect.bottom < view.top + 8 || rect.top > view.bottom - 8)) return setPos(null);
    let x = rect.left;
    let y = rect.top - 40;
    if (view) {
      y = Math.max(y, view.top + 6);
      x = Math.max(Math.min(x, view.right - MENU_W - 8), view.left + 8);
    }
    setPos({ x, y });
  }, [docRef, scrollRef]);

  useEffect(() => {
    const scroller = scrollRef.current;
    document.addEventListener("selectionchange", update);
    scroller?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      scroller?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, scrollRef]);

  if (!pos) return null;

  return (
    <Portal>
      <ThemedLayer>
        <div
          className="fixed z-[290] flex items-center gap-0.5 rounded-nt-md border border-nt-border-2 bg-nt-panel p-1 shadow-[0_12px_36px_-10px_rgba(0,0,0,.6)]"
          style={{ left: pos.x, top: pos.y }}
          role="toolbar"
          aria-label="Tabla"
          onMouseDown={(e) => e.preventDefault()}
        >
          {TABLE_ACTIONS.map((a, i) =>
            a === "sep" ? (
              <span key={i} className="mx-0.5 h-4 w-px flex-none bg-nt-border-2" />
            ) : (
              <Tooltip key={i} label={a.label}>
                <button
                  aria-label={a.label}
                  className={`inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-nt-sm transition-colors ${
                    a.danger
                      ? "text-nt-fg-muted hover:bg-nt-c-error/10 hover:text-nt-c-error"
                      : "text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
                  }`}
                  onClick={() => {
                    const doc = docRef.current;
                    const cell = caretCell(doc);
                    if (doc && cell) {
                      a.run(doc, cell);
                      onCmd();
                    }
                  }}
                >
                  <Icon name={a.icon} size={14} />
                </button>
              </Tooltip>
            ),
          )}
        </div>
      </ThemedLayer>
    </Portal>
  );
}
