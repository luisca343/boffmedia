'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslations } from 'next-intl';
import type { EloPoint } from '@/features/vgc-tracker/utils/sessionStats';

interface Props {
  timeline: EloPoint[];
  startElo?: number;
}

// Hex values derived from CSS vars in themes.css
const C = {
  primary: '#fb923c', // primary-400  (251 146 60)
  gap: '#475569',     // surface-600  (71 85 105)
  grid: '#334155',    // surface-700  (51 65 85)
  axis: '#64748b',    // surface-500  (100 116 139)
  win: '#4ade80',     // green-400
  loss: '#f87171',    // red-400
  draw: '#facc15',    // yellow-400
  neutral: '#94a3b8', // surface-400  (148 163 184) — startElo dot
  dotStroke: '#1e293b', // surface-800
} as const;

export function EloChart({ timeline, startElo }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');

  const knownElos = timeline
    .map((p) => p.elo)
    .filter((v): v is number => v !== null);

  if (knownElos.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-sm text-surface-500">
        {t('chart.noData')}
      </div>
    );
  }

  // Y-axis domain with comfortable padding rounded to nearest 10
  const yMin = Math.min(...knownElos);
  const yMax = Math.max(...knownElos);
  const yPad = Math.max((yMax - yMin) * 0.15, 40);
  const yDomain: [number, number] = [
    Math.floor((yMin - yPad) / 10) * 10,
    Math.ceil((yMax + yPad) / 10) * 10,
  ];

  // Custom dot: colored by match result
  const renderDot = (props: {
    cx?: number;
    cy?: number;
    key?: string;
    payload?: EloPoint;
  }) => {
    const { cx, cy, payload, key } = props;
    if (
      !payload ||
      payload.elo === null ||
      typeof cx !== 'number' ||
      typeof cy !== 'number'
    ) {
      return <g key={key ?? `dot-null`} />;
    }

    const fill =
      payload.result === 'win'
        ? C.win
        : payload.result === 'loss'
        ? C.loss
        : payload.result === 'draw'
        ? C.draw
        : C.neutral;

    return (
      <circle
        key={key ?? `dot-${payload.matchNum}`}
        cx={cx}
        cy={cy}
        r={4}
        fill={fill}
        stroke={C.dotStroke}
        strokeWidth={1.5}
      />
    );
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: EloPoint }>;
  }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    if (!point || point.elo === null) return null;

    const resultColor =
      point.result === 'win'
        ? 'text-green-400'
        : point.result === 'loss'
        ? 'text-red-400'
        : point.result === 'draw'
        ? 'text-yellow-400'
        : 'text-surface-400';

    const resultLabel =
      point.result === 'win'
        ? 'V'
        : point.result === 'loss'
        ? 'D'
        : point.result === 'draw'
        ? 'E'
        : null;

    const fmt = (v: number) => String(Number(v.toFixed(3)));
    const deltaSign =
      point.delta !== undefined && point.delta >= 0 ? '+' : '';

    return (
      <div
        className="rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-xs shadow-lg"
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-surface-400 font-mono">
            {point.matchNum === 0 ? t('chart.start') : `#${point.matchNum}`}
          </span>
          {resultLabel && (
            <span className={`font-bold text-[11px] ${resultColor}`}>
              {resultLabel}
            </span>
          )}
        </div>
        <div className="text-surface-50 font-mono font-semibold text-sm">
          {fmt(point.elo)}
        </div>
        {point.delta !== undefined && (
          <div
            className={`font-mono text-[10px] ${
              point.delta >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {deltaSign}{fmt(point.delta)}
          </div>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
        <XAxis
          dataKey="matchNum"
          tick={{ fill: C.axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v === 0 ? t('chart.start') : String(v)
          }
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
          content={<CustomTooltip />}
          cursor={{ stroke: C.grid, strokeWidth: 1 }}
        />

        {/* Dashed bridge — rendered first (below solid line).
            connectNulls draws a straight line through null gaps,
            making the "missing ELO" segments visible as dashes. */}
        <Line
          dataKey="eloFill"
          connectNulls
          stroke={C.gap}
          strokeDasharray="4 6"
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
          legendType="none"
          isAnimationActive={false}
        />

        {/* Solid main line — rendered second (on top).
            connectNulls=false means it breaks at null values,
            and the orange solid covers the dashed line in known segments. */}
        <Line
          dataKey="elo"
          connectNulls={false}
          stroke={C.primary}
          strokeWidth={2}
          dot={renderDot}
          activeDot={{ r: 5, fill: C.primary, stroke: C.dotStroke, strokeWidth: 1.5 }}
          isAnimationActive={false}
        />

        {/* Horizontal reference line at session start ELO */}
        {startElo !== undefined && (
          <ReferenceLine
            y={startElo}
            stroke={C.gap}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
