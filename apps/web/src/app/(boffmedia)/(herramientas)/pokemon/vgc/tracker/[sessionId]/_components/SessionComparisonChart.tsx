'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ComparisonSeries } from '@/features/vgc-tracker/hooks/useComparisonElo';

const PALETTE = [
  '#fb923c', // primary-400 (current session)
  '#4ade80', // green-400
  '#60a5fa', // blue-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#facc15', // yellow-400
];

const C = {
  grid: '#1e293b',
  axis: '#64748b',
  dotStroke: '#03050f',
} as const;

interface Props {
  currentSessionId: string;
  series: ComparisonSeries[];
}

export function SessionComparisonChart({ currentSessionId, series }: Props) {
  if (series.length === 0) return null;

  // Build a single merged data array indexed by matchNum
  const maxMatchNum = Math.max(...series.map((s) => s.points.at(-1)?.matchNum ?? 0));

  const data: Record<string, number | null>[] = Array.from(
    { length: maxMatchNum + 1 },
    (_, i) => ({ matchNum: i }),
  );

  series.forEach((s) => {
    const byNum = new Map(s.points.map((p) => [p.matchNum, p.elo]));
    data.forEach((row) => {
      row[s.id] = byNum.get(row.matchNum as number) ?? null;
    });
  });

  // Y domain across all known ELO values
  const allElos = series.flatMap((s) => s.points.map((p) => p.elo));
  const yMin = Math.min(...allElos);
  const yMax = Math.max(...allElos);
  const yPad = Math.max((yMax - yMin) * 0.15, 40);
  const yDomain: [number, number] = [
    Math.floor((yMin - yPad) / 10) * 10,
    Math.ceil((yMax + yPad) / 10) * 10,
  ];

  // Put current session first so it gets the primary color
  const ordered = [
    ...series.filter((s) => s.id === currentSessionId),
    ...series.filter((s) => s.id !== currentSessionId),
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis
          dataKey="matchNum"
          tick={{ fill: C.axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tick={{ fill: C.axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={42}
          tickCount={5}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#e2e8f0' }}
          formatter={(value: number, name: string) => {
            const s = series.find((x) => x.id === name);
            return [value !== null ? Number(value.toFixed(1)) : '—', s?.label ?? name];
          }}
          labelFormatter={(v) => `Match #${v}`}
        />
        <Legend
          formatter={(value) => {
            const s = series.find((x) => x.id === value);
            return <span style={{ fontSize: 11, color: '#94a3b8' }}>{s?.label ?? value}</span>;
          }}
        />
        {ordered.map((s, i) => (
          <Line
            key={s.id}
            dataKey={s.id}
            name={s.id}
            connectNulls
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={s.id === currentSessionId ? 2.5 : 1.5}
            dot={false}
            activeDot={{ r: 4, stroke: C.dotStroke, strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
