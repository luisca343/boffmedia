'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives/card';
import type { HeatmapCell, TimeSlot } from '@/features/vgc-tracker/utils/sessionStats';

interface Props {
  heatmap: HeatmapCell[];
}

const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function winRateColor(wr: number | null, games: number): string {
  if (games === 0 || wr === null) return 'bg-layer-1 text-ink-dim';
  if (wr >= 0.65) return 'bg-green-500/30 text-green-300';
  if (wr >= 0.5) return 'bg-green-500/15 text-green-400';
  if (wr >= 0.35) return 'bg-red-500/15 text-red-400';
  return 'bg-red-500/30 text-red-300';
}

export function HeatmapSection({ heatmap }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');

  if (heatmap.length === 0) {
    return null;
  }

  // Build lookup map
  const cellMap = new Map<string, HeatmapCell>();
  heatmap.forEach((c) => cellMap.set(`${c.dayOfWeek}:${c.slot}`, c));

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-edge">
        <h3 className="text-sm font-semibold text-ink">{t('heatmap.title')}</h3>
      </div>
      <div className="p-3 overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="w-10" />
              {SLOTS.map((slot) => (
                <th key={slot} className="text-ink-muted font-medium text-center pb-1 px-1 whitespace-nowrap">
                  {t(`timeSlots.${slot}`).split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIndex) => (
              <tr key={day}>
                <td className="text-ink-dim font-medium text-right pr-2 py-0.5 whitespace-nowrap">
                  {t(`heatmap.days.${day}`)}
                </td>
                {SLOTS.map((slot) => {
                  const cell = cellMap.get(`${dayIndex}:${slot}`);
                  const games = cell?.games ?? 0;
                  const wr = cell?.winRate ?? null;
                  return (
                    <td key={slot} className="p-0">
                      <div
                        className={`rounded flex items-center justify-center h-8 min-w-[48px] transition-colors ${winRateColor(wr, games)}`}
                        title={games > 0 ? `${games}G · ${wr !== null ? Math.round(wr * 100) + '%' : '—'}` : undefined}
                      >
                        {games > 0 ? (
                          <span className="font-mono tabular-nums leading-none">
                            {wr !== null ? `${Math.round(wr * 100)}%` : '—'}
                          </span>
                        ) : (
                          <span className="text-ink-dim">·</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
