'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dex } from '@pkmn/dex';
import type { MatchSlot } from '@/features/vgc-tracker/types';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import { calcSpeedStat, applyMods } from '@/app/(boffmedia)/(herramientas)/pokemon/vgc/speedCalc';

interface Props {
  slots: MatchSlot[];
}

function getBaseSpe(name: string): number {
  const sp = Dex.species.get(name);
  return sp?.baseStats?.spe ?? 0;
}

export function SpeedTierWidget({ slots }: Props) {
  const t = useTranslations('vgc.tracker');
  const [tailwind, setTailwind] = useState(false);
  const [trickRoom, setTrickRoom] = useState(false);

  const rows = slots
    .filter((s) => !!s.speciesName)
    .map((s) => {
      const baseSpe = getBaseSpe(s.speciesName!);
      const stat = calcSpeedStat(baseSpe, 0, 1.0);
      const effective = applyMods(stat, { boost: 0, tailwind, scarf: false, paralysis: false });
      return { slotIndex: s.slotIndex, name: s.speciesName!, baseSpe, effective };
    })
    .filter((r) => r.baseSpe > 0)
    .sort((a, b) => trickRoom ? a.effective - b.effective : b.effective - a.effective);

  if (rows.length === 0) return null;

  const maxEff = Math.max(...rows.map((r) => r.effective));
  const minEff = Math.min(...rows.map((r) => r.effective));

  return (
    <div className="mt-3 rounded-lg border border-surface-800 bg-surface-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-800">
        <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wide">
          {t('speedWidget.label')}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setTailwind((v) => !v)}
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
              tailwind
                ? 'bg-blue-600/40 text-blue-300 border border-blue-600/50'
                : 'bg-surface-800 text-surface-500 hover:text-surface-300 border border-transparent'
            }`}
          >
            {t('speedWidget.tailwind')}
          </button>
          <button
            onClick={() => setTrickRoom((v) => !v)}
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
              trickRoom
                ? 'bg-violet-600/40 text-violet-300 border border-violet-600/50'
                : 'bg-surface-800 text-surface-500 hover:text-surface-300 border border-transparent'
            }`}
          >
            {t('speedWidget.trickroom')}
          </button>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const isFirst = i === 0;
        const isLast = i === rows.length - 1;
        const barPct =
          maxEff > minEff ? ((row.effective - minEff) / (maxEff - minEff)) * 100 : 100;
        const nameColor = isFirst
          ? 'text-green-400'
          : isLast
          ? 'text-orange-400'
          : 'text-surface-300';

        return (
          <div key={row.slotIndex} className="relative flex items-center gap-2 px-3 py-1">
            {/* relative speed bar */}
            <div
              className="absolute inset-y-0 left-0 bg-surface-700/30"
              style={{ width: `${barPct}%` }}
            />
            <img
              src={spriteUrl(row.name)}
              alt=""
              className="relative w-6 h-6 object-contain shrink-0"
              onError={handleSpriteError}
            />
            <span className={`relative text-xs truncate flex-1 ${nameColor}`}>{row.name}</span>
            <span className="relative text-xs font-mono shrink-0 tabular-nums text-surface-400">
              {row.baseSpe}
            </span>
            {tailwind && (
              <span className="relative text-[10px] font-mono shrink-0 tabular-nums text-blue-400">
                →{row.effective}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
