"use client";

/**
 * AttritionReport — summarize constraint rejection rates.
 *
 * Displays a sorted list of constraints that caused rejections during search,
 * ranked by rejection count (descending). Shows the constraint label, count,
 * and percentage for each.
 */

import type { Translate } from "@boffmedia/ui/i18n";

export interface AttritionData {
  [constraintType: string]: {
    count: number;
    percentage: number;
  };
}

export interface AttritionReportProps {
  data: AttritionData;
  t: Translate;
}

export function AttritionReport({ data, t }: AttritionReportProps) {
  // Sort by rejection count (descending)
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b.count - a.count);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div>
        <h4 className="font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.06em] text-txt">
          {t("search.attritionReport")}
        </h4>
      </div>

      <div className="space-y-1 border border-line-2 rounded bg-base px-3 py-2">
        {sorted.map(([constraintType, stats]) => (
          <div
            key={constraintType}
            className="flex items-center justify-between gap-2 text-[0.75rem] text-txt"
          >
            {/* Constraint type ids render raw, like the vocabulary labels do —
                they are identifiers, not prose. */}
            <span className="font-mono">{constraintType}</span>
            <div className="flex items-baseline gap-2 font-mono text-[0.6875rem] text-txt-dim">
              <span>{stats.count}</span>
              <span>({Math.round(stats.percentage)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
