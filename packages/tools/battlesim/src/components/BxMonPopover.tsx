'use client';

import { Modal } from '@boffmedia/ui';
import { Dex } from '@pkmn/dex';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { BxSprite, BxTypeRow, BxType, BxStatus, BxBoost, BxTera, BxHp, useBxLabels } from './bx-kit';
import { hpTone } from '../lib/bx-helpers';
import type { BSXMon } from '../engine/toBSXMon';

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

/**
 * Everything the old 498-line PokemonDetail showed, in the shared Modal:
 * identity, HP, status, boosts, ability/item when known, known moves and base
 * stats. Opened from a field plate; Escape and the scrim close it.
 */
export function BxMonPopover({ mon, foe = false, open, onClose }: { mon: BSXMon | null; foe?: boolean; open: boolean; onClose: () => void }) {
  const t = useToolT(BATTLESIM_NS);
  const L = useBxLabels();
  if (!mon) return null;
  const pct = mon.fnt ? 0 : mon.hp;
  const boosts = Object.entries((mon.boosts || {}) as Record<string, number>).filter(([, v]) => v);
  const moves = (mon.moveIds || []).map((id) => {
    const m = Dex.moves.get(id);
    return m?.exists ? { id, name: m.name, type: m.type } : { id, name: id, type: 'Normal' };
  });
  const showExact = !foe && mon.hpCur != null && mon.hpMax != null;
  const max = Math.max(...STAT_KEYS.map((k) => mon.stats[k]), 1);
  const abilityName = mon.ability ? (Dex.abilities.get(mon.ability)?.name ?? mon.ability) : null;
  const itemName = mon.item ? (Dex.items.get(mon.item)?.name ?? mon.item) : null;

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('battle.mon.details', { name: mon.name })}>
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <BxSprite mon={mon} size={56} />
          <div className="grid min-w-0 flex-1 gap-[6px]">
            <div className="flex min-w-0 items-center gap-2">
              {mon.tera && mon.teraType && <BxTera type={mon.teraType} size="1em" />}
              <b className="min-w-0 truncate font-display text-[16px] font-bold uppercase leading-none tracking-[0.03em] text-txt">{mon.name}</b>
              {mon.level != null && <span className="font-mono text-[10px] leading-none text-txt-dim">{t('battle.mon.level', { level: mon.level })}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <BxTypeRow types={mon.tera && mon.teraType ? [mon.teraType] : mon.types} small />
              <BxStatus status={mon.status} long />
            </div>
          </div>
        </div>

        <div className="grid gap-[6px]">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-txt-dim">
            <span>{t('battle.mon.hp')}</span>
            <b className="text-[13px] tracking-normal" style={{ color: mon.fnt ? 'var(--muted)' : hpTone(pct) }}>{mon.fnt ? t('battle.end.ko') : showExact ? `${mon.hpCur}/${mon.hpMax} · ${pct}%` : `${pct}%`}</b>
          </div>
          <BxHp pct={pct} trail={false} />
        </div>

        {boosts.length > 0 && (
          <div className="grid gap-[6px]">
            <span className="font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-txt-dim">{t('battle.mon.boosts')}</span>
            <div className="flex flex-wrap gap-1">{boosts.map(([s, v]) => <BxBoost key={s} stat={s} value={v} />)}</div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="grid gap-1">
            <dt className="font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-txt-dim">{t('battle.mon.ability')}</dt>
            <dd className="m-0 font-body text-[13px] leading-none text-txt">{abilityName ?? t('battle.mon.unknown')}</dd>
          </div>
          <div className="grid gap-1">
            <dt className="font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-txt-dim">{t('battle.mon.item')}</dt>
            <dd className="m-0 font-body text-[13px] leading-none text-txt">{itemName ?? t('battle.mon.unknown')}</dd>
          </div>
        </dl>

        <div className="grid gap-[6px]">
          <span className="font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-txt-dim">{t('battle.mon.moves')} {foe && moves.length > 0 ? `· ${moves.length} ${t('battle.mon.known')}` : ''}</span>
          {moves.length === 0 ? (
            <span className="font-body text-[12.5px] text-txt-dim">{t('battle.mon.unknown')}</span>
          ) : (
            <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
              {moves.map((m) => (
                <li key={m.id} className="flex min-w-0 items-center justify-between gap-2 border border-solid border-line bg-base px-2 py-[6px]">
                  <span className="min-w-0 truncate font-display text-[12px] font-bold uppercase leading-none tracking-[0.03em] text-txt">{m.name}</span>
                  <BxType type={m.type} small />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-[6px]">
          <span className="font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-txt-dim">{t('battle.mon.stats')}</span>
          <div className="grid gap-1">
            {STAT_KEYS.map((k) => (
              <div key={k} className="grid grid-cols-[64px_1fr_36px] items-center gap-2">
                <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.06em] text-txt-muted">{L.stat(k)}</span>
                <span className="h-[5px] overflow-hidden border border-solid border-line bg-base"><i className="block h-full bg-accent" style={{ width: (mon.stats[k] / max) * 100 + '%' }} /></span>
                <span className="text-right font-mono text-[11px] font-bold leading-none text-txt">{mon.stats[k]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
