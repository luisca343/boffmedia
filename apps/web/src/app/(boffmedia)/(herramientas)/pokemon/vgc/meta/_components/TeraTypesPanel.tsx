"use client";

import { useTranslations } from "next-intl";
import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";

interface TeraEntry {
  name:    string;
  percent: number;
}

interface Props {
  title: string;
  items: TeraEntry[];
}

export function TeraTypesPanel({ title, items }: Props) {
  const t = useTranslations("vgc.meta");

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-surface-300 mb-3">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            {item.name.toLowerCase() === "other" ? (
              <span className="text-xs text-surface-500 italic shrink-0">
                {t("detail.other")}
              </span>
            ) : (
              <TypeBadgeSmall type={item.name} className="m-0 shrink-0" />
            )}
            <span className="flex-1" />
            <span className="text-xs text-surface-300 tabular-nums font-mono shrink-0 w-12 text-right">
              {item.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
