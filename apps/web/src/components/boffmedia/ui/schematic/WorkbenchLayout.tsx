"use client";

// Boffmedia v3 — shared responsive shell for a multi-pane workbench (schematic
// compat and viewer tools). Above `breakpoint` it renders the panes as a flex
// row exactly like today's fixed columns; at or below it, it collapses into
// the Boffmedia Tabs primitive. Panes are NEVER conditionally unmounted: a pane
// can hold a live SchematicViewer3D canvas, and remounting it would tear down
// the WebGL context and re-upload every instance from scratch. Inactive tab
// panes are stacked with `absolute inset-0` + `invisible` rather than
// `display:none` (Tailwind `hidden`): a WebGL canvas that mounts inside a
// `display:none` box gets sized 0x0, and while a live container resize later
// recovers it in most engines, `invisible` never lets the box go to zero in
// the first place — the R3F <Canvas> in the preview pane always measures a
// real size, tab-switch or not.
import { useEffect, useState, type ReactNode } from "react";
import { Tabs } from "@/components/boffmedia/primitives";
import { cn } from "@/lib/utils";

export interface WorkbenchPane {
  key: string;
  label: ReactNode;
  node: ReactNode;
  /** Wrapper classes for the above-breakpoint row layout (width, border, background, overflow). */
  className?: string;
  /** Wrapper classes for the tabbed layout; defaults to a full-bleed scrollable pane. */
  tabClassName?: string;
}

export interface WorkbenchLayoutProps {
  panes: WorkbenchPane[];
  /** Viewport width (px) at/below which the layout collapses into tabs. */
  breakpoint: number;
  className?: string;
}

/**
 * True while the viewport is at or below `breakpoint`. Starts false so SSR and
 * the first client render agree on the row layout, then syncs from
 * matchMedia on mount — mirrors components/boffmedia/ui/tools/datakit/hooks.ts
 * useDkNarrow.
 */
function useWorkbenchNarrow(breakpoint: number): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [breakpoint]);
  return narrow;
}

export function WorkbenchLayout({ panes, breakpoint, className }: WorkbenchLayoutProps) {
  const narrow = useWorkbenchNarrow(breakpoint);
  const [active, setActive] = useState<string>(() => panes[0]?.key ?? "");

  if (!narrow) {
    return (
      <div className={cn("flex flex-1 min-h-0", className)}>
        {panes.map((pane) => (
          <div key={pane.key} className={pane.className}>
            {pane.node}
          </div>
        ))}
      </div>
    );
  }

  const activeKey = panes.some((pane) => pane.key === active) ? active : panes[0]?.key ?? "";

  return (
    <div className={cn("flex flex-1 min-h-0 flex-col", className)}>
      <Tabs
        tabs={panes.map((pane) => ({ value: pane.key, label: pane.label }))}
        value={activeKey}
        onChange={setActive}
        className="shrink-0 px-3 pt-2 bg-base-2 border-b border-line"
      />
      <div className="relative flex-1 min-h-0">
        {panes.map((pane) => (
          <div
            key={pane.key}
            role="tabpanel"
            aria-hidden={activeKey !== pane.key}
            className={cn(
              "absolute inset-0 h-full min-h-0",
              pane.tabClassName ?? "overflow-y-auto",
              activeKey !== pane.key && "invisible pointer-events-none",
            )}
          >
            {pane.node}
          </div>
        ))}
      </div>
    </div>
  );
}
