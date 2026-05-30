'use client'

import { useTranslations } from 'next-intl'
import type { CalcField, SideConditions } from '../../_types/calculator'

interface Props {
  field: CalcField
  onFieldChange: (patch: Partial<CalcField>) => void
  onAttackerSide: (patch: Partial<SideConditions>) => void
  onDefenderSide: (patch: Partial<SideConditions>) => void
}

type PillColor = 'orange' | 'blue' | 'cyan' | 'violet' | 'lime' | 'red'

const PILL_ACTIVE: Record<PillColor, string> = {
  orange: 'bg-primary-500/15 border-primary-500/50 text-primary-400',
  blue:   'bg-blue-500/12 border-blue-500/40 text-blue-400',
  cyan:   'bg-cyan-500/12 border-cyan-400/40 text-cyan-300',
  violet: 'bg-accent-500/12 border-accent-500/40 text-accent-300',
  lime:   'bg-lime-500/12 border-lime-500/40 text-lime-400',
  red:    'bg-error-500/12 border-error-500/40 text-error-400',
}
const PILL_IDLE = 'bg-surface-800/70 border-surface-700/60 text-surface-500 hover:border-surface-600 hover:text-surface-300'

function Pill({
  label, active, color = 'orange', onClick,
}: { label: string; active: boolean; color?: PillColor; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-fit text-center px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
        active ? PILL_ACTIVE[color] : PILL_IDLE
      }`}
    >
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">
      {children}
      <span className="flex-1 h-px bg-surface-700/50" />
    </div>
  )
}

const WEATHERS = ['Sun', 'Rain', 'Sand', 'Snow', 'Harsh Sunshine', 'Heavy Rain'] as const
const TERRAINS = ['Electric', 'Grassy', 'Psychic', 'Misty'] as const

const WEATHER_COLOR: Record<string, PillColor> = {
  Sun: 'orange', Rain: 'blue', Sand: 'orange', Snow: 'cyan',
  'Harsh Sunshine': 'red', 'Heavy Rain': 'blue',
}
const TERRAIN_COLOR: Record<string, PillColor> = {
  Electric: 'orange', Grassy: 'lime', Psychic: 'violet', Misty: 'cyan',
}

export function FieldPanel({ field, onFieldChange, onAttackerSide, onDefenderSide }: Props) {
  const t = useTranslations('vgc.calc.field')
  function toggleWeather(w: string) {
    onFieldChange({ weather: field.weather === w ? 'None' : (w as CalcField['weather']) })
  }
  function toggleTerrain(t: string) {
    onFieldChange({ terrain: field.terrain === t ? 'None' : (t as CalcField['terrain']) })
  }

  return (
    <div className="bg-surface-950/98 border-x border-surface-700/30 flex flex-col gap-3 p-3">
      {/* Title */}
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-primary-500 text-center py-1 border-b border-primary-500/20">
        ⚡ {t('title')}
      </div>

      {/* Format */}
      <div className="flex gap-1.5">
        {(['Singles', 'Doubles'] as const).map((f) => (
          <Pill
            key={f}
            label={t(f === 'Singles' ? 'singles' : 'doubles')}
            active={field.format === f}
            onClick={() => onFieldChange({ format: f })}
          />
        ))}
      </div>

      {/* Weather */}
      <div className="bg-surface-900/50 border border-surface-800/50 rounded-lg p-2.5 space-y-2">
        <SectionLabel>{t('weather')}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {WEATHERS.map((w) => (
            <Pill
              key={w}
              label={t(`weathers.${w}`)}
              active={field.weather === w}
              color={WEATHER_COLOR[w]}
              onClick={() => toggleWeather(w)}
            />
          ))}
        </div>
      </div>

      {/* Terrain */}
      <div className="bg-surface-900/50 border border-surface-800/50 rounded-lg p-2.5 space-y-2">
        <SectionLabel>{t('terrain')}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {TERRAINS.map((tr) => (
            <Pill
              key={tr}
              label={t(`terrains.${tr}`)}
              active={field.terrain === tr}
              color={TERRAIN_COLOR[tr]}
              onClick={() => toggleTerrain(tr)}
            />
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-surface-900/50 border border-surface-800/50 rounded-lg p-2.5 space-y-2">
        <SectionLabel>{t('conditions')}</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <Pill label={t('pill.Trick Room')} active={field.trickRoom} color="violet" onClick={() => onFieldChange({ trickRoom: !field.trickRoom })} />
          <Pill label={t('pill.Gravity')} active={field.gravity} color="violet" onClick={() => onFieldChange({ gravity: !field.gravity })} />
          <Pill label={t('pill.Magic Room')} active={field.magicRoom} color="violet" onClick={() => onFieldChange({ magicRoom: !field.magicRoom })} />
          <Pill label={t('pill.Wonder Room')} active={field.wonderRoom} color="cyan" onClick={() => onFieldChange({ wonderRoom: !field.wonderRoom })} />
        </div>
      </div>

      {/* Per-side hazards */}
      {(
        [
          { key: 'attackerSide', label: t('attackerSide'), side: field.attackerSide, update: onAttackerSide },
          { key: 'defenderSide', label: t('defenderSide'), side: field.defenderSide, update: onDefenderSide },
        ] as const
      ).map(({ key, label, side, update }) => (
        <div key={key} className="bg-surface-900/50 border border-surface-800/50 rounded-lg p-2.5 space-y-2">
          <SectionLabel>{label}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            <Pill label={t('pill.Stealth Rock')} active={side.stealthRock} onClick={() => update({ stealthRock: !side.stealthRock })} />
            <Pill label={t('pill.Reflect')} active={side.reflect} color="blue" onClick={() => update({ reflect: !side.reflect })} />
            <Pill label={t('pill.Light Screen')} active={side.lightScreen} color="cyan" onClick={() => update({ lightScreen: !side.lightScreen })} />
            <Pill label={t('pill.Aurora Veil')} active={side.auroraVeil} color="cyan" onClick={() => update({ auroraVeil: !side.auroraVeil })} />
            <Pill label={t('pill.Tailwind')} active={side.tailwind} color="cyan" onClick={() => update({ tailwind: !side.tailwind })} />
            <Pill label={t('pill.Helping Hand')} active={side.helpingHand} color="lime" onClick={() => update({ helpingHand: !side.helpingHand })} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-surface-500">{t('pill.Spikes')}</span>
            {([0, 1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ spikes: n })}
                className={`w-6 h-6 rounded text-xs font-bold border transition-all ${
                  side.spikes === n
                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                    : 'bg-surface-800 border-surface-700 text-surface-500 hover:text-surface-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
