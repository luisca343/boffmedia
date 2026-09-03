"use client"

/**
 * Battlesim shared kit — the pieces every SCREEN needs, as opposed to the
 * battle HUD's `bx-*` pieces in `bx-kit.tsx`.
 *
 * Everything here is host-agnostic and built from the shared vocabulary only:
 * the `cut-*` geometry utilities, the token colours, the three faces. No
 * `rounded-*`, no shadow names, no `text-t-*` scale — those exist in apps/web's
 * Tailwind config and nowhere else, so a component using them looks correct on
 * the website and unstyled in the launcher.
 */

import * as React from "react"
import { cn, Icon, type IconName } from "@boffmedia/ui"
import { DkApp, DkBody, DkEmpty, DkSkelList } from "@boffmedia/ui/datakit"
import { useToolT, BATTLESIM_NS } from "../i18n"

/* ── Focus ───────────────────────────────────────────────────────────────── */

/**
 * The focus ring for anything with a NORMAL box: a real outline, offset so it
 * reads against the panel behind it.
 *
 * A constant rather than a repeated literal because the recipe is exact and
 * because the failure mode is invisible — `focus-visible:outline-none` with
 * nothing in its place looks fine to everyone navigating with a mouse.
 */
export const BSIM_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]"

/**
 * The focus ring for CLIPPED shapes — anything carrying `cut`, `cut-tag`,
 * `cut-corner` or a `cut-frame-*`. An outline on those is drawn and then
 * clipped away with the corner it was meant to mark, so the ring has to be the
 * shape's own edge stroke instead: widen it and paint it accent.
 */
export const BSIM_FOCUS_CUT =
  "outline-none focus-visible:[--cut-w:3px] focus-visible:[--cut-line:var(--accent)]"

/**
 * The focus ring for a hit area INSIDE a clipped chassis it does not own.
 *
 * `BSIM_FOCUS_CUT` widens the shape's own edge stroke, which is the right
 * answer when the focusable element IS the shape. It is the wrong answer for
 * one of several controls sharing a chassis — there is one stroke and two
 * buttons, so lighting it cannot say which has focus. `BSIM_FOCUS` is wrong
 * too: its outline is offset outward, so it would be drawn outside a box the
 * element does not own and then clipped by the chamfer.
 *
 * An inset ring is drawn inside the element's own border box, so the clip never
 * reaches it and it marks the half that actually has focus.
 */
export const BSIM_FOCUS_INSET =
  "outline-none focus-visible:[box-shadow:inset_0_0_0_2px_var(--accent)]"

/**
 * The focus ring for a `DkSeg` tab strip, reached through its `className`.
 *
 * `DkSeg` paints no ring of its own, so its options fall back to the browser's
 * default outline — visible, but not the ring every other control in the tool
 * draws, and the tool's four tab strips sat next to those controls. The ring is
 * INSET (`-2px`) because the strip is a `cut-tag` box and an outward outline on
 * an option would be clipped by it.
 *
 * A child-scoped variant rather than a fix in `@boffmedia/ui`: `DkSeg` has
 * twenty call sites across three other tools and apps/web, and this pass owns
 * none of them. The primitive is the right place — see the report.
 */
export const BSIM_SEG_FOCUS =
  "[&>button]:outline-none [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-accent [&>button]:focus-visible:outline-offset-[-3px]"

/* ── Measures ────────────────────────────────────────────────────────────── */

/**
 * The tool has exactly TWO measures, and every screen picks one.
 *
 * Three writers rebuilt these screens in parallel and each chose its own cap —
 * 780, 820, `max-w-4xl` (896), `max-w-3xl` (768), none — so moving between the
 * hub, the replays list and the PvP lobby slid the content left and right by
 * up to 120px on the same monitor. The gutter is `DkBody`'s `--dk-pad`; these
 * only decide how wide the column inside it is allowed to grow.
 */
/** Single-column screens: lobby, replays, PvP, Showdown, the replay loader. */
export const BSIM_PAGE_NARROW = "mx-auto w-full max-w-[51.25rem] min-[2240px]:max-w-[65rem]"
/**
 * Grid screens: the teams list, the hub's two-column layout above 1200.
 *
 * This one follows `--wrap-max-wide` rather than a flat cap. A grid is exactly
 * the case where a large display has something to offer — more columns, not a
 * longer line — and 1240px of team cards centred in a 2560px window was the
 * clearest single instance of the underscaling complaint.
 */
export const BSIM_PAGE = "mx-auto w-full max-w-[var(--wrap-max-wide,77.5rem)]"
/**
 * Empty / error blocks. `mx-auto` alone is not enough: in a flex COLUMN it
 * makes the box shrink to its content, which is how the replays empty state
 * ended up a 300px dashed sliver next to a 560px one on the teams tab.
 */
export const BSIM_STATE = "mx-auto w-full max-w-[35rem]"

/* ── Mono label ──────────────────────────────────────────────────────────── */

/**
 * The one mono kicker: the small uppercase label above a control, a column or
 * a group.
 *
 * There were four of these — 9.5px/0.14em, 10px/0.12em, 10px/0.16em and
 * 11px/0.1em — and they appeared next to each other on the same screen. The
 * tracking scale the tool now keeps is: kickers 0.1em · chips 0.08em · data
 * micro-labels 0.06em · display titles 0.03–0.04em.
 */
export const BSIM_KICKER = "font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.1em] text-txt-dim"

export function BsimKicker({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <span id={id} className={cn(BSIM_KICKER, className)}>
      {children}
    </span>
  )
}

/* ── State chip ──────────────────────────────────────────────────────────── */

export type BsimChipTone = "ok" | "warn" | "bad" | "signal" | "neutral" | "checking" | "accent"

/**
 * `color-mix` rather than `/45`: the status tokens are already low-chroma in
 * the light theme, and a 45% alpha border over a light panel disappears. The
 * mix keeps the hairline against whichever surface is behind it.
 */
const CHIP_TONE: Record<BsimChipTone, string> = {
  ok: "border-[color-mix(in_srgb,var(--ok)_50%,transparent)] [--cut-line:color-mix(in_srgb,var(--ok)_50%,transparent)] bg-ok-soft text-ok",
  warn: "border-[color-mix(in_srgb,var(--warn)_50%,transparent)] [--cut-line:color-mix(in_srgb,var(--warn)_50%,transparent)] bg-warn-soft text-warn",
  bad: "border-[color-mix(in_srgb,var(--bad)_50%,transparent)] [--cut-line:color-mix(in_srgb,var(--bad)_50%,transparent)] bg-bad-soft text-bad",
  signal: "border-[color-mix(in_srgb,var(--info)_50%,transparent)] [--cut-line:color-mix(in_srgb,var(--info)_50%,transparent)] bg-signal-soft text-signal",
  accent: "border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft text-accent",
  neutral: "border-line-2 [--cut-line:var(--line-2)] bg-panel-2 text-txt-muted",
  checking: "border-line [--cut-line:var(--line)] bg-panel text-txt-dim",
}

const CHIP_SIZE = {
  xs: "h-6 gap-[0.3125rem] px-[0.4375rem] text-[0.5625rem]/none",
  sm: "h-7 gap-[0.375rem] px-[0.5625rem] text-[0.625rem]/none",
  md: "h-8 gap-[0.375rem] px-[0.5625rem] text-[0.625rem]/none",
} as const

export interface BsimChipProps {
  tone: BsimChipTone
  size?: keyof typeof CHIP_SIZE
  /** A leading icon. Omit for the default square dot. */
  icon?: IconName
  /** `false` drops the dot entirely (an icon already carries the meaning). */
  dot?: boolean
  /** Pulse the dot — the "still checking" state. */
  pulse?: boolean
  children: React.ReactNode
  onClick?: () => void
  title?: string
  className?: string
}

/**
 * The one status pill in the tool: legality, availability, connection, source.
 *
 * Three near-identical implementations existed — the teambuilder's dot chip,
 * the lobby's icon chip and a verbatim copy of the lobby's inside the PvP
 * lobby — at two heights, two corner sizes and two border recipes. They sat one
 * screen apart, so the tool read as three products. This is the survivor;
 * `TbValidityChip` is now a thin alias over it.
 *
 * The dot is never the only signal: every chip carries its own word, so the
 * tone is redundant colour rather than the meaning itself.
 */
export function BsimChip({ tone, size = "sm", icon, dot = true, pulse, children, onClick, title, className }: BsimChipProps) {
  const cls = cn(
    "cut cut-edge-slant [--cut:4px] inline-flex flex-none items-center whitespace-nowrap border border-solid font-mono font-bold uppercase tracking-[0.08em] transition-[background,border-color,color] duration-[140ms]",
    CHIP_SIZE[size],
    CHIP_TONE[tone],
    onClick && "cursor-pointer hover:brightness-110",
    onClick && BSIM_FOCUS_CUT,
    className,
  )
  const glyph = icon ? (
    <Icon name={icon} size={size === "xs" ? 10 : 11} className="flex-none" />
  ) : dot ? (
    <i
      aria-hidden
      className={cn(
        "h-[0.375rem] w-[0.375rem] flex-none bg-current",
        pulse && "animate-[bm-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none",
      )}
    />
  ) : null
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={cls}>
        {glyph}
        {children}
      </button>
    )
  }
  return (
    <span title={title} className={cls}>
      {glyph}
      {children}
    </span>
  )
}

/* ── Section card ────────────────────────────────────────────────────────── */

export interface BsimSectionProps {
  /** Short mono tag above/beside the title — a count, a state, a format. */
  kicker?: React.ReactNode
  icon?: IconName
  title: React.ReactNode
  /** Right-aligned controls in the header row. */
  aside?: React.ReactNode
  children?: React.ReactNode
  className?: string
  /** Drop the default `p-4` when the body owns its own padding (a table, a list). */
  bodyClassName?: string
}

/**
 * The one panel shape in the tool: hairline box, header strip, padded body.
 *
 * Matches the section card the other v3 tools use (pmdsky's `wm-kit`), so a
 * user moving between Pokémon tools meets the same object. `<section>` with a
 * real `<h3>` rather than a styled div, because these headings are the
 * document outline a screen reader reads to navigate the screen.
 */
export function BsimSection({ kicker, icon, title, aside, children, className, bodyClassName }: BsimSectionProps) {
  return (
    <section className={cn("border border-solid border-line bg-panel", className)}>
      <header className="flex items-center gap-[0.6875rem] border-b border-solid border-line px-4 py-[0.8125rem]">
        {kicker != null && (
          <span className="cut cut-edge-slant [--cut:3px] [--cut-line:var(--accent-line)] border border-solid border-accent-line bg-accent-soft px-[0.4375rem] py-[0.3125rem] font-mono text-[0.6875rem]/none font-bold tracking-[0.1em] text-accent">
            {kicker}
          </span>
        )}
        {icon && <Icon name={icon} size={15} className="shrink-0 text-txt-muted" />}
        <h3 className="min-w-0 truncate font-display text-[0.9375rem]/none font-bold not-italic uppercase tracking-[0.04em] text-txt">{title}</h3>
        <span className="flex-1" />
        {aside}
      </header>
      <div className={bodyClassName ?? "p-4"}>{children}</div>
    </section>
  )
}

/* ── Error / empty states ────────────────────────────────────────────────── */

/**
 * Every failure the tool can put on screen, as a code.
 *
 * The screens used to render these strings verbatim — the user was shown
 * `rejected_by:Ash` and `connect_failed`. Naming them here means the copy is
 * translated once, in the catalog, and a new call site gets a sentence instead
 * of an identifier for free.
 *
 * `rejected_by:<name>` carries its payload after the colon, which is why the
 * code is parsed rather than looked up whole.
 */
export type BsimErrorCode =
  | "signin_required"
  | "offline"
  | "connect_failed"
  | "worker_failed"
  | "ticket_denied"
  | "rejected_by"
  | "not_found"
  | "unknown"

const ERROR_ICON: Record<BsimErrorCode, IconName> = {
  signin_required: "lock",
  offline: "globe",
  connect_failed: "alert",
  worker_failed: "cog",
  ticket_denied: "key",
  rejected_by: "x",
  not_found: "search",
  unknown: "alert",
}

const KNOWN_CODES: BsimErrorCode[] = [
  "signin_required",
  "offline",
  "connect_failed",
  "worker_failed",
  "ticket_denied",
  "rejected_by",
  "not_found",
  "unknown",
]

/** Split `rejected_by:Ash` into its code and its payload. */
export function parseBsimError(raw: string | undefined | null): { code: BsimErrorCode; detail: string } {
  if (!raw) return { code: "unknown", detail: "" }
  const at = raw.indexOf(":")
  const head = at === -1 ? raw : raw.slice(0, at)
  const detail = at === -1 ? "" : raw.slice(at + 1).trim()
  return { code: (KNOWN_CODES as string[]).includes(head) ? (head as BsimErrorCode) : "unknown", detail }
}

/**
 * A socket-level code as a sentence, for the places that show one INLINE
 * (a banner above the controls) rather than as the whole screen.
 *
 * The PvP lobby had this as a local function; the Showdown lobby had nothing
 * and rendered `{error}` straight into a banner, so the user was shown
 * `signin_required`.
 */
export function bsimErrorText(raw: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const { code, detail } = parseBsimError(raw)
  if (code === "rejected_by") return t("errors.rejected_by.lead", { name: detail || t("errors.rejected_by.someone") })
  // An unrecognised code is shown verbatim: inventing a friendly sentence for
  // something we cannot name would hide the one clue anyone debugging it has.
  if (code === "unknown") return raw
  return t(`errors.${code}.lead`)
}

export interface BsimErrorStateProps {
  /** A raw engine/socket code — `connect_failed`, `rejected_by:Ash`, … */
  code?: string
  /** Override the catalog copy. */
  title?: React.ReactNode
  lead?: React.ReactNode
  icon?: IconName
  /** Buttons. The catalog supplies no action: only the caller knows what
   *  retrying, signing in or going back means on its screen. */
  actions?: React.ReactNode
  className?: string
}

/**
 * One surface for "this did not work".
 *
 * `role="alert"` because these appear in place of content the user was waiting
 * for, mid-flow — a screen reader that only announces on focus would never say
 * that the battle failed to connect.
 */
export function BsimErrorState({ code, title, lead, icon, actions, className }: BsimErrorStateProps) {
  const t = useToolT(BATTLESIM_NS)
  const { code: parsed, detail } = parseBsimError(code)
  const resolvedTitle = title ?? t(`errors.${parsed}.title`)
  const resolvedLead =
    lead ?? (parsed === "rejected_by" ? t("errors.rejected_by.lead", { name: detail || t("errors.rejected_by.someone") }) : t(`errors.${parsed}.lead`))

  return (
    // The measure is the component's, not the caller's: the same "not found"
    // block was a full-bleed 1300px band on the replay route and a 560px card
    // on the teams tab, because only one of the two callers passed a width.
    <div role="alert" className={cn(BSIM_STATE, className)}>
      <DkEmpty icon={icon ?? ERROR_ICON[parsed]} title={resolvedTitle} lead={resolvedLead}>
        {actions}
      </DkEmpty>
    </div>
  )
}

/* ── Loading ─────────────────────────────────────────────────────────────── */

/**
 * The Suspense fallback for every lazy screen.
 *
 * The tab bar at the top of the tool never unmounts — a screen loads while it
 * stays in place — so the chrome remains stable and the swap reads as loading
 * rather than as a navigation to nowhere. This removes the redundant fallback
 * bar that used to exist on every screen.
 */
export function BsimScreenSkeleton() {
  const t = useToolT(BATTLESIM_NS)
  return (
    <div className="contents">
      <DkApp>
        <DkBody>
          <p role="status" className="sr-only">
            {t("errors.loading")}
          </p>
          <DkSkelList rows={5} h={72} />
        </DkBody>
      </DkApp>
    </div>
  )
}

/* ── Screen shell ────────────────────────────────────────────────────────── */

/**
 * The tool chrome for a screen that is NOT the hub and not a live battle.
 *
 * The PvP lobby and the replay viewer used to render bare into the host page
 * with no way back — on the website you could still use the browser's Back; in
 * the launcher there is no browser, so those screens were one-way doors. The
 * global tab bar at the top now provides pinned navigation to the hub sections
 * (Lobby · Equipos · Repeticiones), which are always reachable from any screen.
 *
 * A battle screen deliberately does NOT use this — `BattleShell` owns its own
 * chrome, because a battle needs the header to carry timers and a forfeit.
 */
export function BsimScreenShell({
  children,
  bodyClassName,
}: {
  children?: React.ReactNode
  bodyClassName?: string
}) {
  return (
    <div className="contents">
      <DkApp>
        <DkBody className={bodyClassName}>{children}</DkBody>
      </DkApp>
    </div>
  )
}

/* ── Tab ─────────────────────────────────────────────────────────────────── */

/** The status dot's tone. Structurally `BsimRoomTone`, restated so the kit
 *  keeps no dependency on the rooms registry. */
export type BsimTabTone = "ok" | "warn" | "bad" | "dim"

const TAB_DOT: Record<BsimTabTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  dim: "bg-line-2",
}

/**
 * ONE tab — chassis, label and close, in a single object.
 *
 * It used to be two: the tab was a bordered `cut-tag` and the close button was
 * a SECOND bordered `cut-tag` pulled back over it with `-ml-px`. Two strokes,
 * two backgrounds and two chamfers touching at a seam, which is what made a
 * closable tab read as a tab with a separate button stuck to its side rather
 * than as one control. Worse, the seam did not move with the state: the tab
 * half lit up on selection and the close half did not, so the pair drifted
 * further apart exactly when the tab mattered most.
 *
 * Now the CHASSIS owns the whole visual — one border, one chamfer, one
 * background, one hover — and the two hit areas inside it are transparent and
 * borderless. Selection styles the chassis, so both halves light together.
 *
 * STILL TWO BUTTONS, THOUGH, and that part is not negotiable: a button inside a
 * button is invalid HTML and unreachable by keyboard, so "combine them" can only
 * mean one chassis, never one element. They stay siblings, the close keeps its
 * own tab stop and its own accessible name, and each gets an INSET focus ring —
 * an outline would be clipped away by the chassis' chamfer, and an offset one
 * would draw outside a box it no longer owns.
 *
 * `ref` goes to the tab button rather than the chassis: the tablist drives
 * roving focus by calling `.focus()` on it.
 */
export const BsimTab = React.forwardRef<
  HTMLButtonElement,
  {
    icon: IconName
    label: string
    /** Secondary line — a room id, a format. Truncated hard. */
    sub?: string | null
    /** Status dot. Omit for a tab that has no live state. */
    tone?: BsimTabTone | null
    /** Word behind the dot, for screen readers. The dot is redundant colour. */
    stateLabel?: string
    selected?: boolean
    /** Roving tabindex: 0 for the one tab in the tab order, -1 for the rest. */
    tabIndex?: number
    id?: string
    ariaControls?: string
    onSelect?: () => void
    onFocus?: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
    /** Omit entirely for a tab that cannot be closed (the pinned sections). */
    onClose?: () => void
    /** Accessible name for the close control. Required whenever `onClose` is. */
    closeLabel?: string
    className?: string
  }
>(function BsimTab(
  { icon, label, sub, tone, stateLabel, selected = false, tabIndex, id, ariaControls, onSelect, onFocus, onKeyDown, onClose, closeLabel, className },
  ref,
) {
  return (
    <span
      role="presentation"
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:8px]",
        "flex h-8 flex-none items-center overflow-hidden border border-solid transition-[background,border-color,color] duration-[140ms]",
        selected
          ? "border-line-2 [--cut-line:var(--line-2)] bg-panel text-txt [box-shadow:inset_0_2px_0_var(--accent)]"
          : "border-line [--cut-line:var(--line)] bg-base text-txt-muted hover:bg-panel-2 hover:text-txt",
        className,
      )}
    >
      <button
        type="button"
        role="tab"
        id={id}
        aria-selected={selected}
        aria-controls={ariaControls}
        tabIndex={tabIndex}
        ref={ref}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onClick={onSelect}
        className={cn(
          BSIM_FOCUS_INSET,
          "flex h-full min-w-0 items-center gap-[0.375rem] border-0 bg-transparent pl-[0.625rem] font-display text-[0.71875rem]/none font-bold uppercase tracking-[0.04em] text-inherit",
          onClose ? "pr-[0.375rem]" : "pr-[0.625rem]",
        )}
      >
        <Icon name={icon} size={12} className="flex-none opacity-80" />
        <span className="max-w-[12ch] truncate">{label}</span>
        {sub && <span className="max-w-[8ch] truncate font-mono text-[0.59375rem]/none font-semibold tracking-[0.06em] text-txt-dim">{sub}</span>}
        {tone && <i aria-hidden className={cn("h-[0.375rem] w-[0.375rem] flex-none [clip-path:circle(50%)]", TAB_DOT[tone])} />}
        {stateLabel && <span className="sr-only">{stateLabel}</span>}
      </button>
      {onClose && (
        <button
          type="button"
          tabIndex={tabIndex}
          onFocus={onFocus}
          onClick={onClose}
          aria-label={closeLabel}
          className={cn(
            BSIM_FOCUS_INSET,
            "grid h-full w-7 flex-none place-items-center border-0 bg-transparent pr-[2px] text-txt-dim transition-colors duration-[140ms] hover:text-bad",
          )}
        >
          <Icon name="x" size={11} />
        </button>
      )}
    </span>
  )
})
