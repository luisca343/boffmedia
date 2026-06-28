'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives/card';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import type { LeadPairStats } from '@/features/vgc-tracker/utils/sessionStats';

const MIN_GAMES_THRESHOLD = 3;

interface Props {
  myPairs: LeadPairStats[];
  opponentPairs: LeadPairStats[];
}

export function LeadPairsSection({ myPairs, opponentPairs }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const [side, setSide] = useState<'my' | 'opp'>('my');
  const [filterMin, setFilterMin] = useState(true);

  const raw = side === 'my' ? myPairs : opponentPairs;
  const pairs = filterMin ? raw.filter((p) => p.games >= MIN_GAMES_THRESHOLD) : raw;

  if (myPairs.length === 0 && opponentPairs.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <span className="text-sm font-semibold text-ink">{t('leadPairs.title')}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMin((v) => !v)}
            className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
              filterMin
                ? 'border-primary/40 text-primary-hover bg-primary/10'
                : 'border-edge text-ink-muted hover:text-ink'
            }`}
          >
            {t('leadPairs.minGames', { n: MIN_GAMES_THRESHOLD })}
          </button>
        </div>
      </div>

      {/* Side tabs */}
      <div className="flex border-b border-edge">
        <button
          onClick={() => setSide('my')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            side === 'my'
              ? 'text-primary-hover border-b-2 border-primary -mb-px bg-primary/5'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {t('leadPairs.my')}
        </button>
        <button
          onClick={() => setSide('opp')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            side === 'opp'
              ? 'text-primary-hover border-b-2 border-primary -mb-px bg-primary/5'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {t('leadPairs.opp')}
        </button>
      </div>

      {/* Content */}
      {pairs.length === 0 ? (
        <p className="py-8 text-center text-ink-muted text-sm">
          {filterMin ? t('leadPairs.noDataThreshold', { n: MIN_GAMES_THRESHOLD }) : t('leadPairs.noData')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left py-2.5 px-3 text-ink-muted font-medium">{t('leadPairs.pair')}</th>
                <th className="py-2.5 px-2 text-right text-ink-muted font-medium">{t('table.record')}</th>
                <th className="py-2.5 px-3 text-right text-ink-muted font-medium">{t('table.winRate')}</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p) => {
                const wr = p.winRate;
                const wrColor =
                  wr === null ? 'text-ink-muted' : wr >= 0.6 ? 'text-green-400' : wr >= 0.4 ? 'text-yellow-400' : 'text-red-400';
                return (
                  <tr key={p.key} className="border-b border-edge/40 hover:bg-layer-3/30 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 shrink-0">
                          <img src={spriteUrl(p.lead1Name)} alt={p.lead1Name} className="w-7 h-7 object-contain" onError={handleSpriteError} />
                          <img src={spriteUrl(p.lead2Name)} alt={p.lead2Name} className="w-7 h-7 object-contain" onError={handleSpriteError} />
                        </div>
                        <span className="text-ink truncate">{p.lead1Name} + {p.lead2Name}</span>
                        <span className="text-ink-dim text-[10px] shrink-0">×{p.games}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className="text-green-400">{p.wins}</span>
                      <span className="text-ink-dim">/</span>
                      <span className="text-red-400">{p.losses}</span>
                      <span className="text-ink-dim">/</span>
                      <span className="text-yellow-400">{p.draws}</span>
                    </td>
                    <td className={`py-2 px-3 text-right font-mono font-semibold tabular-nums ${wrColor}`}>
                      {wr === null ? '—' : `${Math.round(wr * 100)}%`}
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
