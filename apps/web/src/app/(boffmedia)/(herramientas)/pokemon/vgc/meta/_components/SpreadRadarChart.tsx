"use client";

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

const STAT_LABELS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

interface Props {
  spread: string;
  nature: string;
  maxValue?: number;
}

export function SpreadRadarChart({ spread, nature, maxValue = 252 }: Props) {
  const values = spread.split("/").map(Number);
  const data = STAT_LABELS.map((stat, i) => ({
    stat,
    value: values[i] ?? 0,
    fullMark: maxValue,
  }));

  return (
    <div className="w-full">
      <p className="text-xs text-ink-muted text-center mb-1 font-medium">{nature}</p>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <Radar
            dataKey="value"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", fontSize: 12 }}
            itemStyle={{ color: "#e2e8f0" }}
            formatter={(v: number) => [v, "EVs"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
