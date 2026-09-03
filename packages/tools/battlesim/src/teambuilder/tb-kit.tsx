"use client";

/**
 * Teambuilder kit — the presentational pieces the builder screens share.
 *
 * Built on the same vocabulary as `bx-kit` (cut geometry, token colours, the
 * three faces) and on the same helpers (`tyColor`, `spriteUrl`), but kept
 * apart from it: the HUD kit's `BxSlot` is one `<button>`, and a builder slot
 * needs its own actions BESIDE the selectable area — a button inside a button
 * is invalid HTML and unreachable by keyboard. `TbSlotRow` is that variant.
 */

import * as React from "react";
import { Dex } from "@pkmn/dex";
import { Icons } from "@pkmn/img";
import { calcStat } from "@boffmedia/battle-core";
import { cn, Icon, Input, type InputProps } from "@boffmedia/ui";
import { DkSprite } from "@boffmedia/ui/datakit";
import { spriteUrl, handleSpriteError } from "@boffmedia/tools-pokemon";

import { BSIM_FOCUS, BSIM_FOCUS_CUT, BsimChip, BsimKicker, type BsimChipTone } from "../components/bsim-kit";
import { BxTypeRow, BxType, BxCat } from "../components/bx-kit";
import { tyColor } from "../lib/bx-helpers";
import type { TbSyncState } from "./useTeamDraft";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

export const speciesSprite = (name: string) => spriteUrl(name);

/**
 * The item icon out of Showdown's sprite sheet, as inline style. `null` when
 * the dex does not know the item, so the caller falls back to text.
 */
export function itemIconStyle(name: string | undefined): React.CSSProperties | null {
  if (!name) return null;
  const item = Dex.items.get(name);
  if (!item.exists) return null;
  try {
    const icon = Icons.getItem(item.name);
    return icon?.css ? (icon.css as React.CSSProperties) : null;
  } catch {
    return null;
  }
}

/**
 * The "pop" a chip does when its value lands: scale 0.96 → 1 over 140 ms.
 * A transition rather than a keyframe so it needs nothing from the host's CSS;
 * `motion-reduce:transition-none` turns it into a plain swap.
 */
export function usePop(dep: unknown): string {
  const [popping, setPopping] = React.useState(false);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (dep == null || dep === "") return;
    setPopping(true);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPopping(false)));
    return () => cancelAnimationFrame(raf);
  }, [dep]);
  return cn("transition-transform duration-[140ms] motion-reduce:transition-none", popping ? "scale-[0.96]" : "scale-100");
}

/* ── Labels ──────────────────────────────────────────────────────────────── */

/**
 * Mono kicker: the small uppercase label above a control or a column.
 *
 * An alias rather than a second definition — it drifted to 0.12em tracking
 * while the hub's label sat at 0.14em and the section kicker at 0.1em, and the
 * three met on the team editor. The builder keeps the name; the recipe is the
 * tool's one kicker.
 */
export const TbKicker = BsimKicker;

/* ── Validity chip ───────────────────────────────────────────────────────── */

export type TbValidity = "ok" | "bad" | "neutral" | "checking";

const VALIDITY_TONE: Record<TbValidity, BsimChipTone> = {
  ok: "ok",
  bad: "bad",
  neutral: "neutral",
  checking: "checking",
};

/**
 * The team's legality, as a pill. A thin wrapper over the tool's one chip so
 * the builder, the lobby and the PvP queue draw the SAME object — they used to
 * draw three, at two heights and two corner radii, one screen apart.
 */
export function TbValidityChip({
  state,
  children,
  onClick,
  className,
  title,
}: {
  state: TbValidity;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <BsimChip tone={VALIDITY_TONE[state]} pulse={state === "checking"} onClick={onClick} title={title} className={className}>
      {children}
    </BsimChip>
  );
}

/* ── Sync chip ───────────────────────────────────────────────────────────── */

const SYNC_TONE: Record<TbSyncState, BsimChipTone> = {
  saved: "neutral",
  syncing: "checking",
  synced: "ok",
  pending: "warn",
  error: "bad",
  "local-only": "neutral",
};

/**
 * `undefined` leaves `BsimChip`'s pulsing dot in place, which is the right
 * glyph for "still working"; every settled state gets a real icon instead.
 */
const SYNC_ICON: Record<TbSyncState, "check" | "clock" | "alert" | "database" | undefined> = {
  saved: "check",
  syncing: undefined,
  synced: "check",
  pending: "clock",
  error: "alert",
  "local-only": "database",
};

/**
 * Where the team's work currently IS — on this device, in the queue, or on the
 * account. It replaced a Guardar button, so it carries the weight that button
 * used to: if it says the wrong thing, a player loses a team believing it was
 * safe. Every state it can show is something the store or the outbox reported.
 *
 * Same object as `TbValidityChip` on purpose: the two sit side by side in the
 * editor header, and two pill shapes there would read as two kinds of fact.
 */
export function TbSyncChip({
  state,
  children,
  title,
  className,
}: {
  state: TbSyncState;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <BsimChip
      tone={SYNC_TONE[state]}
      icon={SYNC_ICON[state]}
      pulse={state === "syncing"}
      title={title}
      className={className}
    >
      <span aria-live="polite">{children}</span>
    </BsimChip>
  );
}

/* ── Sprites ─────────────────────────────────────────────────────────────── */

/** A team-card thumbnail: the sprite, or a dashed square for an empty slot. */
export function TbSpriteThumb({ name, size = 40, className }: { name?: string; size?: number; className?: string }) {
  if (!name) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className={cn("inline-grid flex-none place-items-center border border-dashed border-line-2 bg-base", className)}
      >
        <i className="h-1 w-1 bg-line-2" />
      </span>
    );
  }
  return <DkSprite src={speciesSprite(name)} alt={name} size={size} onError={handleSpriteError} className={className} />;
}

/* ── Type chip (tera picker, filter chips) ───────────────────────────────── */

export function TbTypeChip({
  type,
  label,
  on = false,
  small = false,
  onClick,
  ariaLabel,
  className,
}: {
  type: string;
  label: string;
  on?: boolean;
  small?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  const style = { ["--tyc" as string]: tyColor(type) } as React.CSSProperties;
  const cls = cn(
    "cut cut-edge-slant [--cut:3px] inline-flex items-center gap-[5px] whitespace-nowrap border border-solid font-mono font-semibold uppercase leading-none tracking-[0.08em] transition-[background,color,border-color] duration-[140ms]",
    // A chip you can CLICK is a control, and a control is 32px tall whatever
    // its label size: the tera picker and the picker's type filters were 24px
    // targets, which is under every touch guideline there is. A static chip
    // (a coverage table cell) keeps the dense height.
    onClick ? "h-8 px-[10px]" : small ? "h-6 px-[7px]" : "h-7 px-[9px]",
    small ? "text-[9px]" : "text-[10px]",
    on
      ? "border-[var(--tyc)] [--cut-line:var(--tyc)] [background:var(--tyc)] text-accent-ink"
      : "border-[color-mix(in_srgb,var(--tyc)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--tyc)_45%,transparent)] [background:color-mix(in_srgb,var(--tyc)_12%,transparent)] text-[var(--tyc)]",
    onClick && "cursor-pointer hover:[background:color-mix(in_srgb,var(--tyc)_28%,transparent)]",
    onClick && on && "hover:[background:var(--tyc)]",
    onClick && BSIM_FOCUS_CUT,
    className,
  );
  const dot = <i aria-hidden className={cn("h-1 w-1 flex-none", on ? "bg-current opacity-60" : "bg-[var(--tyc)]")} />;
  if (onClick) {
    return (
      <button type="button" role="radio" aria-checked={on} aria-label={ariaLabel} onClick={onClick} style={style} className={cls}>
        {dot}
        {label}
      </button>
    );
  }
  return (
    <span style={style} className={cls}>
      {dot}
      {label}
    </span>
  );
}

/* ── Meters and bars ─────────────────────────────────────────────────────── */

/** The EV budget: spent over allowed, red past the limit. */
export function TbMeter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("block h-[6px] w-full overflow-hidden border border-solid border-line bg-base", className)}
    >
      <i
        className={cn("block h-full transition-[width,background] duration-[140ms]", over ? "bg-bad" : pct === 100 ? "bg-ok" : "bg-accent")}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

/** A base-stat bar, coloured by band the way every dex does it. */
export function TbStatBar({ value, max = 255, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  const tone = value >= 120 ? "bg-ok" : value >= 90 ? "bg-signal" : value >= 60 ? "bg-warn" : "bg-bad";
  return (
    <span aria-hidden className={cn("block h-[6px] w-full overflow-hidden border border-solid border-line bg-base", className)}>
      <i className={cn("block h-full", tone)} style={{ width: `${pct}%` }} />
    </span>
  );
}

/* ── Segmented choice (abilities, gender) ────────────────────────────────── */

export interface TbSegOption {
  value: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
}

/**
 * A wrapping segmented control. `DkSeg` is a tab strip that never wraps; three
 * ability names of fourteen characters do not fit a 280px column, and a row
 * that scrolls sideways hides the option you did not pick.
 */
export function TbSegChoice({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: TbSegOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex flex-wrap gap-[6px]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "cut-tag cut-tag-edge [--cut-tag:7px] inline-flex h-8 min-w-0 max-w-full items-center gap-[7px] border border-solid px-[10px] font-display text-[12px]/none font-bold uppercase tracking-[0.04em] transition-[background,border-color,color] duration-[140ms]",
              on
                ? "border-accent [--cut-line:var(--accent)] bg-accent text-accent-ink"
                : "border-line-2 [--cut-line:var(--line-2)] bg-base text-txt-muted hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-txt",
              BSIM_FOCUS_CUT,
            )}
          >
            <span className="truncate">{o.label}</span>
            {o.sub && (
              <small className={cn("font-mono text-[9px] font-semibold tracking-[0.08em]", on ? "opacity-80" : "text-txt-dim")}>
                {o.sub}
              </small>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Number input ────────────────────────────────────────────────────────── */

export const TbNumInput = React.forwardRef<HTMLInputElement, InputProps>(function TbNumInput({ className, ...props }, ref) {
  return (
    <Input
      ref={ref}
      type="number"
      inputMode="numeric"
      size="sm"
      className={cn("w-[64px] px-2 text-right font-mono text-[13px] tabular-nums", className)}
      {...props}
    />
  );
});

/* ── Move row (BxKey-lite) ───────────────────────────────────────────────── */

export interface TbMoveInfo {
  name: string;
  type: string;
  /** `phys` | `spec` | `status` — the HUD kit's category keys. */
  cat: string;
  power: number;
  accuracy: number | true;
  pp: number;
}

/**
 * The builder's move row: the battle HUD's `BxKey` at rest — type stripe,
 * name, type + category, power / accuracy / PP — with the hotkey slot reused
 * for the move number. Empty rows are the dashed "add" shape.
 */
export function TbMoveRow({
  index,
  move,
  label,
  onClick,
  onClear,
  clearLabel,
  figures,
  selected,
  popKey,
  illegal,
  illegalLabel,
}: {
  index: number;
  move: TbMoveInfo | null;
  /** The empty-row label and the button's accessible name. */
  label: string;
  onClick: () => void;
  onClear?: () => void;
  clearLabel?: string;
  /** Power / accuracy / PP as already-formatted strings. */
  figures?: { power: string; accuracy: string; pp: string };
  selected?: boolean;
  popKey?: unknown;
  /** This move is not legal here. Marked, never blocked — see `Picker`'s header. */
  illegal?: boolean;
  /** The word for `illegal`, from the catalog (this kit takes no translator). */
  illegalLabel?: string;
}) {
  const pop = usePop(popKey);
  if (!move) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "cut-tag cut-tag-edge [--cut-tag:9px] [--cut-line:var(--line)] flex min-h-[54px] w-full items-center gap-[9px] border border-dashed border-line bg-panel px-[10px] py-2 text-left font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim transition-[border-color,color] duration-[140ms] hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-txt",
          BSIM_FOCUS_CUT,
        )}
      >
        <kbd className="grid h-[18px] min-w-[18px] flex-none place-items-center border border-solid border-line-2 bg-base px-1 font-mono text-[10px] font-semibold not-italic leading-none text-txt-muted">
          {index + 1}
        </kbd>
        <Icon name="plus" size={14} />
        <span>{label}</span>
      </button>
    );
  }
  return (
    <div className={cn("relative flex w-full min-w-0 items-stretch", pop)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${move.name}`}
        style={{ ["--tyc" as string]: tyColor(move.type) } as React.CSSProperties}
        className={cn(
          "cut-tag cut-tag-edge [--cut-tag:9px] [--cut-line:var(--line)] flex min-h-[54px] w-full min-w-0 items-center gap-[9px] border border-solid border-line border-l-[3px] border-l-[var(--tyc)] bg-panel py-2 pl-[10px] text-left transition-[background,border-color,transform] duration-[140ms] hover:border-[color-mix(in_srgb,var(--tyc)_55%,var(--line))] hover:[--cut-line:color-mix(in_srgb,var(--tyc)_55%,var(--line))] hover:bg-panel-2",
          onClear ? "pr-10" : "pr-[10px]",
          selected && "border-accent [--cut-line:var(--accent)]",
          BSIM_FOCUS_CUT,
        )}
      >
        <kbd className="grid h-[18px] min-w-[18px] flex-none place-items-center border border-solid border-line-2 bg-base px-1 font-mono text-[10px] font-semibold not-italic leading-none text-txt-muted">
          {index + 1}
        </kbd>
        <span className="grid min-w-0 flex-1 gap-[5px]">
          <span className="truncate font-display text-[13px] font-bold uppercase leading-[1.05] tracking-[0.03em] text-txt">{move.name}</span>
          <span className="flex flex-wrap items-center gap-[7px]">
            <BxType type={move.type} small />
            <BxCat cat={move.cat} />
            {illegal && illegalLabel && (
              <b className="cut cut-edge-slant [--cut:3px] flex-none border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft px-[5px] py-[3px] font-mono text-[8.5px]/none font-bold uppercase tracking-[0.08em] text-bad">
                {illegalLabel}
              </b>
            )}
          </span>
        </span>
        {figures && (
          <span className="grid flex-none justify-items-end gap-[3px] font-mono text-[9px]/none font-semibold text-txt-dim">
            <span>{figures.power}</span>
            <span>{figures.accuracy}</span>
            <span>{figures.pp}</span>
          </span>
        )}
      </button>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className={cn(
            "absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center border-0 bg-transparent text-txt-dim transition-colors duration-[140ms] hover:text-bad",
            BSIM_FOCUS,
          )}
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Slot rail row ───────────────────────────────────────────────────────── */

export interface TbSlotMon {
  name: string;
  types: string[];
  item?: string;
}

/**
 * One rail row: order · sprite · name · types · item, with a selected state.
 * Structurally a `div` holding the selectable `button` — see the header for
 * why not `BxSlot`.
 *
 * The row has ONE child and no per-state extras on purpose: the rail is a list
 * the eye tracks down, so selecting a row must not change its height. Controls
 * that belong to the selected slot live outside the rail.
 */
export function TbSlotRow({
  order,
  mon,
  selected = false,
  onSelect,
  addLabel,
  ariaLabel,
  flag,
  className,
}: {
  order: number;
  mon: TbSlotMon | null;
  selected?: boolean;
  onSelect: () => void;
  addLabel: string;
  ariaLabel: string;
  /** A problem marker (validity) drawn on the row's left edge. */
  flag?: boolean;
  className?: string;
}) {
  const shape = cn(
    "cut-tag cut-tag-edge [--cut-tag:9px] relative flex w-full min-w-0 items-center gap-[10px] border border-solid px-[10px] py-2 text-left transition-[border-color,background] duration-[140ms]",
    selected
      ? "border-accent [--cut-line:var(--accent)] bg-accent-soft"
      : "border-line [--cut-line:var(--line)] bg-panel hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:bg-panel-2",
    BSIM_FOCUS_CUT,
  );
  return (
    <div className={cn("grid gap-[6px]", className)}>
      {mon ? (
        <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={ariaLabel} className={cn(shape, "min-h-[58px]")}>
          {flag && <i aria-hidden className="absolute bottom-[6px] left-0 top-[6px] w-[3px] bg-bad" />}
          <b className="flex-none font-mono text-[11px]/none font-extrabold text-accent-bright">{order}</b>
          <DkSprite src={speciesSprite(mon.name)} alt="" size={40} onError={handleSpriteError} />
          <span className="grid min-w-0 flex-1 gap-[3px]">
            <b className="truncate font-display text-[13px]/none font-bold uppercase tracking-[0.03em] text-txt">{mon.name}</b>
            <BxTypeRow types={mon.types} small />
            {mon.item && <small className="truncate font-mono text-[10px] leading-[1.2] text-txt-dim">{mon.item}</small>}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={ariaLabel}
          className={cn(
            shape,
            "min-h-[58px] justify-center border-dashed font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em]",
            selected ? "text-txt" : "text-txt-dim hover:text-txt",
          )}
        >
          <b className="absolute left-[10px] top-1/2 -translate-y-1/2 font-mono text-[11px]/none font-extrabold text-txt-dim">{order}</b>
          <Icon name="plus" size={15} />
          <span>{addLabel}</span>
        </button>
      )}
    </div>
  );
}

/** The ≤900px rail: one chip per slot, sprite over a short name. */
export function TbSlotChip({
  order,
  name,
  selected = false,
  onSelect,
  ariaLabel,
  flag,
  compact = false,
}: {
  order: number;
  name?: string;
  selected?: boolean;
  onSelect: () => void;
  ariaLabel: string;
  flag?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:7px] relative grid min-w-0 place-items-center gap-[2px] border border-solid px-1 transition-[border-color,background] duration-[140ms]",
        compact ? "h-[54px]" : "h-[64px]",
        name ? "" : "border-dashed",
        selected
          ? "border-accent [--cut-line:var(--accent)] bg-accent-soft"
          : "border-line [--cut-line:var(--line)] bg-panel hover:border-accent-line hover:[--cut-line:var(--accent-line)]",
        BSIM_FOCUS_CUT,
      )}
    >
      {flag && <i aria-hidden className="absolute left-1 top-1 h-[6px] w-[6px] bg-bad" />}
      <b className="absolute right-[5px] top-[3px] font-mono text-[9px]/none font-extrabold text-txt-dim">{order}</b>
      {name ? (
        <DkSprite src={speciesSprite(name)} alt="" size={compact ? 32 : 36} onError={handleSpriteError} />
      ) : (
        <Icon name="plus" size={16} className="text-txt-dim" />
      )}
      {!compact && (
        <span className="w-full truncate text-center font-mono text-[9px]/none font-semibold uppercase tracking-[0.06em] text-txt-muted">
          {name ?? "—"}
        </span>
      )}
    </button>
  );
}

/* ── Small icon action (rail aside) ──────────────────────────────────────── */

export function TbIconAction({
  name,
  label,
  onClick,
  disabled,
  danger,
  size = "sm",
  flip,
}: {
  name: Parameters<typeof Icon>[0]["name"];
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  /** `md` matches a 40px field; `sm` matches a 32px control row. */
  size?: "sm" | "md";
  /**
   * Turn the glyph half a turn. `chevron` and `chevronDown` are the SAME path
   * in the icon set, so a move-up / move-down pair drawn straight from it is
   * two identical arrows — the direction has to come from here.
   */
  flip?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:6px] [--cut-line:var(--line)] grid flex-none place-items-center border border-solid border-line bg-base text-txt-muted transition-[color,border-color,background] duration-[140ms] disabled:cursor-not-allowed disabled:opacity-35",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        danger
          ? "hover:border-bad hover:[--cut-line:var(--bad)] hover:bg-bad-soft hover:text-bad"
          : "hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:bg-panel-2 hover:text-txt",
        BSIM_FOCUS_CUT,
      )}
    >
      <Icon name={name} size={14} className={cn(flip && "rotate-180")} />
    </button>
  );
}


/* ── SP bar (Champions Stat Points allocator) ────────────────────────────── */

/** One segment's state: three allocation states, plus the bump flag. */
export interface TbSpSegment {
  /** This point is taken. */
  spent: boolean;
  /** Not taken, and the remaining budget can still reach it. */
  affordable: boolean;
  /** Not taken, and beyond what the remaining budget can reach. */
  unreachable: boolean;
  /** Taking this point raises the final stat by +2 instead of +1. */
  bump: boolean;
}

/**
 * The Champions Stat Points allocator: one segment per point, and the segments
 * ARE the control.
 *
 * SEGMENT i IS THE STEP FROM SP i TO SP i+1. Taking it costs a point, so the
 * value the bar carries runs 0…perStat — 33 states for 32 segments — while the
 * segments are indexed 0…perStat-1. Conflating the two is how the control ends
 * up unable to reach 32 at all.
 *
 * TAKEN vs NOT TAKEN OWNS THE CONTRAST; BUMPS ARE A FOOTNOTE ON TOP OF IT.
 * That ordering is the design, and it took several passes to get right — every
 * version where the bump treatment competed with the fill made the bar harder
 * to read, because the question the control exists for is how many points you
 * have spent.
 *
 * A bump is a step worth +2 instead of +1: Champions multiplies a
 * nature-boosted stat by 110/100 with a 16-bit truncation, so roughly every
 * tenth point lands one extra. It is marked because it is the whole reason a
 * Champions spread is not linear — you stop ON a bump, not next to it.
 *
 * ONE NATURE TREATMENT, NOT TWO. The mirror case (a lowered stat's ×90/100
 * swallowing some points entirely) is deliberately NOT marked. Two different
 * nature marks on an ~8px sliver read as clutter, and the wasted-point case is
 * already visible where it counts: the final-stat column beside the bar does
 * not move when you buy one.
 *
 * SEMANTICS: the container is the slider — one focus stop, arrows, Home/End,
 * PageUp/PageDown — and the segments are decoration. They are deliberately not
 * buttons. Thirty-two tab stops per stat and six stats to a Pokémon is not
 * navigable, and a `role="slider"` may not contain focusable children anyway.
 *
 * Words arrive as props; this file stays presentational like the rest of the kit.
 */
export function TbSpBar({
  stat,
  currentSp,
  perStat = 32,
  remainingBudget,
  nature,
  base,
  format,
  onChange,
  ariaLabel,
  valueText,
  bumpHint,
}: {
  stat: string;
  currentSp: number;
  perStat?: number;
  /** Points left in the pool. Negative when the spread is over budget. */
  remainingBudget: number;
  nature: string;
  /** The species' base stat, or 0 when the slot has no species yet. */
  base: number;
  format: string;
  onChange: (nextSp: number) => void;
  ariaLabel: string;
  /** Spoken value for the current allocation. */
  valueText: (sp: number) => string;
  /** Spoken gloss for how many bumps this stat has. Omitted when it has none. */
  bumpHint: (n: number) => string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const segments = React.useMemo<TbSpSegment[]>(() => {
    // Segment `i` costs a point to take, so the last one the budget can reach
    // is `currentSp + remainingBudget - 1`. Off by one here reads as one more
    // point than the pool holds — and "how much may I still put into this
    // stat" is exactly the question the bar is answering.
    const lastAffordable = currentSp + remainingBudget - 1;
    return Array.from({ length: perStat }, (_, i) => ({
      spent: i < currentSp,
      affordable: i >= currentSp && i <= lastAffordable,
      unreachable: i > lastAffordable,
      // Computed, never a table of positions, so the marks move when the
      // nature does. 31 IVs and level 50 are fixed in Champions and `calcStat`
      // ignores both for an "sp" format; passing them keeps the call honest.
      bump:
        base > 0 &&
        calcStat(format, stat as never, base, 31, i + 1, 50, nature) -
          calcStat(format, stat as never, base, 31, i, 50, nature) >=
          2,
    }));
  }, [currentSp, remainingBudget, perStat, base, format, stat, nature]);

  const bumpCount = React.useMemo(() => segments.filter((s) => s.bump).length, [segments]);

  /** Pointer x → the SP value that fills the segment under the cursor. */
  const valueAt = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return currentSp;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return currentSp;
    return Math.max(0, Math.min(perStat, Math.ceil(((clientX - rect.left) / rect.width) * perStat)));
  };

  const commit = (next: number) => {
    if (next !== currentSp) onChange(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const next = valueAt(e.clientX);
    // Clicking the point that is already the last one taken gives it back.
    // Without this there is no way to reach 0 with the pointer.
    commit(next === currentSp ? next - 1 : next);
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) commit(valueAt(e.clientX));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const jump = (to: number) => {
      e.preventDefault();
      commit(Math.max(0, Math.min(perStat, to)));
    };
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown": return jump(currentSp - 1);
      case "ArrowRight":
      case "ArrowUp": return jump(currentSp + 1);
      case "Home": return jump(0);
      case "End": return jump(perStat);
      case "PageDown": return jump(currentSp - 5);
      case "PageUp": return jump(currentSp + 5);
      default: return;
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={perStat}
      aria-valuenow={currentSp}
      aria-valuetext={bumpCount > 0 ? `${valueText(currentSp)}. ${bumpHint(bumpCount)}` : valueText(currentSp)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className={cn(
        // The slab-and-inset parallelogram the rest of the tool uses. A CSS
        // border cannot survive a clip-path — it slices the vertical edges off
        // and leaves the diagonals unstroked — so the stroke is geometry: this
        // element is the line colour, the child insets over it as the track.
        "cut relative flex h-[26px] w-full cursor-pointer touch-none select-none bg-line [--cut:8px]",
        BSIM_FOCUS_CUT,
        "transition-[background] duration-[140ms] hover:bg-line-2",
        dragging && "bg-accent-line",
      )}
    >
      <div className="cut absolute inset-[1px_2px] flex gap-[2px] overflow-hidden bg-base px-[2px] [--cut:7px]">
        {segments.map((seg, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              // Each point is a slanted sliver, parallel to the bar's own
              // edges: the house shape and the Champions read in one move.
              "relative min-w-0 flex-1 -skew-x-[17deg] transition-[background,box-shadow,opacity] duration-[120ms]",

              /* TAKEN vs NOT TAKEN is the whole vocabulary, so it gets the
               * whole contrast: a lit gradient against an outlined socket.
               *
               * Every untaken point is OUTLINED rather than flat. A socket you
               * can see is the difference between reading "32 points, 12 taken"
               * at a glance and seeing an orange smear that trails off into the
               * background — and the outline costs nothing, because there is no
               * longer anything else competing for the pill's edge.
               */
              seg.spent
                ? "bg-[linear-gradient(180deg,color-mix(in_srgb,white_30%,var(--accent-bright))_0%,var(--accent-bright)_58%,color-mix(in_srgb,black_14%,var(--accent-bright))_100%)] [box-shadow:inset_0_0_0_1px_color-mix(in_srgb,black_28%,var(--accent-bright))]"
                : seg.unreachable
                  ? // Out of budget: still a visible socket, just clearly a
                    // closed one. Dimming it to nothing lost the count.
                    "bg-panel opacity-60 [box-shadow:inset_0_0_0_1px_var(--line)]"
                  : "bg-panel-2 [box-shadow:inset_0_0_0_1px_var(--line-2)]",
            )}
          >
            {/*
             * The bump mark: a stripe along the FOOT of the pill.
             *
             * At the foot rather than around it or across the top, because it
             * has to annotate without competing — the pill's fill is already
             * saying the thing the bar is for, and every version that wrapped
             * or capped the pill fought that. A footer reads as a marginal
             * note, and it reads the same taken or not, which is the property a
             * bump needs: it describes the STEP, not the current spread.
             *
             * Accent family in both states, never a foreign hue. Three were
             * tried on this ~8px sliver and all three failed — `--bad` was mud
             * against `--accent` (two reds a few degrees apart) and backwards
             * besides, near-white read as glare, `--ok` green looked like a
             * rendering bug. So: solid accent on a dark pill, and the same
             * orange struck down toward black on a lit one.
             */}
            {seg.bump && (
              <i
                className={cn(
                  "absolute inset-x-0 bottom-0 h-[4px]",
                  seg.spent ? "bg-[color-mix(in_srgb,black_50%,var(--accent-bright))]" : "bg-accent",
                )}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
