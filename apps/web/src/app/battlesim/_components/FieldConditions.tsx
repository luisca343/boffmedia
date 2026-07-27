'use client';

import { Battle } from '@pkmn/client';
import { useTranslations } from 'next-intl';

/** Condition ids that have a `battlesim.field.cond.*` label; anything else falls back to the raw id. */
const COND_IDS = new Set([
  'sunnyday', 'desolateland', 'raindance', 'primordialsea', 'sandstorm', 'hail', 'snow',
  'deltastream', 'electricterrain', 'grassyterrain', 'mistyterrain', 'psychicterrain',
  'trickroom', 'magicroom', 'wonderroom', 'gravity',
]);

const COND_COLORS: Record<string, string> = {
  sunnyday: 'var(--amber-400)',
  desolateland: 'var(--amber-400)',
  raindance: 'var(--cyan-400)',
  primordialsea: 'var(--cyan-400)',
  sandstorm: 'var(--orange-400)',
  hail: 'var(--cyan-300)',
  snow: 'var(--cyan-300)',
  electricterrain: 'var(--ty-electric, var(--amber-400))',
  grassyterrain: 'var(--ty-grass, var(--emerald-400))',
  mistyterrain: 'var(--ty-fairy, var(--rose-400))',
  psychicterrain: 'var(--ty-psychic, var(--purple-400))',
  trickroom: 'var(--purple-400)',
};

interface ConditionChip {
  key: string;
  label: string;
  turns?: string;
  color: string;
  side?: 'ally' | 'foe';
}

type CondT = (key: string) => string;

function condLabel(t: CondT, id: string) {
  return COND_IDS.has(id) ? t(`cond.${id}`) : id;
}

function buildChips(battle: Battle, pov: 0 | 1, t: CondT): ConditionChip[] {
  const chips: ConditionChip[] = [];

  const pushState = (st: { id?: string; minDuration?: number; maxDuration?: number } | undefined) => {
    if (!st?.id) return;
    const turns = st.minDuration
      ? `${st.minDuration}${st.maxDuration && st.maxDuration > 0 ? `–${st.maxDuration}` : ''}`
      : undefined;
    chips.push({
      key: st.id,
      label: condLabel(t, st.id),
      turns,
      color: COND_COLORS[st.id] ?? 'var(--text-muted)',
    });
  };

  pushState(battle.field.weatherState as any);
  pushState(battle.field.terrainState as any);
  for (const [id, pw] of Object.entries(battle.field.pseudoWeather)) {
    chips.push({
      key: id,
      label: condLabel(t, id),
      turns: (pw as any)?.minDuration ? String((pw as any).minDuration) : undefined,
      color: COND_COLORS[id] ?? 'var(--text-muted)',
    });
  }

  const allySide = pov === 0 ? battle.p1 : battle.p2;
  const foeSide = pov === 0 ? battle.p2 : battle.p1;
  ([['ally', allySide], ['foe', foeSide]] as const).forEach(([tag, side]) => {
    for (const cond of Object.values(side.sideConditions)) {
      const c: any = cond;
      chips.push({
        key: `${tag}-${c.name}`,
        label: c.name,
        turns: c.minDuration ? `${c.minDuration}${c.maxDuration > 0 ? `–${c.maxDuration}` : ''}` : undefined,
        color: tag === 'foe' ? 'var(--orange-400)' : 'var(--secondary-hover)',
        side: tag,
      });
    }
  });

  return chips;
}

/**
 * Compact field-condition chips (weather / terrain / rooms / hazards & screens)
 * so the field state is readable without the log.
 */
export function FieldConditions({ battle, pov = 0 }: { battle: Battle; pov?: 0 | 1 }) {
  const t = useTranslations('battlesim.field');
  const chips = buildChips(battle, pov, t);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 max-w-[280px]" role="status" aria-label={t('aria')}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 font-mono font-bold text-t-4xs tracking-[.06em] uppercase px-[.45em] py-[.22em] rounded-[var(--radius-sm)] whitespace-nowrap"
          style={{
            color: chip.color,
            background: `color-mix(in srgb, ${chip.color} 14%, var(--layer-1))`,
            border: `1px solid color-mix(in srgb, ${chip.color} 40%, transparent)`,
          }}
        >
          {chip.side === 'foe' ? '▲ ' : chip.side === 'ally' ? '▼ ' : ''}
          {chip.label}
          {chip.turns && <b className="tabular-nums opacity-75">{chip.turns}</b>}
        </span>
      ))}
    </div>
  );
}
