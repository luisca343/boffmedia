'use client';

import { useTranslations } from 'next-intl';
import type { ArchetypeStats } from '@/features/vgc-tracker/utils/sessionStats';

interface Props {
  archetypes: ArchetypeStats[];
}

export function ArchetypeSection({ archetypes }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');

  if (archetypes.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-800">
        <h3 className="text-sm font-semibold text-surface-300">{t('archetypeBreakdown.title')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-800">
              <th className="text-left px-4 py-2 text-surface-500 font-medium">{t('archetypeBreakdown.archetype')}</th>
              <th className="text-center px-3 py-2 text-surface-500 font-medium">G</th>
              <th className="text-center px-3 py-2 text-surface-500 font-medium">W/L/D</th>
              <th className="text-center px-3 py-2 text-surface-500 font-medium">WR</th>
            </tr>
          </thead>
          <tbody>
            {archetypes.map((a) => {
              const wr = a.winRate;
              const wrColor =
                wr === null ? 'text-surface-500'
                : wr >= 0.6 ? 'text-green-400'
                : wr >= 0.4 ? 'text-surface-300'
                : 'text-red-400';
              const draws = a.games - a.wins - a.losses;
              return (
                <tr key={a.archetype} className="border-b border-surface-900 hover:bg-surface-900/50 transition-colors">
                  <td className="px-4 py-2 text-surface-200 font-medium">{a.archetype}</td>
                  <td className="text-center px-3 py-2 text-surface-400 tabular-nums">{a.games}</td>
                  <td className="text-center px-3 py-2 tabular-nums">
                    <span className="text-green-400">{a.wins}</span>
                    <span className="text-surface-600">/</span>
                    <span className="text-red-400">{a.losses}</span>
                    <span className="text-surface-600">/</span>
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
    </div>
  );
}
