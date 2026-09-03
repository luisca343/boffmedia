"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Portal } from "../ui";
import { ThemedLayer } from "../ui/ThemedLayer";
import { Icon } from "../ui";
import { buildGraph } from "../../_utils/wikilinks";
import type { NoteVM } from "../../_types";

export function GraphView({
  notes,
  activeId,
  contentById,
  onClose,
  onOpenNote,
}: {
  notes: NoteVM[];
  activeId: number | null;
  contentById: Record<number, string>;
  onClose: () => void;
  onOpenNote: (id: number) => void;
}) {
  const t = useTranslations("notas");
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });

  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges, degree, positions } = useMemo(() => {
    const withContent = notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: contentById[n.id] ?? "",
    }));
    const g = buildGraph(withContent);
    const deg = new Map<number, number>();
    for (const e of g.edges) {
      deg.set(e.source, (deg.get(e.source) || 0) + 1);
      deg.set(e.target, (deg.get(e.target) || 0) + 1);
    }
    const cx = size.w / 2;
    const cy = size.h / 2;
    const radius = Math.min(size.w, size.h) * 0.38;
    const pos = new Map<number, { x: number; y: number }>();
    g.nodes.forEach((n, i) => {
      const a = (i / Math.max(1, g.nodes.length)) * Math.PI * 2 - Math.PI / 2;
      pos.set(n.id, { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
    });
    return { nodes: g.nodes, edges: g.edges, degree: deg, positions: pos };
  }, [notes, contentById, size]);

  return (
    <Portal>
      <ThemedLayer>
        <div className="fixed inset-0 z-[90] flex flex-col bg-nt-bg animate-in fade-in">
          <div className="flex h-[3.25rem] flex-none items-center gap-3 border-b border-nt-border px-[1.125rem]">
            <Icon name="network" size={18} className="text-nt-accent-fg" />
            <span className="font-nt-display text-[0.8125rem] font-bold uppercase tracking-[.08em] text-nt-fg">
              {t("graph.title")}
            </span>
            <span className="text-[0.75rem] text-nt-fg-subtle">
              {nodes.length} {t("graph.notes")} · {edges.length} {t("graph.links")}
            </span>
            <span className="flex-1" />
            <button
              onClick={onClose}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-nt-sm text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
              aria-label={t("common.close")}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <div ref={boxRef} className="relative flex-1 overflow-hidden">
            <svg className="absolute inset-0 h-full w-full">
              {edges.map((e, i) => {
                const a = positions.get(e.source);
                const b = positions.get(e.target);
                if (!a || !b) return null;
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgb(var(--nt-fg-subtle) / .25)"
                    strokeWidth={1}
                  />
                );
              })}
            </svg>
            {nodes.map((n) => {
              const p = positions.get(n.id);
              if (!p) return null;
              const deg = degree.get(n.id) || 0;
              const active = n.id === activeId;
              const r = 6 + Math.min(deg, 6) * 2;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    onOpenNote(n.id);
                    onClose();
                  }}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 transition-transform hover:z-[3] hover:scale-110"
                  style={{ left: p.x, top: p.y }}
                >
                  <span
                    className="rounded-full border-2 border-nt-bg bg-nt-accent shadow-[0_0_0_1px_rgb(var(--nt-accent)/.5),0_0_22px_rgb(var(--nt-accent)/.28)]"
                    style={{ width: r * 2, height: r * 2 }}
                  />
                  <span
                    className={`max-w-[7.5rem] rounded-md border px-1.5 py-0.5 text-center text-[0.71875rem] leading-[1.3] ${
                      active
                        ? "border-nt-accent text-nt-fg"
                        : "border-nt-border text-nt-fg-muted"
                    } bg-nt-bg-2`}
                  >
                    {n.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </ThemedLayer>
    </Portal>
  );
}
