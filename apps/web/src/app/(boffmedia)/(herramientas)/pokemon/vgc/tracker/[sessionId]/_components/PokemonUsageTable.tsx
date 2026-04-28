'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import type { PokemonUsage } from '@/features/vgc-tracker/utils/sessionStats';

type SortKey = 'uses' | 'winRate';

interface Props {
  items: PokemonUsage[];
  /** When true, shows a Discards column and labels the uses column "Brought". */
  showDiscards?: boolean;
  /** Optional map of speciesId to tournament usage % (e.g., from Limitless combined usage) */
  tournamentUsageMap?: Map<string, number>;
}

export function PokemonUsageTable({ items, showDiscards, tournamentUsageMap }: Props) {
  const t = useTranslations('vgc.tracker.sessionStats');
  const [sortKey, setSortKey] = useState<SortKey>('uses');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-surface-500 text-sm">
        {t('table.noData')}
      </p>
    );
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...items].sort((a, b) => {
    const aVal =
      sortKey === 'uses'
        ? a.uses + (showDiscards ? a.discards : 0)
        : (a.winRate ?? -1);
    const bVal =
      sortKey === 'uses'
        ? b.uses + (showDiscards ? b.discards : 0)
        : (b.winRate ?? -1);
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-800">
            {/* Pokémon name */}
            <th className="text-left py-2.5 px-3 text-surface-500 font-medium">
              {t('table.pokemon')}
            </th>

            {/* Discards column (preview only) */}
            {showDiscards && (
              <th className="py-2.5 px-2 text-right text-surface-500 font-medium whitespace-nowrap">
                {t('table.discards')}
              </th>
            )}

            {/* Uses / Brought — sortable */}
            <th
              className="py-2.5 px-2 text-right text-surface-500 font-medium whitespace-nowrap cursor-pointer select-none hover:text-surface-300 transition-colors"
              onClick={() => toggleSort('uses')}
            >
              <span className="flex items-center justify-end gap-0.5">
                {showDiscards ? t('table.brought') : t('table.uses')}
                {sortKey === 'uses' ? (
                  sortDir === 'desc' ? (
                    <ChevronDown size={10} className="text-primary-400" />
                  ) : (
                    <ChevronUp size={10} className="text-primary-400" />
                  )
                ) : (
                  <ChevronDown size={10} className="text-surface-600" />
                )}
              </span>
            </th>

            {/* W/L/D record */}
            <th className="py-2.5 px-2 text-right text-surface-500 font-medium whitespace-nowrap">
              {t('table.record')}
            </th>

            {/* Win rate — sortable */}
            <th
              className="py-2.5 px-3 text-right text-surface-500 font-medium cursor-pointer select-none hover:text-surface-300 transition-colors"
              onClick={() => toggleSort('winRate')}
            >
              <span className="flex items-center justify-end gap-0.5">
                {t('table.winRate')}
                {sortKey === 'winRate' ? (
                  sortDir === 'desc' ? (
                    <ChevronDown size={10} className="text-primary-400" />
                  ) : (
                    <ChevronUp size={10} className="text-primary-400" />
                  )
                ) : (
                  <ChevronDown size={10} className="text-surface-600" />
                )}
              </span>
            </th>

            {/* Tournament usage % (if available) */}
            {tournamentUsageMap && (
              <th className="py-2.5 px-3 text-right text-surface-500 font-medium whitespace-nowrap">
                {t('table.tournamentUsage')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const wr = p.winRate;
            const wrColor =
              wr === null
                ? 'text-surface-500'
                : wr >= 0.6
                ? 'text-green-400'
                : wr >= 0.4
                ? 'text-yellow-400'
                : 'text-red-400';
            const wrDisplay = wr === null ? '—' : `${Math.round(wr * 100)}%`;
            const totalUses = p.uses + (showDiscards ? p.discards : 0);

            return (
              <tr
                key={p.speciesId}
                className="border-b border-surface-800/40 hover:bg-surface-900/40 transition-colors"
              >
                {/* Pokémon sprite + name */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={spriteUrl(p.speciesName)}
                      alt={p.speciesName}
                      className="w-7 h-7 object-contain shrink-0"
                      onError={handleSpriteError}
                    />
                    <span className="text-surface-200 truncate">
                      {p.speciesName}
                    </span>
                  </div>
                </td>

                {/* Discards */}
                {showDiscards && (
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-surface-500">
                    {p.discards}
                  </td>
                )}

                {/* Total uses / brought */}
                <td className="py-2 px-2 text-right font-mono tabular-nums text-surface-300">
                  {totalUses}
                </td>

                {/* W/L/D */}
                <td className="py-2 px-2 text-right font-mono tabular-nums whitespace-nowrap">
                  <span className="text-green-400">{p.wins}</span>
                  <span className="text-surface-600">/</span>
                  <span className="text-red-400">{p.losses}</span>
                  <span className="text-surface-600">/</span>
                  <span className="text-yellow-400">{p.draws}</span>
                </td>

                {/* Win rate */}
                <td
                  className={`py-2 px-3 text-right font-mono font-semibold tabular-nums ${wrColor}`}
                >
                  {wrDisplay}
                </td>

                {/* Tournament usage % (if available) */}
                {tournamentUsageMap && (
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-surface-400 text-[11px]">
                    {tournamentUsageMap.has(p.speciesId)
                      ? `${Math.round(tournamentUsageMap.get(p.speciesId)! * 100)}%`
                      : '—'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
