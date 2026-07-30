'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Icon } from "@boffmedia/ui"
import type { MatchSlot } from '@/features/vgc-tracker/types';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import { useLegalPokemon } from '@/app/(boffmedia)/(herramientas)/pokemon/vgc/damage-calculator/_hooks/useLegalPokemon';
import { calcSpeedStat, applyMods, compareSpeed } from '@/app/(boffmedia)/(herramientas)/pokemon/vgc/speedCalc';
import { SpeedFlagChips } from '@/app/(boffmedia)/(herramientas)/pokemon/vgc/_components/SpeedFlagChips';

interface Props {
  slots: MatchSlot[];
  regulationId: string;
}

const EV_PRESETS = [
  { label: '0N', evs: 0, nature: 1.0 },
  { label: '0+', evs: 0, nature: 1.1 },
  { label: '252N', evs: 252, nature: 1.0 },
  { label: '252+', evs: 252, nature: 1.1 },
] as const;

export function SpeedTierWidget({ slots, regulationId }: Props) {
  const t = useTranslations('vgc.tracker');
  const tMods = useTranslations('vgc.speed.modifiers');
  const legalPokemon = useLegalPokemon(regulationId);
  const [tailwind, setTailwind] = useState(false);
  const [trickRoom, setTrickRoom] = useState(false);
  const [scarf, setScarf] = useState(false);
  const [slotEvs, setSlotEvs] = useState<Record<number, number>>({});
  const [slotNatures, setSlotNatures] = useState<Record<number, number>>({});
  const [opponentBaseSpeed, setOpponentBaseSpeed] = useState<number | ''>('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const rows = slots
    .filter((s) => !!s.speciesName)
    .map((s) => {
      const baseSpe = legalPokemon.find((p) => p.name === s.speciesName)?.baseStats.spe ?? 0;
      const evs = slotEvs[s.slotIndex] ?? 0;
      const nature = slotNatures[s.slotIndex] ?? 1.0;
      const stat = calcSpeedStat(baseSpe, evs, nature);
      const effective = applyMods(stat, { boost: 0, tailwind, scarf, paralysis: false });
      return { slotIndex: s.slotIndex, name: s.speciesName!, baseSpe, effective, evs, nature };
    })
    .filter((r) => r.baseSpe > 0)
    .sort((a, b) => (trickRoom ? a.effective - b.effective : b.effective - a.effective));

  if (rows.length === 0) return null;

  const maxEff = Math.max(...rows.map((r) => r.effective));
  const minEff = Math.min(...rows.map((r) => r.effective));

  let opponentSpeed: number | null = null;
  if (typeof opponentBaseSpeed === 'number' && opponentBaseSpeed > 0) {
    opponentSpeed = applyMods(calcSpeedStat(opponentBaseSpeed, 0, 1.0), { boost: 0, tailwind, scarf, paralysis: false });
  }

  return (
    <div className="overflow-hidden border border-solid border-line bg-panel">
      <div className="flex items-center justify-between border-b border-solid border-line px-3 py-[6px]">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-muted">{t('speedWidget.label')}</span>
      </div>

      {/* Modifiers */}
      <div className="flex gap-1 border-b border-solid border-line px-3 py-[6px]">
        <SpeedFlagChips
          className="flex gap-1"
          buttonClassName="text-[10px] px-[6px] py-[2px] font-mono border border-solid transition-colors"
          inactiveClassName="bg-base text-txt-muted hover:text-txt border-line-2"
          chips={[
            { key: 'tailwind', label: tMods('tailwindShort'), title: tMods('tailwind'), active: tailwind, activeClass: 'bg-signal-soft text-signal border-[color-mix(in_srgb,var(--info)_50%,transparent)]' },
            { key: 'scarf', label: tMods('scarfShort'), title: tMods('scarf'), active: scarf, activeClass: 'bg-accent-soft text-accent-bright border-accent-line' },
            { key: 'trickroom', label: t('speedWidget.trickroom'), title: t('speedWidget.trickroom'), active: trickRoom, activeClass: 'bg-warn-soft text-warn border-[color-mix(in_srgb,var(--warn)_50%,transparent)]' },
          ]}
          onToggle={(key) => {
            if (key === 'tailwind') setTailwind((v) => !v);
            if (key === 'scarf') setScarf((v) => !v);
            if (key === 'trickroom') setTrickRoom((v) => !v);
          }}
        />
      </div>

      {/* Opponent speed input */}
      <div className="border-b border-solid border-line px-3 py-[6px]">
        <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-muted">{t('speedWidget.opponentSpeed')}</label>
        <input
          type="number"
          min="0"
          max="999"
          value={opponentBaseSpeed}
          onChange={(e) => setOpponentBaseSpeed(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          placeholder={t('speedWidget.opponentSpeedPlaceholder')}
          className="w-full border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[12px] text-txt outline-none transition-[border-color] placeholder:text-txt-dim focus:border-accent"
        />
      </div>

      <div className="border-b border-solid border-line px-3 py-1 font-mono text-[10px] text-txt-dim">{t('speedWidget.presetHint')}</div>

      {/* Rows */}
      {rows.map((row, i) => {
        const isFirst = i === 0;
        const isLast = i === rows.length - 1;
        const barPct = maxEff > minEff ? ((row.effective - minEff) / (maxEff - minEff)) * 100 : 100;
        const nameColor = isFirst ? 'text-ok' : isLast ? 'text-warn' : 'text-txt';
        const comparisonResult = opponentSpeed ? compareSpeed(row.effective, opponentSpeed) : null;
        const comparisonColor = comparisonResult === 'faster' ? 'text-ok' : comparisonResult === 'tie' ? 'text-warn' : 'text-bad';

        return (
          <div key={row.slotIndex}>
            <div
              onClick={() => setSelectedSlot(selectedSlot === row.slotIndex ? null : row.slotIndex)}
              className="group relative flex cursor-pointer items-center gap-2 px-3 py-1 transition-colors hover:bg-panel-2"
            >
              <div className="absolute inset-y-0 left-0 bg-panel-2" style={{ width: `${barPct}%` }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spriteUrl(row.name)} alt="" className="relative h-6 w-6 shrink-0 object-contain" onError={handleSpriteError} />
              <div className="relative min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-[6px]">
                  <span className={cn('truncate text-[12px]', nameColor)}>{row.name}</span>
                  <span className="shrink-0 border border-solid border-line-2 bg-base px-1 py-px font-mono text-[9px] text-txt-muted">
                    {row.evs}/{row.nature === 1.1 ? '+' : 'N'}
                  </span>
                </div>
              </div>
              <span className="relative shrink-0 font-mono text-[12px] tabular-nums text-txt-muted">{row.effective}</span>
              {opponentSpeed !== null && (
                <span className={cn('relative shrink-0 font-mono text-[10px] tabular-nums', comparisonColor)}>
                  {comparisonResult === 'faster' ? '+' : comparisonResult === 'tie' ? '=' : ''}
                  {opponentSpeed}
                </span>
              )}
              {selectedSlot === row.slotIndex && <Icon name="chevronDown" size={14} className="relative text-txt-muted" />}
            </div>

            {selectedSlot === row.slotIndex && (
              <div className="flex flex-wrap gap-1 border-t border-solid border-line bg-base px-3 py-2">
                {EV_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSlotEvs({ ...slotEvs, [row.slotIndex]: preset.evs });
                      setSlotNatures({ ...slotNatures, [row.slotIndex]: preset.nature });
                    }}
                    className={cn(
                      'border border-solid px-2 py-[2px] font-mono text-[10px] transition-colors',
                      row.evs === preset.evs && row.nature === preset.nature
                        ? 'border-accent-line bg-accent-soft text-accent-bright'
                        : 'border-line-2 bg-panel text-txt-muted hover:text-txt',
                    )}
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
