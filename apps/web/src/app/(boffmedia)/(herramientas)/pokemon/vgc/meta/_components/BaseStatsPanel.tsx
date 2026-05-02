"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { ToolSectionHeader } from "@/components/boffmedia/tools/ToolSectionHeader";

interface BaseStats {
  hp:  number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

interface Props {
  baseStats:   BaseStats;
  speciesName: string;
}

const STATS: Array<{ key: keyof BaseStats; label: string; color: string }> = [
  { key: "hp",  label: "HP",  color: "#ff5959" },
  { key: "atk", label: "Atk", color: "#f5ac78" },
  { key: "def", label: "Def", color: "#fae078" },
  { key: "spa", label: "SpA", color: "#9db7f5" },
  { key: "spd", label: "SpD", color: "#a7db8d" },
  { key: "spe", label: "Spe", color: "#fa92b2" },
];

const MAX_STAT = 255;

export function BaseStatsPanel({ baseStats, speciesName: _speciesName }: Props) {
  const t = useTranslations("vgc.meta");
  const total = STATS.reduce((sum, s) => sum + baseStats[s.key], 0);

  return (
    <Card className="hover:shadow-sm">
      <CardContent className="p-4">
        <ToolSectionHeader label={t("detail.baseStats")} color="neutral" compact />
        <div className="space-y-2">
          {STATS.map(({ key, label, color }) => {
            const value = baseStats[key];
            const pct   = (value / MAX_STAT) * 100;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-surface-500 w-7 shrink-0 text-right font-medium">
                  {label}
                </span>
                <span className="text-xs text-surface-200 tabular-nums font-mono w-7 shrink-0 text-right">
                  {value}
                </span>
                <div className="flex-1 h-3 rounded-sm bg-surface-700 overflow-hidden">
                  <div
                    className="h-3 rounded-sm transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 pt-1 border-t border-surface-700 mt-1">
            <span className="text-[11px] text-surface-500 w-7 shrink-0 text-right font-medium">BST</span>
            <span className="text-xs text-surface-200 tabular-nums font-mono w-7 shrink-0 text-right font-semibold">
              {total}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
