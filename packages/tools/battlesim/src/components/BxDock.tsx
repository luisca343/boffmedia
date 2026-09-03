'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, cn, toast } from '@boffmedia/ui';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { BxKey, BxBench, BxPlan, BxTeraBtn, BxMechBtn, BxKbdHint, BxRing, type BxPlanAction } from './bx-kit';
import { BSIM_FOCUS } from './bsim-kit';
import { useBattleHotkeys } from '../useBattleHotkeys';
import { useRoomVisible } from '../lib/room-visibility';
import type { BSXLayout, BSXSlot } from '../useBSXLayout';
import type { BSXKeyMove } from '../engine/toBSXMon';
import type { TargetOption, TargetingState } from '../lib/battle-types';
import { useNodeSize, type BattleLayoutKind } from '../lib/battle-layout';

export type ActiveMechanic = 'terastallize' | 'mega' | 'dynamax' | 'zmove' | null;

const MECHANIC_EVENT_MARKERS = ['|-mega|', '|-terastallize|', '|-zpower|', '|-burst|', '|-primal|'];
export function hasMechanicBeenUsed(htmlLog: string[]): boolean {
  return htmlLog.some((line) => MECHANIC_EVENT_MARKERS.some((marker) => line.includes(marker)));
}

type Order =
  | { kind: 'move'; move: number; name: string; type: string; target?: number; targetName?: string; spread?: string; mech?: ActiveMechanic }
  | { kind: 'switch'; bench: number; name: string }
  | { kind: 'pass' };

type Segment = 'moves' | 'switch' | 'team';

interface PendingTarget { slot: number; move: number; name: string; type: string; options: TargetOption[] }

const NEEDS_TARGET = new Set(['normal', 'any', 'adjacentFoe', 'adjacentAlly', 'adjacentAllyOrSelf']);

const MECH_META: Record<Exclude<ActiveMechanic, null | 'terastallize'>, { glyph: string; tone: string; hotkey: string }> = {
  mega: { glyph: '◈', tone: 'var(--bad)', hotkey: 'M' },
  dynamax: { glyph: '▲', tone: 'var(--info)', hotkey: 'D' },
  zmove: { glyph: '⚡', tone: 'var(--accent)', hotkey: 'Z' },
};

interface BxDockProps {
  bsx: BSXLayout;
  status: string;
  /** The request is ours to answer. */
  isWaiting: boolean;
  htmlLog: string[];
  onChoice: (choice: string) => void;
  /** Cancel a SENT choice (PvP/Showdown). Local battles resolve instantly and have none. */
  onUndo?: () => void;
  timer?: number | null;
  timerMax?: number;
  /** Publishes target mode to the canvas (plates become targetable). */
  onTargeting: (t: TargetingState | null) => void;
  /** Hovered damaging move → the canvas highlights the foe. */
  onAim?: (aiming: boolean) => void;
  spectator?: boolean;
  layout: BattleLayoutKind;
}

const orderToPlan = (o: Order | null, t: (k: string, v?: Record<string, string | number>) => string): BxPlanAction => {
  if (!o) return null;
  if (o.kind === 'pass') return { kind: 'pass' };
  if (o.kind === 'switch') return { kind: 'switch', toName: o.name };
  return { kind: 'move', move: { name: o.name, type: o.type }, target: o.spread ? { spread: o.spread } : null, targetName: o.targetName, mech: o.mech ? t(`battle.dock.mech.${o.mech}`).toUpperCase() : undefined };
};

const orderToChoice = (o: Order | null): string => {
  if (!o || o.kind === 'pass') return 'pass';
  if (o.kind === 'switch') return `switch ${o.bench}`;
  const parts = [`move ${o.move}`];
  if (o.target != null) parts.push(o.target > 0 ? `+${o.target}` : String(o.target));
  if (o.mech) parts.push(o.mech);
  return parts.join(' ');
};

/**
 * The action dock. One region whose SHAPE never changes: a segmented header
 * (Movimientos · Cambiar · Equipo) that the phase enables rather than
 * remounts, an order strip of BxPlan chips under it, then the keys.
 *
 * Orders are kept locally per active slot and the combined choice string is
 * sent only when every slot that needs one has one — so ✕ on a chip undoes
 * before anything reaches the engine, in singles and doubles alike. In
 * doubles the cursor walks slot A → B; a chip click re-opens that slot.
 */
export function BxDock({ bsx, status, isWaiting, htmlLog, onChoice, onUndo, timer, timerMax = 60, onTargeting, onAim, spectator = false, layout }: BxDockProps) {
  const t = useToolT(BATTLESIM_NS);
  const roomVisible = useRoomVisible();
  const mobile = layout === 'mobile';
  const doubles = bsx.activeCount > 1;

  const [orders, setOrdersState] = useState<(Order | null)[]>([]);
  const ordersRef = useRef<(Order | null)[]>([]);
  const setOrders = useCallback((next: (Order | null)[]) => { ordersRef.current = next; setOrdersState(next); }, []);
  const [cursor, setCursor] = useState(0);
  const [seg, setSeg] = useState<Segment>('moves');
  const [mech, setMech] = useState<ActiveMechanic>(null);
  const [pending, setPending] = useState<PendingTarget | null>(null);
  const [sent, setSent] = useState(false);

  const slots = bsx.slots;
  const needIdx = useMemo(() => slots.filter((s) => s.needsOrder).map((s) => s.idx), [slots]);
  const reqKey = `${bsx.rqid ?? 'x'}:${bsx.requestType}:${bsx.turn}`;

  // A new request (or the same one handed back after a rejection) resets the
  // strip. `isWaiting` flipping back to true is the rejection case: PS resends
  // the request under the same rqid.
  const lastKey = useRef<string>('');
  useEffect(() => {
    if (!isWaiting) return;
    if (lastKey.current === reqKey && !sent) return;
    lastKey.current = reqKey;
    setOrders(slots.map((s) => (s.needsOrder ? null : { kind: 'pass' })));
    setCursor(needIdx[0] ?? 0);
    setMech(null);
    setPending(null);
    setSent(false);
    setSeg(bsx.requestType === 'switch' ? 'switch' : bsx.requestType === 'team' ? 'team' : 'moves');
    onTargeting(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqKey, isWaiting]);

  // A rejected choice shows up in the log; say so and let the reset above restore the dock.
  const seenLog = useRef(htmlLog.length);
  useEffect(() => {
    const fresh = htmlLog.slice(seenLog.current);
    seenLog.current = htmlLog.length;
    if (fresh.some((l) => /Invalid choice|Unavailable choice|Can't (?:move|switch)/i.test(l))) {
      toast({ tone: 'warn', msg: t('battle.dock.rejected') });
    }
  }, [htmlLog.length, htmlLog, t]);

  const slot: BSXSlot | undefined = slots.find((s) => s.idx === cursor) ?? slots[0];
  const activeMoves = slot?.moves ?? [];
  const mechUsedInBattle = hasMechanicBeenUsed(htmlLog);
  const mechTaken = orders.some((o) => o && o.kind === 'move' && !!o.mech);

  const finish = useCallback((next: (Order | null)[]) => {
    const complete = needIdx.every((i) => next[i] != null);
    if (!complete) {
      const nextCursor = needIdx.find((i) => next[i] == null);
      if (nextCursor != null) setCursor(nextCursor);
      setSeg(bsx.requestType === 'switch' ? 'switch' : 'moves');
      return;
    }
    const str = slots.length > 1 ? slots.map((s) => orderToChoice(next[s.idx])).join(', ') : orderToChoice(next[slots[0]?.idx ?? 0]);
    onChoice(str);
    setSent(true);
    setPending(null);
    onTargeting(null);
    onAim?.(false);
  }, [needIdx, slots, bsx.requestType, onChoice, onTargeting, onAim]);

  const assign = useCallback((idx: number, order: Order) => {
    const next = [...ordersRef.current];
    next[idx] = order;
    setOrders(next);
    finish(next);
  }, [finish, setOrders]);

  const targetOptions = useCallback((moveTarget: string | undefined, fromSlot: number): TargetOption[] => {
    const out: TargetOption[] = [];
    const foes = bsx.bsxFoes;
    const allies = bsx.bsxAllies;
    const wantsFoes = moveTarget === 'normal' || moveTarget === 'any' || moveTarget === 'adjacentFoe';
    const wantsAllies = moveTarget === 'normal' || moveTarget === 'any' || moveTarget === 'adjacentAlly' || moveTarget === 'adjacentAllyOrSelf';
    const wantsSelf = moveTarget === 'adjacentAllyOrSelf' || moveTarget === 'any';
    if (wantsFoes) foes.forEach((m, i) => { if (m && !m.fnt) out.push({ code: i + 1, side: 'foe', slot: i, mon: m, label: `${t('battle.dock.targetFoe', { n: i + 1 })}: ${m.name}` }); });
    if (wantsAllies) allies.forEach((m, i) => {
      if (!m || m.fnt) return;
      if (i === fromSlot && !wantsSelf) return;
      out.push({ code: -(i + 1), side: 'ally', slot: i, mon: m, label: `${i === fromSlot ? t('battle.dock.targetSelf') : t('battle.dock.targetAlly')}: ${m.name}` });
    });
    return out;
  }, [bsx.bsxFoes, bsx.bsxAllies, t]);

  const chooseMove = useCallback((i: number) => {
    if (!slot || sent) return;
    const move = activeMoves[i];
    if (!move || move.disabled || move.pp <= 0) return;
    const useMech = mech && !mechTaken ? mech : undefined;
    const base = { kind: 'move' as const, move: i + 1, name: move.name, type: move.type, spread: move.spread, mech: useMech };
    if (doubles && move.target && NEEDS_TARGET.has(move.target)) {
      const options = targetOptions(move.target, slot.idx);
      if (options.length > 1) {
        const p: PendingTarget = { slot: slot.idx, move: i + 1, name: move.name, type: move.type, options };
        setPending(p);
        setSeg('moves');
        onTargeting({
          options,
          onPick: (code) => {
            const opt = options.find((o) => o.code === code);
            setMech(null);
            assign(slot.idx, { ...base, target: code, targetName: opt?.mon?.name });
          },
          onCancel: () => { setPending(null); onTargeting(null); },
        });
        return;
      }
      if (options.length === 1) {
        setMech(null);
        assign(slot.idx, { ...base, target: options[0].code, targetName: options[0].mon?.name });
        return;
      }
    }
    setMech(null);
    assign(slot.idx, base);
  }, [slot, sent, activeMoves, mech, mechTaken, doubles, targetOptions, onTargeting, assign]);

  const reservedBench = useMemo(() => new Set(orders.flatMap((o) => (o && o.kind === 'switch' ? [o.bench] : []))), [orders]);

  const chooseSwitch = useCallback((n: number) => {
    if (!slot || sent) return;
    const mon = bsx.bsxBench[n - 1];
    if (!mon || mon.fnt || mon.active || reservedBench.has(n) || slot.trapped) return;
    setPending(null);
    onTargeting(null);
    assign(slot.idx, { kind: 'switch', bench: n, name: mon.name });
  }, [slot, sent, bsx.bsxBench, reservedBench, onTargeting, assign]);

  const clearSlot = useCallback((idx: number) => {
    if (sent) {
      if (onUndo && !bsx.noCancel) { onUndo(); setSent(false); }
      else return;
    }
    { const next = [...ordersRef.current]; next[idx] = null; setOrders(next); }
    setCursor(idx);
    setPending(null);
    onTargeting(null);
    setSeg(bsx.requestType === 'switch' ? 'switch' : 'moves');
  }, [sent, onUndo, bsx.noCancel, bsx.requestType, onTargeting]);

  const escape = useCallback(() => {
    if (pending) { setPending(null); onTargeting(null); return; }
    if (mech) { setMech(null); return; }
    const last = [...needIdx].reverse().find((i) => orders[i] != null);
    if (last != null && !sent) clearSlot(last);
  }, [pending, mech, needIdx, orders, sent, clearSlot, onTargeting]);

  const canAct = status === 'active' && isWaiting && !sent && !spectator;
  const inMoves = canAct && bsx.requestType === 'move' && activeMoves.length > 0;
  const benchAvailable = bsx.bsxBench.some((m) => !m.fnt && !m.active);
  const canSwitch = canAct && (bsx.requestType === 'switch' || (bsx.requestType === 'move' && !slot?.trapped)) && benchAvailable;

  const hotkeyMoves = useMemo(() => (inMoves ? activeMoves.map((m, i) => ({ onClick: () => chooseMove(i), disabled: !!m.disabled || m.pp <= 0 })) : []), [inMoves, activeMoves, chooseMove]);
  const hotkeySwitches = useMemo(() => (canSwitch ? bsx.bsxBench.map((m, i) => ({ onClick: () => chooseSwitch(i + 1), disabled: !!m.fnt || !!m.active || reservedBench.has(i + 1) })) : []), [canSwitch, bsx.bsxBench, chooseSwitch, reservedBench]);
  const hotkeyMechs = useMemo(() => {
    if (!inMoves || !slot || mechTaken) return [];
    const list: Array<{ key: string; toggle: () => void }> = [];
    const toggle = (m: ActiveMechanic) => () => setMech((cur) => (cur === m ? null : m));
    if (slot.canTera && !mechUsedInBattle) list.push({ key: 't', toggle: toggle('terastallize') });
    if (slot.canMega) list.push({ key: 'm', toggle: toggle('mega') });
    if (slot.canDyna) list.push({ key: 'd', toggle: toggle('dynamax') });
    if (slot.canZ) list.push({ key: 'z', toggle: toggle('zmove') });
    return list;
  }, [inMoves, slot, mechTaken, mechUsedInBattle]);

  useBattleHotkeys({
    moves: hotkeyMoves,
    switches: hotkeySwitches,
    switchKeyOffset: bsx.requestType === 'move' ? 4 : 0,
    mechanics: hotkeyMechs,
    onEscape: escape,
    // …and only in the room you are LOOKING at. Every open battle mounts a
    // dock, and these listeners are on `window`: without this, `1` submitted a
    // move in each of them at once.
    enabled: roomVisible && status === 'active' && isWaiting && !spectator,
  });

  // The grids follow the DOCK's width, not the viewport's.
  //
  // These were `min-[480px]:` / `min-[720px]:`, and a Tailwind arbitrary
  // variant compiles to a VIEWPORT media query — but the dock is never the
  // viewport in any host. It is a band inside the battle shell, which itself
  // sits in a launcher pane, or beside the web sidebar, or next to the log
  // rail. On an 1834px window the query answered "wide" and the band laid two
  // ~700px move keys across a space that comfortably fits four, doubling the
  // band's height to hold four moves that should occupy one row. That height
  // is now field the band no longer has to cover.
  const [dockNode, setDockNode] = useState<HTMLElement | null>(null);
  const dockW = useNodeSize(dockNode).width;

  if (status !== 'active') return null;

  const slotTag = (s: BSXSlot) => (slots.length > 1 ? String.fromCharCode(65 + s.idx) : t('battle.you'));
  const segments: Array<{ id: Segment; label: string; enabled: boolean }> = [
    { id: 'moves', label: t('battle.dock.moves'), enabled: inMoves },
    { id: 'switch', label: t('battle.dock.switch'), enabled: canSwitch },
    { id: 'team', label: t('battle.dock.team'), enabled: canAct && bsx.requestType === 'team' },
  ];
  const showSeg = segments.find((s) => s.id === seg && s.enabled) ? seg : (segments.find((s) => s.enabled)?.id ?? seg);
  // Four across from 840px, because that is where a move key still clears the
  // ~205px it needs for a truncating name over one unwrapped badge row — and
  // because a SECOND row of keys costs 52px out of a band capped at a quarter
  // of the field, which on a 1280x800 window was the difference between the
  // whole dock fitting and the tera button falling below a scroll.
  const moveCols = mobile ? 'grid-cols-1'
    : dockW >= 840 ? 'grid-cols-4' : dockW >= 620 ? 'grid-cols-3' : dockW >= 420 ? 'grid-cols-2' : 'grid-cols-1';
  // A bench card carries a sprite, a name, an HP bar, a readout and a type row
  // — it needs ~200px, not the ~150 a move key gets away with. Six across a
  // 1178px band left each one 186px, and the bar came out a stub.
  const benchCols = mobile ? 'grid-cols-2'
    : dockW >= 1250 ? 'grid-cols-6' : dockW >= 1050 ? 'grid-cols-5' : dockW >= 840 ? 'grid-cols-4' : dockW >= 620 ? 'grid-cols-3' : 'grid-cols-2';
  // The legend is ~300px of hints, and it was gated on `md:` — the viewport
  // again, not the band. It is the first thing to drop when the header row
  // would otherwise wrap, and the keys it describes work either way.
  const showLegend = !mobile && dockW >= 1300;

  const waitLabel = sent ? `${t('battle.dock.sent')} ${t('battle.dock.waiting')}` : t('battle.dock.waiting');
  const undoBtn = sent && onUndo && !bsx.noCancel
    ? <Button variant="ghost" size="sm" icon="back" title={t('battle.dock.undoHint')} onClick={() => { onUndo(); setSent(false); }}>{t('battle.dock.undo')}</Button>
    : null;

  // OFF-TURN: a one-line strip, not the full dock.
  //
  // The dock floats OVER the field on every pointer layout now, so its height
  // is field you cannot see. Between turns there is nothing here to act on —
  // the segment tabs are all disabled, the hotkey legend describes keys that
  // do nothing, and the move grid is gone anyway — so rendering the full
  // chrome would cover a quarter of the board to say "waiting". What is worth
  // the strip is what you chose and the means to take it back.
  if (!canAct) {
    return (
      <section ref={setDockNode} aria-label={t('battle.dock.aria')} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
        {slots.filter((s) => s.needsOrder && orders[s.idx]).map((s) => (
          <BxPlan key={s.idx} tag={slotTag(s)} action={orderToPlan(orders[s.idx] ?? null, t)}
            onClear={sent && onUndo && !bsx.noCancel ? () => clearSlot(s.idx) : undefined} />
        ))}
        <span role="status" className="inline-flex items-center gap-2 font-mono text-[0.65625rem] uppercase tracking-[0.08em] text-txt-dim">
          <i aria-hidden className="h-2 w-2 bg-warn [clip-path:circle(50%)] animate-[bm-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none" />
          {spectator ? t('battle.dock.spectating') : waitLabel}
        </span>
        {undoBtn}
        {timer != null && <span className="ml-auto"><BxRing sec={timer} max={timerMax} size={28} /></span>}
      </section>
    );
  }

  return (
    <section ref={setDockNode} aria-label={t('battle.dock.aria')}
      // The bench and the team list are two rows of six cards, not one row of
      // four keys, and they do not fit the quarter of the field the band
      // normally allows. They are also a place you went ON PURPOSE and leave
      // again — unlike the move row, which is simply where every turn happens
      // — so the band is allowed to grow for them. `BattleShell` reads this.
      data-bx-tall={showSeg === 'switch' || showSeg === 'team' ? '' : undefined}
      // Tighter vertically than horizontally: every pixel of height here is a
      // pixel of field the band covers, and the band was overrunning its cap by
      // a hair on a 1280x800 window. Side padding is free by comparison.
      className="flex flex-col gap-2 px-2 py-[0.375rem] sm:gap-2 sm:px-3 sm:py-2">
      {/* ONE header row: segments · orders · mechanics · legend · timer.
          These were three stacked rows, which cost ~90px of a band that is
          capped at a quarter of the field — enough that the move keys' own
          bottom edge and the tera button fell below the fold and had to be
          scrolled to. In a band this wide they all fit side by side with room
          to spare, and the height they were spending is field again. */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={t('battle.dock.aria')} className="cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)] inline-flex border border-solid border-line-2 bg-base">
          {segments.map((s) => {
            const on = showSeg === s.id;
            return (
              <button key={s.id} type="button" role="tab" aria-selected={on} disabled={!s.enabled} onClick={() => setSeg(s.id)}
                className={cn(BSIM_FOCUS, 'h-8 px-3 font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.08em] transition-colors duration-[140ms] focus-visible:outline-offset-[-3px] disabled:cursor-not-allowed disabled:opacity-40',
                  on ? 'bg-accent text-accent-ink' : 'text-txt-muted hover:text-txt')}>
                {s.label}
              </button>
            );
          })}
        </div>
        {slots.map((s) => (
          <BxPlan key={s.idx} tag={slotTag(s)} action={orderToPlan(orders[s.idx] ?? null, t)} active={s.idx === cursor && s.needsOrder}
            hint={s.needsOrder ? (s.mon ? t('battle.dock.orderFor', { name: s.mon.name }) : undefined) : t('battle.dock.pass')}
            onClear={s.needsOrder && orders[s.idx] ? () => clearSlot(s.idx) : undefined}
            onSelect={s.needsOrder ? () => { setCursor(s.idx); setPending(null); onTargeting(null); } : undefined}
            selectLabel={s.mon ? t('battle.dock.orderFor', { name: s.mon.name }) : undefined} />
        ))}

        {showSeg === 'moves' && slot && (slot.canTera || slot.canMega || slot.canDyna || slot.canZ) && (
          <span className="inline-flex flex-wrap items-center gap-2">
            {slot.canTera && slot.teraType && <BxTeraBtn type={slot.teraType} armed={mech === 'terastallize'} used={mechUsedInBattle || mechTaken} onToggle={() => setMech((c) => (c === 'terastallize' ? null : 'terastallize'))} hotkey="T" />}
            {(['mega', 'dynamax', 'zmove'] as const).map((m) => {
              const can = m === 'mega' ? slot.canMega : m === 'dynamax' ? slot.canDyna : slot.canZ;
              if (!can) return null;
              const meta = MECH_META[m];
              return <BxMechBtn key={m} glyph={meta.glyph} tone={meta.tone} hotkey={meta.hotkey} label={t(`battle.dock.mech.${m}`)} hint={t(`battle.dock.mech.${m}Hint`)} armed={mech === m} used={mechTaken} onToggle={() => setMech((c) => (c === m ? null : m))} />;
            })}
          </span>
        )}

        {timer != null && <BxRing sec={timer} max={timerMax} size={32} />}
        {showLegend && (
          <span className="ml-auto flex flex-wrap items-center gap-3">
            <BxKbdHint k="1–4" label={t('battle.dock.legend.moves')} />
            <BxKbdHint k="5–9" label={t('battle.dock.legend.bench')} />
            {slot?.canTera && <BxKbdHint k="T" label={t('battle.dock.legend.tera')} />}
            {slot?.canMega && <BxKbdHint k="M" label={t('battle.dock.legend.mega')} />}
            {slot?.canDyna && <BxKbdHint k="D" label={t('battle.dock.legend.dyna')} />}
            {slot?.canZ && <BxKbdHint k="Z" label={t('battle.dock.legend.z')} />}
            <BxKbdHint k="Esc" label={t('battle.dock.legend.esc')} />
          </span>
        )}
      </div>

      {/* The order chips moved into the header row above; "waiting", "sent",
          "spectating" and undo live in the off-turn strip, and by definition
          none of those can be true here. */}

      {/* Target mode. One row, and it REPLACES the move grid below rather than
          stacking on it: once a move is picked the keys are no longer
          actionable, and the two together were 300px of content in a band that
          allows 166 — the picker's own buttons scrolled out of reach, which is
          the one thing this band must never do. The hint is the row's title
          rather than a line of its own for the same reason. */}
      {pending && (
        <div role="status" title={t('battle.dock.chooseTargetHint')} className="flex flex-wrap items-center gap-2 border border-solid border-warn bg-warn-soft px-2 py-[0.375rem]">
          <b className="font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.04em] text-txt">{t('battle.dock.chooseTarget')}</b>
          <span className="font-mono text-[0.625rem] text-txt-muted">{pending.name}</span>
          <span className="flex flex-wrap gap-1">
            {pending.options.map((o) => (
              <Button key={o.code} size="sm" variant={o.side === 'foe' ? 'danger' : 'default'} onClick={() => pending && (onTargetingPick(o.code))}>{o.label}</Button>
            ))}
          </span>
          <Button size="sm" variant="ghost" onClick={escape}>{t('battle.dock.legend.esc')}</Button>
          <span className="sr-only">{t('battle.dock.chooseTargetHint')}</span>
        </div>
      )}

      {mech && !pending && (
        <span className="cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:4px] inline-flex w-fit items-center gap-2 border border-solid border-accent-line bg-accent-soft px-[0.625rem] py-[0.375rem] font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.06em] text-accent-bright">
          {t('battle.dock.mech.armed', { name: t(`battle.dock.mech.${mech}`) })}
        </span>
      )}

      {/* Body */}
      {canAct && showSeg === 'moves' && slot && !pending && (
        <div className="flex flex-col gap-2">
          {slot.trapped && <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-warn">{t('battle.dock.trapped')}</span>}
          {/* No `selected` state on the keys: the target picker REPLACES this
              grid, so a move that is mid-targeting is never on screen beside
              it to be marked. */}
          <div className={cn('grid gap-2', moveCols)}>
            {activeMoves.map((move: BSXKeyMove, i) => (
              <BxKey key={(move.id ?? move.name) + i} move={move} hotkey={i + 1} tera={mech === 'terastallize'} target={bsx.bsxFoe}
                onClick={() => chooseMove(i)}
                onHover={onAim && move.cat !== 'status' ? () => onAim(true) : undefined}
                onLeave={onAim ? () => onAim(false) : undefined} />
            ))}
          </div>
        </div>
      )}

      {canAct && showSeg === 'switch' && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
            {bsx.requestType === 'switch' ? (slot?.mon ? t('battle.dock.forcedSwitchFor', { name: slot.mon.name }) : t('battle.dock.forcedSwitch')) : t('battle.dock.switch')}
          </span>
          {!benchAvailable && <p className="m-0 font-body text-[0.75rem] text-txt-dim">{t('battle.dock.noBench')}</p>}
          <div className={cn('grid gap-2', benchCols)}>
            {bsx.bsxBench.map((mon, i) => {
              const n = i + 1;
              const key = bsx.requestType === 'move' ? n + 4 : n;
              const reserved = reservedBench.has(n);
              const reason = mon.active ? t('battle.dock.inBattle') : reserved ? t('battle.dock.reserved') : undefined;
              return <BxBench key={mon.id + i} mon={mon} hotkey={key === 10 ? '0' : key} disabled={!!mon.active || reserved || !!slot?.trapped} reserved={reserved} reason={reason} onClick={() => chooseSwitch(n)} />;
            })}
          </div>
        </div>
      )}

      {canAct && showSeg === 'team' && (
        <p className="m-0 font-body text-[0.78125rem] text-txt-muted">{t('battle.preview.leadSingles')}</p>
      )}
    </section>
  );

  function onTargetingPick(code: number) {
    if (!pending) return;
    const opt = pending.options.find((o) => o.code === code);
    const move = activeMoves[pending.move - 1];
    const useMech = mech && !mechTaken ? mech : undefined;
    setMech(null);
    assign(pending.slot, { kind: 'move', move: pending.move, name: pending.name, type: pending.type, spread: move?.spread, target: code, targetName: opt?.mon?.name, mech: useMech });
  }
}
