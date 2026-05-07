'use client'

import { useTranslations } from 'next-intl'
import type { CalcField, SideConditions } from '../../_types/calculator'

type PillColor = 'orange' | 'cyan' | 'violet' | 'lime'

const ACTIVE: Record<PillColor, string> = {
  orange: 'bg-primary-500/15 border-primary-500/35 text-primary-400',
  cyan:   'bg-cyan-500/12 border-cyan-400/35 text-cyan-300',
  violet: 'bg-accent-500/15 border-accent-500/35 text-accent-300',
  lime:   'bg-lime-500/12 border-lime-500/35 text-lime-400',
}
const IDLE = 'bg-surface-800/50 border-surface-700/50 text-surface-500 hover:text-surface-300'

function FieldPill({
  label, active, color = 'orange', onClick,
}: { label: string; active: boolean; color?: PillColor; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all whitespace-nowrap ${
        active ? ACTIVE[color] : IDLE
      }`}
    >
      {label}
    </button>
  )
}

interface Props {
  field: CalcField
  onFieldChange: (patch: Partial<CalcField>) => void
  onAttackerSide: (patch: Partial<SideConditions>) => void
  onDefenderSide: (patch: Partial<SideConditions>) => void
}

export function CompactFieldBar({ field, onFieldChange, onAttackerSide, onDefenderSide }: Props) {
  const t = useTranslations('vgc.calc.compactField')
  const tf = useTranslations('vgc.calc.field')
  return (
    <div className="shrink-0 border-b border-surface-700/40 bg-surface-900/90 px-3 py-1.5 flex flex-wrap items-center gap-1.5">
      {(['Singles', 'Doubles'] as const).map((f) => (
        <FieldPill key={f} label={t(f === 'Singles' ? 'singles' : 'doubles')} active={field.format === f} onClick={() => onFieldChange({ format: f })} />
      ))}
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      {(['Sun', 'Rain', 'Sand', 'Snow', 'Harsh Sunshine', 'Heavy Rain'] as const).map((w) => (
        <FieldPill key={w} label={tf(`weathers.${w}` as any)} active={field.weather === w}
          color={w === 'Rain' || w === 'Heavy Rain' ? 'cyan' : 'orange'}
          onClick={() => onFieldChange({ weather: field.weather === w ? 'None' : w })}
        />
      ))}
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      {(['Electric', 'Grassy', 'Psychic', 'Misty'] as const).map((te) => (
        <FieldPill key={te} label={tf(`terrains.${te}` as any)} active={field.terrain === te}
          color={te === 'Grassy' ? 'lime' : te === 'Psychic' || te === 'Misty' ? 'violet' : 'orange'}
          onClick={() => onFieldChange({ terrain: field.terrain === te ? 'None' : te })}
        />
      ))}
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      <FieldPill label={t('trickRoom')} active={field.trickRoom} color="violet"
        onClick={() => onFieldChange({ trickRoom: !field.trickRoom })} />
      <FieldPill label={t('gravity')} active={field.gravity} color="violet"
        onClick={() => onFieldChange({ gravity: !field.gravity })} />
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      <FieldPill label={t('atkTailwind')} active={field.attackerSide.tailwind} color="cyan"
        onClick={() => onAttackerSide({ tailwind: !field.attackerSide.tailwind })} />
      <FieldPill label={t('atkHelpingHand')} active={field.attackerSide.helpingHand} color="lime"
        onClick={() => onAttackerSide({ helpingHand: !field.attackerSide.helpingHand })} />
      <FieldPill label={t('defTailwind')} active={field.defenderSide.tailwind} color="cyan"
        onClick={() => onDefenderSide({ tailwind: !field.defenderSide.tailwind })} />
      <FieldPill label={t('defReflect')} active={field.defenderSide.reflect}
        onClick={() => onDefenderSide({ reflect: !field.defenderSide.reflect })} />
      <FieldPill label={t('defLightScreen')} active={field.defenderSide.lightScreen} color="cyan"
        onClick={() => onDefenderSide({ lightScreen: !field.defenderSide.lightScreen })} />
    </div>
  )
}
