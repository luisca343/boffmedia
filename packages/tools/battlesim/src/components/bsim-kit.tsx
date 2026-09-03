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
import { DkApp, DkBack, DkBar, DkBody, DkTitle, DkEmpty, DkSkelList } from "@boffmedia/ui/datakit"
import { useToolT, BATTLESIM_NS } from "../i18n"
import { useBsimBackOrHub } from "../nav"

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
export const BSIM_PAGE_NARROW = "mx-auto w-full max-w-[820px]"
/** Grid screens: the teams list, the hub's two-column layout above 1200. */
export const BSIM_PAGE = "mx-auto w-full max-w-[1240px]"
/**
 * Empty / error blocks. `mx-auto` alone is not enough: in a flex COLUMN it
 * makes the box shrink to its content, which is how the replays empty state
 * ended up a 300px dashed sliver next to a 560px one on the teams tab.
 */
export const BSIM_STATE = "mx-auto w-full max-w-[560px]"

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
export const BSIM_KICKER = "font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim"

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
  xs: "h-6 gap-[5px] px-[7px] text-[9px]/none",
  sm: "h-7 gap-[6px] px-[9px] text-[10px]/none",
  md: "h-8 gap-[6px] px-[9px] text-[10px]/none",
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
        "h-[6px] w-[6px] flex-none bg-current",
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
      <header className="flex items-center gap-[11px] border-b border-solid border-line px-4 py-[13px]">
        {kicker != null && (
          <span className="cut cut-edge-slant [--cut:3px] [--cut-line:var(--accent-line)] border border-solid border-accent-line bg-accent-soft px-[7px] py-[5px] font-mono text-[11px]/none font-bold tracking-[0.1em] text-accent">
            {kicker}
          </span>
        )}
        {icon && <Icon name={icon} size={15} className="shrink-0 text-txt-muted" />}
        <h3 className="min-w-0 truncate font-display text-[15px]/none font-bold not-italic uppercase tracking-[0.04em] text-txt">{title}</h3>
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
 * `fallback={null}` blanked the whole viewport while the ~8 MB battle chunk
 * downloaded — the tool looked like it had crashed. Keeping the bar means the
 * chrome never moves, so the swap reads as loading rather than as a navigation
 * to nowhere.
 */
export function BsimScreenSkeleton() {
  const t = useToolT(BATTLESIM_NS)
  return (
    <div className="contents">
      <DkApp>
        <DkBar>
          <DkTitle icon="sword" label="Battlesim" sub={t("app.tagline")} />
        </DkBar>
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
 * The PvP lobby and the replay viewer used to render bare into the host page:
 * no title, and — the part that matters — no way back. On the website you could
 * still use the browser's Back; in the launcher there is no browser, so those
 * screens were one-way doors. `useBsimBackOrHub` is the seam's answer on both
 * hosts: pop the in-tool stack, or land on the hub when there is none.
 *
 * A battle screen deliberately does NOT use this — `BattleShell` owns its own
 * chrome, because a battle needs the header to carry timers and a forfeit.
 */
export function BsimScreenShell({
  sub,
  children,
  bodyClassName,
}: {
  /** Overrides the tool tagline in the bar. */
  sub?: React.ReactNode
  children?: React.ReactNode
  bodyClassName?: string
}) {
  const t = useToolT(BATTLESIM_NS)
  const back = useBsimBackOrHub()
  return (
    <div className="contents">
      <DkApp>
        <DkBar>
          <DkBack onClick={back} label={t("connection.backToLobby")} />
          <DkTitle icon="sword" label="Battlesim" sub={sub ?? t("app.tagline")} />
        </DkBar>
        <DkBody className={bodyClassName}>{children}</DkBody>
      </DkApp>
    </div>
  )
}
