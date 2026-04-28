'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dex } from '@pkmn/dex';
import type { MatchSlot } from '@/features/vgc-tracker/types';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import { calcSpeedStat, applyMods, compareSpeed } from '@/app/(boffmedia)/(herramientas)/pokemon/vgc/speedCalc';

interface Props {
  slots: MatchSlot[];
}

function getBaseSpe(name: string): number {
  const sp = Dex.species.get(name);
  return sp?.baseStats?.spe ?? 0;
}

// EV preset presets for quick selection
const EV_PRESETS = [
  { label: '0N', evs: 0, nature: 1.0 },
  { label: '0+', evs: 0, nature: 1.1 },
  { label: '252N', evs: 252, nature: 1.0 },
  { label: '252+', evs: 252, nature: 1.1 },
] as const;

export function SpeedTierWidget({ slots }: Props) {
  const t = useTranslations('vgc.tracker');
  const [tailwind, setTailwind] = useState(false);
  const [trickRoom, setTrickRoom] = useState(false);
  const [scarf, setScarf] = useState(false);
  
  // Per-slot EV tracking (default 0 EV, neutral nature)
  const [slotEvs, setSlotEvs] = useState<Record<number, number>>({});
  const [slotNatures, setSlotNatures] = useState<Record<number, number>>({});
  
  // Opponent speed input and comparison
  const [opponentBaseSpeed, setOpponentBaseSpeed] = useState<number | ''>('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const rows = slots
    .filter((s) => !!s.speciesName)
    .map((s) => {
      const baseSpe = getBaseSpe(s.speciesName!);
      const evs = slotEvs[s.slotIndex] ?? 0;
      const nature = slotNatures[s.slotIndex] ?? 1.0;
      const stat = calcSpeedStat(baseSpe, evs, nature);
      const effective = applyMods(stat, { boost: 0, tailwind, scarf, paralysis: false });
      return { slotIndex: s.slotIndex, name: s.speciesName!, baseSpe, effective, evs, nature };
    })
    .filter((r) => r.baseSpe > 0)
    .sort((a, b) => trickRoom ? a.effective - b.effective : b.effective - a.effective);

  if (rows.length === 0) return null;

  const maxEff = Math.max(...rows.map((r) => r.effective));
  const minEff = Math.min(...rows.map((r) => r.effective));

  // Opponent speed calculation
  let opponentSpeed: number | null = null;
  if (typeof opponentBaseSpeed === 'number' && opponentBaseSpeed > 0) {
    opponentSpeed = applyMods(calcSpeedStat(opponentBaseSpeed, 0, 1.0), { boost: 0, tailwind, scarf, paralysis: false });
  }

  return (
    <div className="mt-3 rounded-lg border border-surface-800 bg-surface-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-800">
        <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wide">
          {t('speedWidget.label')}
        </span>
      </div>

      {/* Modifiers row */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-surface-800">
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
          onClick={() => setScarf((v) => !v)}
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
            scarf
              ? 'bg-orange-600/40 text-orange-300 border border-orange-600/50'
              : 'bg-surface-800 text-surface-500 hover:text-surface-300 border border-transparent'
          }`}
        >
          {t('speedWidget.scarf')}
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

      {/* Opponent speed input */}
      <div className="px-3 py-1.5 border-b border-surface-800 bg-surface-900/30">
        <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wide block mb-1">
          {t('speedWidget.opponentSpeed')}
        </label>
        <input
          type="number"
          min="0"
          max="999"
          value={opponentBaseSpeed}
          onChange={(e) => setOpponentBaseSpeed(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          placeholder={t('speedWidget.opponentSpeedPlaceholder')}
          className="w-full text-xs bg-surface-800 border border-surface-700 rounded px-2 py-1 text-surface-200 placeholder-surface-600 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Your team rows */}
      {rows.map((row, i) => {
        const isFirst = i === 0;
        const isLast = i === rows.length - 1;
        const barPct = maxEff > minEff ? ((row.effective - minEff) / (maxEff - minEff)) * 100 : 100;
        const nameColor = isFirst ? 'text-green-400' : isLast ? 'text-orange-400' : 'text-surface-300';
        
        // Comparison with opponent
        const comparisonResult = opponentSpeed ? compareSpeed(row.effective, opponentSpeed) : null;
        const comparisonColor = comparisonResult === 'faster' ? 'text-green-400' : comparisonResult === 'tie' ? 'text-yellow-400' : 'text-red-400';

        return (
          <div key={row.slotIndex}>
            {/* Speed row */}
            <div
              onClick={() => setSelectedSlot(selectedSlot === row.slotIndex ? null : row.slotIndex)}
              className="relative flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-surface-800/30 transition-colors group"
            >
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
              <div className="relative flex-1 min-w-0">
                <span className={`text-xs truncate ${nameColor}`}>{row.name}</span>
                <span className="text-[9px] text-surface-600">{row.evs}/{row.nature === 1.1 ? '+' : 'N'}</span>
              </div>
              <span className="relative text-xs font-mono shrink-0 tabular-nums text-surface-400">
                {row.effective}
              </span>
              {opponentSpeed !== null && (
                <span className={`relative text-[10px] font-mono shrink-0 tabular-nums ${comparisonColor}`}>
                  {comparisonResult === 'faster' ? '+' : comparisonResult === 'tie' ? '=' : ''}
                  {opponentSpeed}
                </span>
              )}
              {selectedSlot === row.slotIndex && (
                <ChevronDown size={14} className="relative text-surface-500 group-hover:text-surface-300" />
              )}
            </div>

            {/* EV preset picker (shown when row is clicked) */}
            {selectedSlot === row.slotIndex && (
              <div className="px-3 py-2 bg-surface-800/20 border-t border-surface-800 flex flex-wrap gap-1">
                {EV_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSlotEvs({ ...slotEvs, [row.slotIndex]: preset.evs });
                      setSlotNatures({ ...slotNatures, [row.slotIndex]: preset.nature });
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                      row.evs === preset.evs && row.nature === preset.nature
                        ? 'bg-primary-600/40 text-primary-300 border border-primary-600/50'
                        : 'bg-surface-700 text-surface-400 hover:text-surface-200 border border-transparent'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
