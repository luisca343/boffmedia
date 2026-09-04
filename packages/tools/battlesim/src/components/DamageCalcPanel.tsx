"use client";

/**
 * The damage calculator, inside the battle it is about.
 *
 * Players were alt-tabbing to the standalone calculator mid-turn and typing out
 * a board that was already on screen. This panel is fed by `snapshotBattle`, so
 * the attacker, the defender, their items, abilities, statuses, boosts, tera
 * types, the weather, the terrain and the screens are already filled in when it
 * opens — and your own EV/IV/nature spread is the REAL one, recovered from the
 * final stats the choice request publishes.
 *
 * IT NEVER WRITES TO THE BATTLE. Not to `BattleSession`, not to the
 * `TurnLedger`, not to the request, not to the scene. Every value it holds is a
 * copy: `snapshotBattle` deep-freezes what it hands over, and an override is
 * stored in this component's own `edits` record and merged on read. There is no
 * path from a keystroke here back to the engine, and there must never be one —
 * an in-battle tool that could nudge the simulation would be a cheat, not a
 * calculator.
 *
 * The edits model is worth stating because it is what makes "pre-filled but
 * editable" work over a live battle: an override PINS one field and nothing
 * else. Everything the player has not touched keeps tracking the battle turn by
 * turn, so opening the panel on turn 3 and changing the foe's item still shows
 * that foe's real HP on turn 7.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, Icon, IconButton, Input, Select, cn } from "@boffmedia/ui";
import {
  NATURES,
  type CalcField,
  type CalcMove,
  type CalcPokemon,
  type BoostKey,
  type MoveSlots,
  type StatKey,
  type Terrain,
  type Weather,
} from "@boffmedia/tools-pokemon";
import { useToolT, BATTLESIM_NS } from "../i18n";
import { usePkmnLabels } from "../lib/pkmn-label";
import { BSIM_FOCUS } from "./bsim-kit";
import { BxType, useBxLabels } from "./bx-kit";
import { fieldFor, type BattleCalcSnapshot, type CalcMonSnapshot } from "../calc/fromBattle";
import { damageRange, koVerdictKey, type DamageRange } from "../calc/damageRange";

export interface DamageCalcPanelProps {
  snapshot: BattleCalcSnapshot;
  onClose: () => void;
}

/** Weather/terrain values <-> the `field.cond.*` labels the chips already use. */
const WEATHER_KEYS: Array<[Weather, string]> = [
  ["Sun", "sunnyday"], ["Rain", "raindance"], ["Sand", "sandstorm"], ["Snow", "snow"],
  ["Harsh Sunshine", "desolateland"], ["Heavy Rain", "primordialsea"], ["Strong Winds", "deltastream"],
];
const TERRAIN_KEYS: Array<[Terrain, string]> = [
  ["Electric", "electricterrain"], ["Grassy", "grassyterrain"],
  ["Misty", "mistyterrain"], ["Psychic", "psychicterrain"],
];
const STATUS_IDS = ["brn", "par", "psn", "tox", "slp", "frz"];
const BOOST_STATS: BoostKey[] = ["atk", "def", "spa", "spd", "spe"];
const ALL_STATS: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy", "Stellar",
];

/* ── Small local chrome ──────────────────────────────────────────────────── */

const LABEL = "font-mono text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2">
      <span className={cn(LABEL, "w-[5.5rem] flex-none")}>{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

/** A −6…+6 stat stage. Not a `Slider`: thirteen discrete steps read better as a number. */
function BoostStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(-6, Math.min(6, v));
  return (
    <span className="flex items-center gap-1">
      <span className={cn(LABEL, "w-[2.25rem] flex-none")}>{label}</span>
      <button type="button" className={cn(BSIM_FOCUS, "h-6 w-5 flex-none border border-solid border-line-2 bg-base text-txt-muted hover:text-txt")}
        aria-label={`${label} −1`} onClick={() => onChange(clamp(value - 1))}>−</button>
      <b className={cn("w-7 text-center font-mono text-[0.6875rem] font-bold leading-none",
        value > 0 ? "text-ok" : value < 0 ? "text-bad" : "text-txt-muted")}>
        {value > 0 ? `+${value}` : value}
      </b>
      <button type="button" className={cn(BSIM_FOCUS, "h-6 w-5 flex-none border border-solid border-line-2 bg-base text-txt-muted hover:text-txt")}
        aria-label={`${label} +1`} onClick={() => onChange(clamp(value + 1))}>+</button>
    </span>
  );
}

/* ── The panel ───────────────────────────────────────────────────────────── */

export function DamageCalcPanel({ snapshot, onClose }: DamageCalcPanelProps) {
  const t = useToolT(BATTLESIM_NS);
  const labels = usePkmnLabels();
  const bx = useBxLabels();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [attackerKey, setAttackerKey] = useState<string | null>(snapshot.defaultAttacker);
  const [defenderKey, setDefenderKey] = useState<string | null>(snapshot.defaultDefender);
  /** Per-Pokémon overrides. Absent field = still tracking the live battle. */
  const [edits, setEdits] = useState<Record<string, Partial<CalcPokemon>>>({});
  const [fieldEdits, setFieldEdits] = useState<Partial<CalcField>>({});
  const [detailsFor, setDetailsFor] = useState<"attacker" | "defender" | "field" | null>(null);

  // The panel is opened deliberately, so it takes focus — and gives it back on
  // Escape (handled below) rather than stranding the player inside a dialog
  // whose only exit is the mouse.
  useEffect(() => { rootRef.current?.focus(); }, []);

  const byKey = useMemo(() => new Map(snapshot.mons.map((m) => [m.key, m])), [snapshot.mons]);
  // A Pokémon that faints or switches out leaves the snapshot; falling back to
  // the current default beats rendering an empty panel over a live board.
  const attacker = (attackerKey && byKey.get(attackerKey)) || (snapshot.defaultAttacker ? byKey.get(snapshot.defaultAttacker) : undefined) || null;
  const defender = (defenderKey && byKey.get(defenderKey)) || (snapshot.defaultDefender ? byKey.get(snapshot.defaultDefender) : undefined) || null;

  const effective = useCallback(
    (mon: CalcMonSnapshot | null): CalcPokemon | null => (mon ? { ...mon.poke, ...edits[mon.key] } : null),
    [edits],
  );
  const attackerPoke = effective(attacker);
  const defenderPoke = effective(defender);

  const patch = useCallback((mon: CalcMonSnapshot, part: Partial<CalcPokemon>) => {
    setEdits((prev) => ({ ...prev, [mon.key]: { ...prev[mon.key], ...part } }));
  }, []);

  const dirty = Object.keys(edits).length > 0 || Object.keys(fieldEdits).length > 0;
  const reset = useCallback(() => { setEdits({}); setFieldEdits({}); }, []);

  const field = useMemo(
    () => (attacker ? fieldFor(snapshot, attacker.side, fieldEdits) : snapshot.field),
    [snapshot, attacker, fieldEdits],
  );

  const rows = useMemo(() => {
    if (!attacker || !defender || !attackerPoke || !defenderPoke) return [];
    return attackerPoke.moves.map((move, index) => ({
      index,
      move,
      range: move.name
        ? damageRange({ attacker, defender, attackerPoke, defenderPoke, move, field })
        : null,
    }));
  }, [attacker, defender, attackerPoke, defenderPoke, field]);

  /**
   * The battle's own hotkeys listen on `window`, and they only bail out on an
   * `<input>` — so a `1` typed while a `<select>` here has focus would have
   * fired move slot one at the opponent. Stopping the event at this root keeps
   * every key pressed inside the panel inside the panel.
   */
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
  }, [onClose]);

  const monOptions = useCallback((side: "ally" | "foe") =>
    snapshot.mons
      .filter((m) => m.side === side && !m.fainted)
      .map((m) => ({ value: m.key, label: `${m.label}${m.active ? "" : " · " + t("calc.bench")}` })),
    [snapshot.mons, t]);

  const setMove = (index: number, part: Partial<CalcMove>) => {
    if (!attacker || !attackerPoke) return;
    const moves = attackerPoke.moves.map((m, i) => (i === index ? { ...m, ...part } : m)) as MoveSlots;
    patch(attacker, { moves });
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={t("calc.aria")}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        BSIM_FOCUS,
        // An overlay drawer, not a third column. The field is 16:9 and the
        // shell sizes it off the body, so a panel that took width would resize
        // the board mid-turn; and in fullscreen the log rail is hidden, which a
        // panel docked next to the rail would disappear with. Floating over the
        // right edge coexists with the log toggle instead of competing for the
        // same slot.
        "absolute inset-y-0 right-0 z-[25] flex w-[min(26rem,100%)] flex-col border-l border-solid border-line bg-panel",
        "animate-[bm-drawer-in_200ms_ease_both] motion-reduce:animate-none",
      )}
    >
      <header className="flex flex-none items-center gap-2 border-b border-solid border-line px-3 py-2">
        <Icon name="calc" size={14} />
        <b className="font-display text-[0.8125rem] font-extrabold uppercase leading-none tracking-[0.04em] text-txt">{t("calc.title")}</b>
        <span className={cn(LABEL, "ml-1")}>{t("calc.turn", { turn: snapshot.turn })}</span>
        <span className="flex-1" />
        {dirty && <Button variant="ghost" size="sm" onClick={reset}>{t("calc.reset")}</Button>}
        <IconButton name="x" label={t("calc.close")} variant="ghost" size="sm" onClick={onClose} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {/* Read-only promise, stated where the player can see it: everything in
            here is a scratchpad over a copy of the board. */}
        <p className="mb-3 border border-dashed border-line-2 px-2 py-[0.375rem] font-mono text-[0.5625rem] uppercase leading-[1.5] tracking-[0.06em] text-txt-dim">
          {t("calc.readOnly")}
        </p>

        {!attacker || !defender ? (
          <p className="py-8 text-center text-[0.75rem] text-txt-muted">{t("calc.empty")}</p>
        ) : (
          <>
            <div className="mb-3 grid gap-2">
              <Row label={t("calc.attacker")}>
                <Select size="sm" value={attacker.key} options={monOptions(attacker.side)} onChange={setAttackerKey} ariaLabel={t("calc.attacker")} />
              </Row>
              <Row label={t("calc.defender")}>
                <Select size="sm" value={defender.key} options={monOptions(defender.side)} onChange={setDefenderKey} ariaLabel={t("calc.defender")} />
              </Row>
              <div className="flex items-center gap-2">
                <span className={cn(LABEL, "w-[5.5rem] flex-none")} />
                <Button variant="ghost" size="sm" onClick={() => {
                  // Swapping direction also swaps which side's screens count as
                  // the defender's — `fieldFor` re-derives that from the new
                  // attacker, so nothing here has to remember it.
                  setAttackerKey(defender.key);
                  setDefenderKey(attacker.key);
                }}>{t("calc.swap")}</Button>
              </div>
            </div>

            {(!attacker.spreadKnown || !defender.spreadKnown) && (
              <p className="mb-3 border-l-2 border-solid border-warn bg-warn-soft px-2 py-[0.375rem] text-[0.6875rem] leading-[1.45] text-txt-muted">
                <b className="text-warn">{t("calc.unknown.title")}</b>{" · "}{t("calc.unknown.body")}
              </p>
            )}

            <ul className="mb-3 grid gap-[0.375rem]">
              {rows.map(({ index, move, range }) => (
                <li key={index}>
                  <MoveRow
                    move={move}
                    range={range}
                    label={move.name ? labels.move(move.name) : t("calc.noMove")}
                    t={t}
                    onChange={(part) => setMove(index, part)}
                  />
                </li>
              ))}
            </ul>

            {defender.moves.length === 0 && defender.side === "foe" && (
              <p className="mb-3 text-[0.6875rem] leading-[1.4] text-txt-dim">{t("calc.hint.foeMoves")}</p>
            )}

            <nav className="mb-2 flex gap-1" aria-label={t("calc.details")}>
              {(["attacker", "defender", "field"] as const).map((tab) => (
                <button key={tab} type="button" aria-pressed={detailsFor === tab}
                  onClick={() => setDetailsFor((cur) => (cur === tab ? null : tab))}
                  className={cn(BSIM_FOCUS, "flex-1 border border-solid px-2 py-[0.375rem] font-mono text-[0.5625rem] font-bold uppercase leading-none tracking-[0.08em] transition-colors duration-[140ms]",
                    detailsFor === tab ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line-2 bg-base text-txt-dim hover:text-txt")}>
                  {t(`calc.${tab}`)}
                </button>
              ))}
            </nav>

            {detailsFor === "attacker" && <SetEditor mon={attacker} poke={attackerPoke!} onPatch={(p) => patch(attacker, p)} t={t} bx={bx} labels={labels} />}
            {detailsFor === "defender" && <SetEditor mon={defender} poke={defenderPoke!} onPatch={(p) => patch(defender, p)} t={t} bx={bx} labels={labels} />}
            {detailsFor === "field" && <FieldEditor field={field} onPatch={(p) => setFieldEdits((prev) => ({ ...prev, ...p }))} t={t} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Move row ────────────────────────────────────────────────────────────── */

type T = (key: string, values?: Record<string, string | number | Date>) => string;

function MoveRow({ move, range, label, t, onChange }: {
  move: CalcMove;
  range: DamageRange | null;
  label: string;
  t: T;
  onChange: (part: Partial<CalcMove>) => void;
}) {
  const ko = range ? koVerdictKey(range) : null;
  return (
    <div className="border border-solid border-line-2 bg-base px-2 py-[0.375rem]">
      <div className="flex min-w-0 items-center gap-2">
        <b className="min-w-0 flex-1 truncate font-display text-[0.75rem] font-bold leading-none text-txt">{label}</b>
        {move.name && <BxType type={move.type} small />}
        <Input
          size="sm" type="number" min={0} max={300} value={move.bp}
          aria-label={t("calc.power")}
          className="w-[3.75rem] flex-none"
          onChange={(e) => onChange({ bp: Number(e.currentTarget.value) || 0 })}
        />
        <button type="button" aria-pressed={move.crit} onClick={() => onChange({ crit: !move.crit })}
          className={cn(BSIM_FOCUS, "h-8 flex-none border border-solid px-2 font-mono text-[0.5625rem] font-bold uppercase leading-none tracking-[0.06em]",
            move.crit ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line-2 bg-base text-txt-dim")}>
          {t("calc.crit")}
        </button>
      </div>
      <div className="mt-[0.375rem] flex items-baseline gap-2">
        {!move.name ? (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{t("calc.noMove")}</span>
        ) : !range ? (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">
            {move.category === "Status" ? t("calc.statusMove") : t("calc.variablePower")}
          </span>
        ) : (
          <>
            <b className="font-display text-[0.9375rem] font-extrabold leading-none text-txt">
              {range.minPct.toFixed(1)}–{range.maxPct.toFixed(1)}%
            </b>
            <span className="font-mono text-[0.625rem] leading-none text-txt-dim">{range.minDamage}–{range.maxDamage}</span>
            <span className="flex-1" />
            {ko && <span className={cn("font-mono text-[0.625rem] font-bold uppercase leading-none tracking-[0.08em]",
              range.hitsMin === 1 ? "text-bad" : "text-txt-muted")}>{t(ko.key, ko.values)}</span>}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Set editor ──────────────────────────────────────────────────────────── */

function SetEditor({ mon, poke, onPatch, t, bx, labels }: {
  mon: CalcMonSnapshot;
  poke: CalcPokemon;
  onPatch: (part: Partial<CalcPokemon>) => void;
  t: T;
  bx: ReturnType<typeof useBxLabels>;
  labels: ReturnType<typeof usePkmnLabels>;
}) {
  return (
    <div className="grid gap-2 border border-solid border-line bg-panel-2 px-2 py-2">
      <div className="flex items-center gap-2">
        <b className="font-display text-[0.75rem] font-bold uppercase leading-none text-txt">{poke.name}</b>
        <span className={cn("border border-solid px-[0.3125rem] py-[3px] font-mono text-[0.5rem] font-bold uppercase leading-none tracking-[0.08em]",
          mon.spreadKnown ? "border-ok-line bg-ok-soft text-ok" : "border-line-2 bg-base text-txt-dim")}>
          {t(mon.spreadKnown ? "calc.spread.known" : "calc.spread.unknown")}
        </span>
      </div>

      <Row label={t("calc.level")}>
        <Input size="sm" type="number" min={1} max={100} value={poke.level} aria-label={t("calc.level")}
          onChange={(e) => onPatch({ level: Math.max(1, Math.min(100, Number(e.currentTarget.value) || 1)) })} />
      </Row>
      <Row label={t("calc.item")}>
        <Input size="sm" value={poke.item === "None" ? "" : poke.item} placeholder={labels.item(poke.item)} aria-label={t("calc.item")}
          onChange={(e) => onPatch({ item: e.currentTarget.value || "None" })} />
      </Row>
      <Row label={t("calc.ability")}>
        <Input size="sm" value={poke.ability} aria-label={t("calc.ability")}
          onChange={(e) => onPatch({ ability: e.currentTarget.value })} />
      </Row>
      <Row label={t("calc.status")}>
        <Select size="sm" value={poke.status} ariaLabel={t("calc.status")}
          options={[{ value: "Healthy", label: t("calc.none") }, ...STATUS_IDS.map((id) => ({ value: id, label: bx.statusLong(id) }))]}
          onChange={(value) => onPatch({ status: value })} />
      </Row>
      <Row label={t("calc.tera")}>
        <Select size="sm" value={poke.teraType} ariaLabel={t("calc.tera")}
          options={[{ value: "None", label: t("calc.none") }, ...TYPES.map((type) => ({ value: type, label: bx.type(type) }))]}
          onChange={(value) => onPatch({ teraType: value })} />
      </Row>
      <Row label={t("calc.nature")}>
        <Select size="sm" value={poke.nature} ariaLabel={t("calc.nature")}
          options={NATURES.map((n) => ({ value: n.name, label: n.name }))}
          onChange={(value) => onPatch({ nature: value })} />
      </Row>

      <div>
        <span className={LABEL}>{t("calc.boosts")}</span>
        <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
          {BOOST_STATS.map((stat) => (
            <BoostStepper key={stat} label={bx.boost(stat)} value={poke.boosts[stat]}
              onChange={(value) => onPatch({ boosts: { ...poke.boosts, [stat]: value } })} />
          ))}
        </div>
      </div>

      {/* EVs and IVs, six each. Pre-filled with the SOLVED spread for your own
          side — not with 0/31 defaults — so an edit here starts from the set
          you actually brought. */}
      {(["evs", "ivs"] as const).map((kind) => (
        <div key={kind}>
          <span className={LABEL}>{t(`calc.${kind}`)}</span>
          <div className="mt-1 grid grid-cols-3 gap-1">
            {ALL_STATS.map((stat) => (
              <label key={stat} className="flex items-center gap-1">
                <span className={cn(LABEL, "w-[1.75rem] flex-none")}>{bx.boost(stat) || bx.stat(stat)}</span>
                <Input size="sm" type="number" min={0} max={kind === "evs" ? 252 : 31} value={poke[kind][stat]}
                  aria-label={`${t(`calc.${kind}`)} ${bx.stat(stat)}`}
                  onChange={(e) => onPatch({ [kind]: { ...poke[kind], [stat]: Math.max(0, Math.min(kind === "evs" ? 252 : 31, Number(e.currentTarget.value) || 0)) } } as Partial<CalcPokemon>)} />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Field editor ────────────────────────────────────────────────────────── */

function FieldEditor({ field, onPatch, t }: { field: CalcField; onPatch: (part: Partial<CalcField>) => void; t: T }) {
  const toggle = (label: string, on: boolean, onChange: (v: boolean) => void) => (
    <button key={label} type="button" aria-pressed={on} onClick={() => onChange(!on)}
      className={cn(BSIM_FOCUS, "border border-solid px-2 py-[0.375rem] font-mono text-[0.5625rem] font-bold uppercase leading-none tracking-[0.06em]",
        on ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line-2 bg-base text-txt-dim")}>
      {label}
    </button>
  );
  return (
    <div className="grid gap-2 border border-solid border-line bg-panel-2 px-2 py-2">
      <Row label={t("calc.weather")}>
        <Select size="sm" value={field.weather} ariaLabel={t("calc.weather")}
          options={[{ value: "None", label: t("calc.none") }, ...WEATHER_KEYS.map(([value, key]) => ({ value, label: t(`field.cond.${key}`) }))]}
          onChange={(value) => onPatch({ weather: value as Weather })} />
      </Row>
      <Row label={t("calc.terrain")}>
        <Select size="sm" value={field.terrain} ariaLabel={t("calc.terrain")}
          options={[{ value: "None", label: t("calc.none") }, ...TERRAIN_KEYS.map(([value, key]) => ({ value, label: t(`field.cond.${key}`) }))]}
          onChange={(value) => onPatch({ terrain: value as Terrain })} />
      </Row>
      <div className="flex flex-wrap gap-1">
        {toggle(t("field.cond.trickroom"), field.trickRoom, (v) => onPatch({ trickRoom: v }))}
        {toggle(t("field.cond.gravity"), field.gravity, (v) => onPatch({ gravity: v }))}
      </div>
      <span className={LABEL}>{t("calc.defenderSide")}</span>
      <div className="flex flex-wrap gap-1">
        {toggle(t("battle.side.reflect"), field.defenderSide.reflect, (v) => onPatch({ defenderSide: { ...field.defenderSide, reflect: v } }))}
        {toggle(t("battle.side.lightscreen"), field.defenderSide.lightScreen, (v) => onPatch({ defenderSide: { ...field.defenderSide, lightScreen: v } }))}
        {toggle(t("battle.side.auroraveil"), field.defenderSide.auroraVeil, (v) => onPatch({ defenderSide: { ...field.defenderSide, auroraVeil: v } }))}
      </div>
      <span className={LABEL}>{t("calc.attackerSide")}</span>
      <div className="flex flex-wrap gap-1">
        {toggle(t("calc.helpingHand"), field.attackerSide.helpingHand, (v) => onPatch({ attackerSide: { ...field.attackerSide, helpingHand: v } }))}
      </div>
    </div>
  );
}
