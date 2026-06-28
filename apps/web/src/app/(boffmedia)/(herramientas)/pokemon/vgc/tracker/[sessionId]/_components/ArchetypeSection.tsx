'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives/card';
import type { ArchetypeStats } from '@/features/vgc-tracker/utils/sessionStats';

interface Props {
  archetypes: ArchetypeStats[];
}

export function ArchetypeSection({ archetypes }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');

  if (archetypes.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-edge">
        <h3 className="text-sm font-semibold text-ink">{t('archetypeBreakdown.title')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-edge">
              <th className="text-left px-4 py-2 text-ink-muted font-medium">{t('archetypeBreakdown.archetype')}</th>
              <th className="text-center px-3 py-2 text-ink-muted font-medium">G</th>
              <th className="text-center px-3 py-2 text-ink-muted font-medium">W/L/D</th>
              <th className="text-center px-3 py-2 text-ink-muted font-medium">WR</th>
            </tr>
          </thead>
          <tbody>
            {archetypes.map((a) => {
              const wr = a.winRate;
              const wrColor =
                wr === null ? 'text-ink-muted'
                : wr >= 0.6 ? 'text-green-400'
                : wr >= 0.4 ? 'text-ink'
                : 'text-red-400';
              const draws = a.games - a.wins - a.losses;
              return (
                <tr key={a.archetype} className="border-b border-edge/40 hover:bg-layer-3/30 transition-colors">
                  <td className="px-4 py-2 text-ink font-medium">{a.archetype}</td>
                  <td className="text-center px-3 py-2 text-ink-muted tabular-nums">{a.games}</td>
                  <td className="text-center px-3 py-2 tabular-nums">
                    <span className="text-green-400">{a.wins}</span>
                    <span className="text-ink-dim">/</span>
                    <span className="text-red-400">{a.losses}</span>
                    <span className="text-ink-dim">/</span>
                    <span className="text-yellow-400">{draws}</span>
                  </td>
                  <td className={`text-center px-3 py-2 font-semibold tabular-nums ${wrColor}`}>
                    {wr !== null ? `${Math.round(wr * 100)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
