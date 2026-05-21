"use client";

import { cn } from "@/lib/utils";

interface Props {
  sidebar:      React.ReactNode;
  detail:       React.ReactNode;
  hasSelection: boolean;
}

/**
 * Two-column sticky-sidebar layout used by the Ladder, Champions, and
 * Tournament aggregate views.
 *
 * The sidebar sticks to the top of the viewport and scrolls internally;
 * the detail panel grows naturally and drives the page height.
 * No self-contained scroll — the browser page scroll is used throughout.
 */
export function MetaSplitLayout({ sidebar, detail, hasSelection }: Props) {
  return (
    <div className="flex h-full">
      <aside
        className={cn(
          "shrink-0 border-r border-surface-700 flex flex-col overflow-y-auto",
          hasSelection
            ? "hidden md:flex md:w-72 xl:w-80"
            : "flex w-full md:w-72 xl:w-80",
        )}
      >
        {sidebar}
      </aside>
      <main className={cn("flex-1 min-w-0 overflow-y-auto", hasSelection ? "block" : "hidden md:block")}>
        {detail}
      </main>
    </div>
  );
}
