'use client';

import { Dex } from '@pkmn/dex';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { BxSprite, BxTypeRow, BxType, BxStatus, BxBoost, BxHp, BxTera, BxVolatiles, useBxLabels, BX_PLATE_VOICE, hpAriaLabel } from './bx-kit';
import { hpTone, shownVolatiles, perishCount, GENDER_GLYPH } from '../lib/bx-helpers';
import { cn } from '../lib/cn';
import type { BSXMon } from '../engine/toBSXMon';

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

/** Where the hovered sprite sits inside the field, in canvas pixels. */
export interface HoverAnchor { left: number; top: number; size: number }

/**
 * The at-a-glance card for a Pokémon ON THE FIELD, shown on hover.
 *
 * Showdown puts this behind a hover and players read it constantly — what the
 * thing in front of them is holding, what it has already shown you, how fast
 * it is — so it is not a detail view you go and open. `BxMonPopover` is still
 * the detail view (click a plate; it is a modal, it can be read at leisure and
 * it lists every base stat as a bar). This is the glance: the same facts, laid
 * out to be read in the second before you commit to a move, and it never takes
 * a click or covers the board for longer than the pointer rests.
 *
 * IT IS `pointer-events-none` ON PURPOSE. The card is drawn over the field
 * beside a sprite you are hovering, and the sprite's own hover is what keeps it
 * open — a card that could take the pointer would sit under it, steal the
 * enter/leave pair and flicker. Nothing in it is clickable for that reason;
 * everything here is also reachable in the popover, which is.
 */
export function BxMonHoverCard({ mon, foe = false, anchor, field, compact = false }: {
  mon: BSXMon;
  foe?: boolean;
  anchor: HoverAnchor;
  /** The field's own box, so the card can be kept inside it. */
  field: { width: number; height: number };
  compact?: boolean;
}) {
  const t = useToolT(BATTLESIM_NS);
  const L = useBxLabels();

  const pct = mon.fnt ? 0 : mon.hp;
  const showExact = !foe && mon.hpCur != null && mon.hpMax != null;
  const boosts = Object.entries((mon.boosts || {}) as Record<string, number>).filter(([, v]) => v);
  const volatiles = shownVolatiles(mon.volatiles ?? (mon.protect ? ['protect'] : []));
  const perish = perishCount(mon.volatiles);
  const abilityName = mon.ability ? L.ability(mon.ability) : null;
  const itemName = mon.item ? L.item(mon.item) : null;
  const moves = (mon.moveIds || []).map((id) => {
    const m = Dex.moves.get(id);
    return m?.exists ? { id, name: L.move(m.name), type: m.type } : { id, name: id, type: 'Normal' };
  });

  // Placed against the sprite, then clamped inside the field — a card that
  // hangs off the edge is the one thing worse than no card, because the half
  // that leaves is the half you were reading.
  const W = compact ? 210 : 264;
  const GAP = 10;
  const left = Math.max(6, Math.min(field.width - W - 6, anchor.left + anchor.size / 2 - W / 2));
  const above = anchor.top > field.height * 0.45;
  const style: React.CSSProperties = above
    ? { left, bottom: Math.max(6, field.height - anchor.top + GAP), width: W }
    : { left, top: anchor.top + anchor.size + GAP, width: W };

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-[130] flex flex-col gap-[0.4375rem] border border-solid border-line-2 bg-base/95 p-2 shadow-[0_6px_24px_rgba(0,0,0,0.55)] backdrop-blur-[6px]',
        'cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)]',
        'animate-[bm-drawer-in_120ms_ease_both] motion-reduce:animate-none',
      )}
      style={{ ...style, maxHeight: field.height - 12, overflow: 'hidden' }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <BxSprite mon={mon} size={compact ? 28 : 34} />
        <span className="grid min-w-0 flex-1 gap-[0.25rem]">
          <span className="flex min-w-0 items-center gap-[0.3125rem]">
            {mon.tera && mon.teraType && <BxTera type={mon.teraType} size="0.85em" />}
            <b className="min-w-0 truncate font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.03em] text-txt">{mon.name}</b>
            {GENDER_GLYPH[mon.gender ?? ''] && <i aria-hidden title={mon.gender} className={cn('flex-none not-italic leading-none', mon.gender === 'F' ? 'text-[#f95587]' : 'text-[#6390f0]')}>{GENDER_GLYPH[mon.gender ?? '']}</i>}
            {mon.level != null && <span className="flex-none font-mono text-[0.5625rem] leading-none text-txt-dim">{t('battle.mon.level', { level: mon.level })}</span>}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            <BxTypeRow types={mon.tera && mon.teraType ? [mon.teraType] : mon.types} small />
            <BxStatus status={mon.status} />
          </span>
        </span>
      </div>

      <div className="grid gap-[0.25rem]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.5625rem] uppercase leading-none tracking-[0.1em] text-txt-dim">{t('battle.mon.hp')}</span>
          <b aria-label={hpAriaLabel(t, mon, pct, showExact)} className="text-[0.75rem] leading-none" style={{ ...BX_PLATE_VOICE, color: mon.fnt ? 'var(--muted)' : hpTone(pct) }}>
            {mon.fnt ? t('battle.end.ko') : showExact ? `${mon.hpCur}/${mon.hpMax}` : `${pct}%`}
          </b>
        </div>
        <BxHp pct={pct} monKey={mon.searchid ?? mon.id} ko={!!mon.fnt} />
      </div>

      {(boosts.length > 0 || volatiles.length > 0 || perish != null) && (
        <div className="flex flex-wrap gap-1">
          <BxVolatiles ids={volatiles} perish={perish} />
          {boosts.map(([s, v]) => <BxBoost key={s} stat={s} value={v} />)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-2 gap-y-[0.25rem]">
        {([['battle.mon.ability', abilityName], ['battle.mon.item', itemName]] as const).map(([key, value]) => (
          <span key={key} className="grid min-w-0 gap-[0.125rem]">
            <span className="font-mono text-[0.53125rem] uppercase leading-none tracking-[0.1em] text-txt-dim">{t(key)}</span>
            <span className={cn('min-w-0 truncate font-body text-[0.71875rem] leading-none', value ? 'text-txt' : 'text-txt-dim')}>{value ?? t('battle.mon.unknown')}</span>
          </span>
        ))}
      </div>

      {/* Stats as chips, not six labelled bars: at a glance you are comparing
          numbers to numbers you already know, and the bars are what make the
          popover a page rather than a card.

          `L.boost`, NOT `L.stat`. The long names are what a chip this size
          cannot hold — "Velocidad" and "At. Esp." are 9 and 8 characters
          against about 70px of chip, and since neither the label nor the number
          could shrink they simply overlapped and printed one on top of the
          other. The short forms already exist for the boost chips on the field
          plates ("+1 AtE"), so this reuses that vocabulary rather than
          inventing a second set of abbreviations, and it is short in both
          locales (Atq/AtE/DfE/Vel · Atk/SpA/SpD/Spe).

          The truncate/flex-none pair is the structural half of the fix: a
          locale with longer words, or a bigger display scale, now clips the
          LABEL instead of colliding with the number. The number is the half you
          cannot lose, so it is the half that never yields. */}
      <div className="grid grid-cols-3 gap-1">
        {STAT_KEYS.filter((k) => k !== 'hp').map((k) => (
          <span key={k} className="flex min-w-0 items-baseline gap-[0.25rem] border border-solid border-line bg-panel px-[0.3125rem] py-[0.1875rem]">
            <span className="min-w-0 flex-1 truncate font-mono text-[0.5rem] uppercase leading-none tracking-[0.04em] text-txt-dim">{L.boost(k)}</span>
            <b className="flex-none font-mono text-[0.6875rem] font-bold leading-none text-txt [font-variant-numeric:tabular-nums]">{mon.stats[k]}</b>
          </span>
        ))}
      </div>

      {!compact && (
        // Nothing revealed yet is the COMMON case for a foe on turn one, and a
        // stacked heading over a lone em dash spent two lines saying so. Inline
        // when empty, stacked only when there is a list to head.
        <div className={cn('gap-[0.25rem]', moves.length === 0 ? 'flex items-baseline justify-between' : 'grid')}>
          <span className="font-mono text-[0.53125rem] uppercase leading-none tracking-[0.1em] text-txt-dim">
            {t('battle.mon.moves')}{foe && moves.length > 0 ? ` · ${moves.length} ${t('battle.mon.known')}` : ''}
          </span>
          {moves.length === 0 ? (
            <span className="font-body text-[0.6875rem] leading-none text-txt-dim">{t('battle.mon.unknown')}</span>
          ) : (
            <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
              {moves.slice(0, 6).map((m) => (
                <li key={m.id} className="flex min-w-0 items-center justify-between gap-1 border border-solid border-line bg-panel px-[0.3125rem] py-[0.1875rem]">
                  <span className="min-w-0 truncate font-display text-[0.65625rem] font-bold uppercase leading-none tracking-[0.03em] text-txt">{m.name}</span>
                  <BxType type={m.type} small />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
