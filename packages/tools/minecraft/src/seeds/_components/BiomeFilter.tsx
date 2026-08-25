"use client";

/**
 * BiomeFilter — pick biomes to keep in colour; everything else washes out.
 *
 * The list is every biome the *stack* can place, not every biome currently on
 * screen. That matters: the point of the filter is usually to find out whether
 * something is nearby, and a list built from what is already visible could
 * never answer that.
 *
 * Filtering is a paint-time operation — `paintTile` washes out non-matches — so
 * toggling one is milliseconds over grids already sampled, with no worker
 * involved at all.
 */

import { useMemo, useState } from "react";
import { Button, Input } from "@boffmedia/ui";

import type { BiomeStyler } from "../_lib/biomeColors";

export interface BiomeFilterProps {
  biomeIds: readonly string[];
  styler: BiomeStyler | null;
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  labels: { search: string; clear: string; empty: string; count: string };
}

/** Cap the rendered rows; 148 biomes is fine, a 1000-biome stack is not. */
const MAX_ROWS = 120;

export function BiomeFilter({ biomeIds, styler, selected, onChange, labels }: BiomeFilterProps) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return biomeIds
      .map((id) => ({ id, label: styler?.styleOf(id).label ?? id, color: styler?.styleOf(id).color }))
      // Match the human name *and* the id, because people search for both
      // "brushland" and "terralith:".
      .filter((r) => !q || r.label.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [biomeIds, styler, query]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Input
          value={query}
          placeholder={labels.search}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        {selected.size > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => onChange(new Set())}>
            {labels.clear}
          </Button>
        ) : null}
      </div>

      {selected.size > 0 ? (
        <p className="text-xs text-txt-dim">{labels.count}</p>
      ) : null}

      <div className="max-h-[280px] overflow-y-auto border border-line-2">
        {rows.length === 0 ? (
          <p className="p-3 text-center text-xs text-txt-dim">{labels.empty}</p>
        ) : (
          rows.slice(0, MAX_ROWS).map((r) => {
            const on = selected.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-2 px-2 py-1 text-left text-xs transition-colors ${
                  on ? "bg-accent/15 text-txt" : "text-txt-dim hover:bg-panel"
                }`}
              >
                <span
                  className="inline-block size-3 shrink-0 border border-line-2"
                  style={{ backgroundColor: r.color ? `rgb(${r.color.join(",")})` : undefined }}
                />
                <span className="truncate">{r.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
