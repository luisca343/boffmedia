"use client";

import { useTranslations } from "next-intl";
import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { ToolSectionHeader } from "@/components/boffmedia-old/tools/ToolSectionHeader";

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
    <Card className="hover:shadow-sm">
      <CardContent className="p-4">
        <ToolSectionHeader label={title} color="neutral" compact />
        <div className="space-y-0">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-surface-700/30 last:border-b-0">
              {item.name.toLowerCase() === "other" ? (
                <span className="text-xs text-surface-500 italic shrink-0">
                  {t("detail.other")}
                </span>
              ) : (
                <TypeBadgeSmall type={item.name} className="m-0 shrink-0" />
              )}
              <span className="flex-1" />
              <span className="text-xs text-surface-400 tabular-nums font-mono shrink-0 w-14 text-right">
                {item.percent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
