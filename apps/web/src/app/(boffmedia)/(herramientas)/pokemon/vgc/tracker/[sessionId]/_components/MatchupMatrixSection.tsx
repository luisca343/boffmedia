'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives/card';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import type { MatchupPair } from '@/features/vgc-tracker/utils/sessionStats';

interface Props {
  pairs: MatchupPair[];
}

const MIN_GAMES = 2;

export function MatchupMatrixSection({ pairs }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const [minGames, setMinGames] = useState(MIN_GAMES);

  if (pairs.length === 0) return null;

  const filtered = pairs.filter((p) => p.games >= minGames);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
        <h3 className="text-sm font-semibold text-surface-300">{t('matchupMatrix.title')}</h3>
        <button
          onClick={() => setMinGames((n) => (n === MIN_GAMES ? 1 : MIN_GAMES))}
          className="text-xs text-surface-500 hover:text-surface-300 transition-colors border border-surface-700 rounded px-2 py-0.5"
        >
          {t('matchupMatrix.minGames', { n: minGames })}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-4 text-xs text-surface-600">{t('matchupMatrix.noData')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left px-4 py-2 text-surface-500 font-medium">{t('matchupMatrix.pair')}</th>
                <th className="text-center px-3 py-2 text-surface-500 font-medium">G</th>
                <th className="text-center px-3 py-2 text-surface-500 font-medium">W/L</th>
                <th className="text-center px-3 py-2 text-surface-500 font-medium">WR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const wr = p.winRate;
                const wrColor =
                  wr === null ? 'text-surface-500'
                  : wr >= 0.6 ? 'text-green-400'
                  : wr >= 0.4 ? 'text-surface-300'
                  : 'text-red-400';
                return (
                  <tr key={`${p.pokemon1Id}+${p.pokemon2Id}`} className="border-b border-surface-700/40 hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <img src={spriteUrl(p.pokemon1Name)} alt={p.pokemon1Name} className="w-6 h-6 object-contain" onError={handleSpriteError} />
                        <span className="text-surface-400 text-[10px]">+</span>
                        <img src={spriteUrl(p.pokemon2Name)} alt={p.pokemon2Name} className="w-6 h-6 object-contain" onError={handleSpriteError} />
                        <span className="text-surface-300 truncate max-w-[120px]">{p.pokemon1Name} + {p.pokemon2Name}</span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2 text-surface-400 tabular-nums">{p.games}</td>
                    <td className="text-center px-3 py-2 tabular-nums">
                      <span className="text-green-400">{p.wins}</span>
                      <span className="text-surface-600">/</span>
                      <span className="text-red-400">{p.losses}</span>
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
      )}
    </Card>
  );
}
