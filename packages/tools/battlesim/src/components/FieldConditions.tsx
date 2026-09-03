'use client';

import { Battle } from '@pkmn/client';
import type { IconName } from '@boffmedia/ui';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { BxField } from './bx-kit';
import { tyColor, toId } from '../lib/bx-helpers';

/** Condition ids with a `field.cond.*` label. */
const COND_IDS = new Set([
  'sunnyday', 'desolateland', 'raindance', 'primordialsea', 'sandstorm', 'hail', 'snow',
  'deltastream', 'electricterrain', 'grassyterrain', 'mistyterrain', 'psychicterrain',
  'trickroom', 'magicroom', 'wonderroom', 'gravity',
]);
/** Side conditions with a `battle.side.*` label. */
const SIDE_IDS = new Set([
  'stealthrock', 'spikes', 'toxicspikes', 'stickyweb', 'reflect', 'lightscreen', 'auroraveil',
  'tailwind', 'safeguard', 'mist', 'luckychant',
]);

const COND_TONE: Record<string, string> = {
  sunnyday: tyColor('Fire'), desolateland: tyColor('Fire'),
  raindance: tyColor('Water'), primordialsea: tyColor('Water'),
  sandstorm: tyColor('Rock'), hail: tyColor('Ice'), snow: tyColor('Ice'), deltastream: tyColor('Flying'),
  electricterrain: tyColor('Electric'), grassyterrain: tyColor('Grass'), mistyterrain: tyColor('Fairy'), psychicterrain: tyColor('Psychic'),
  trickroom: 'var(--info)', magicroom: 'var(--info)', wonderroom: 'var(--info)', gravity: 'var(--info)',
};
const COND_ICON: Record<string, IconName> = {
  sunnyday: 'sun', desolateland: 'sun', raindance: 'drop', primordialsea: 'drop', sandstorm: 'wheel', hail: 'sparkles', snow: 'sparkles', deltastream: 'compass',
  electricterrain: 'bolt', grassyterrain: 'tree', mistyterrain: 'sparkles', psychicterrain: 'star',
  trickroom: 'clock', magicroom: 'cube', wonderroom: 'cube', gravity: 'target',
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Label for a weather/terrain/room/side id, or `null` when the catalog has none. */
export function resolveCondLabel(t: Translate, rawId: string): string | null {
  const id = toId(rawId);
  if (COND_IDS.has(id)) return t(`field.cond.${id}`);
  if (SIDE_IDS.has(id)) return t(`battle.side.${id}`);
  return null;
}

export interface FieldChip {
  key: string;
  label: string;
  turns?: string;
  tone?: string;
  icon: IconName;
  side?: 'ally' | 'foe';
}

export function buildFieldChips(battle: Battle, pov: 0 | 1, t: Translate): FieldChip[] {
  const chips: FieldChip[] = [];
  const turnsOf = (st: { minDuration?: number; maxDuration?: number } | undefined) =>
    st?.minDuration ? `${st.minDuration}${st.maxDuration && st.maxDuration > 0 && st.maxDuration !== st.minDuration ? `–${st.maxDuration}` : ''}` : undefined;

  const pushState = (st: { id?: string; minDuration?: number; maxDuration?: number } | undefined) => {
    if (!st?.id) return;
    chips.push({ key: st.id, label: resolveCondLabel(t, st.id) ?? st.id, turns: turnsOf(st), tone: COND_TONE[st.id], icon: COND_ICON[st.id] ?? 'sparkles' });
  };

  pushState(battle.field.weatherState as any);
  pushState(battle.field.terrainState as any);
  for (const [id, pw] of Object.entries(battle.field.pseudoWeather)) {
    chips.push({ key: id, label: resolveCondLabel(t, id) ?? id, turns: turnsOf(pw as any), tone: COND_TONE[id] ?? 'var(--info)', icon: COND_ICON[id] ?? 'cube' });
  }

  const allySide = pov === 0 ? battle.p1 : battle.p2;
  const foeSide = pov === 0 ? battle.p2 : battle.p1;
  ([['ally', allySide], ['foe', foeSide]] as const).forEach(([tag, side]) => {
    for (const [id, cond] of Object.entries(side.sideConditions)) {
      const c: any = cond;
      const label = resolveCondLabel(t, id) ?? c.name ?? id;
      chips.push({
        key: `${tag}-${id}`,
        label: c.level > 1 ? `${label} ×${c.level}` : label,
        turns: turnsOf(c),
        tone: tag === 'foe' ? 'var(--bad)' : 'var(--accent)',
        icon: 'shield',
        side: tag,
      });
    }
  });

  return chips;
}

/**
 * Field-condition chips (weather / terrain / rooms / hazards & screens), so
 * the field state is readable without the log. `max` folds the rest into a
 * "+N" chip on small canvases.
 */
export function FieldConditions({ battle, pov = 0, max }: { battle: Battle; pov?: 0 | 1; max?: number }) {
  const t = useToolT(BATTLESIM_NS);
  const chips = buildFieldChips(battle, pov, t);
  if (chips.length === 0) return null;
  const shown = max != null ? chips.slice(0, max) : chips;
  const rest = chips.length - shown.length;

  return (
    <div className="flex max-w-full flex-wrap gap-1" role="status" aria-label={t('field.aria')}>
      {shown.map((chip) => <BxField key={chip.key} icon={chip.icon} name={chip.label} turns={chip.turns} tone={chip.tone} side={chip.side} />)}
      {rest > 0 && <BxField icon="more" name={`+${rest}`} />}
    </div>
  );
}
