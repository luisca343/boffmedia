'use client';

import type { ReactNode } from 'react';
import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { Card } from '@/components/ui/primitives/card';
import { useTranslations } from 'next-intl';
import type { TimeSlotStats, TimeSlot } from '@/features/vgc-tracker/utils/sessionStats';

const SLOT_ICONS: Record<TimeSlot, ReactNode> = {
  morning: <Sunrise size={14} className="text-amber-400" />,
  afternoon: <Sun size={14} className="text-yellow-400" />,
  evening: <Sunset size={14} className="text-orange-400" />,
  night: <Moon size={14} className="text-indigo-400" />,
};

interface Props {
  slots: TimeSlotStats[];
}

export function TimeSlotsSection({ slots }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');

  if (slots.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-700">
        <span className="text-sm font-semibold text-surface-300">{t('timeSlots.title')}</span>
      </div>
      <div className="divide-y divide-surface-700/50">
        {slots.map((s) => {
          const wr = s.winRate;
          const wrColor =
            wr === null ? 'text-surface-500' : wr >= 0.6 ? 'text-green-400' : wr >= 0.4 ? 'text-yellow-400' : 'text-red-400';
          const barWidth = wr !== null ? Math.round(wr * 100) : 0;

          return (
            <div key={s.slot} className="flex items-center gap-3 px-4 py-3">
              <span className="shrink-0">{SLOT_ICONS[s.slot]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-300 font-medium">{t(`timeSlots.${s.slot}`)}</span>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                    <span className="text-surface-500">
                      <span className="text-green-400">{s.wins}</span>
                      <span className="text-surface-700">/</span>
                      <span className="text-red-400">{s.losses}</span>
                      {s.draws > 0 && <><span className="text-surface-700">/</span><span className="text-yellow-400">{s.draws}</span></>}
                    </span>
                    <span className={`font-semibold w-10 text-right ${wrColor}`}>
                      {wr !== null ? `${Math.round(wr * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
                {wr !== null && (
                  <div className="h-1 rounded-full bg-surface-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${wr >= 0.6 ? 'bg-green-500' : wr >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-surface-600 shrink-0 tabular-nums">×{s.games}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
