import { Icon, type IconName } from "@boffmedia/ui"

import { useT } from "../../i18n"
import { type Section, useApp } from "../../state/app"
import { AccountSwitcher } from "../AccountSwitcher"

// The rail is the APP SECTION rail, not a pack filter.
//
// Do not put a screen's filters here: the game-system block (All/NES/SNES/…)
// belongs in the Packs screen as chips. Spending the only navigation space the
// app has on one screen's filter also leaves Packs with no rail entry at all.
// The space is for first-class sections at the top, utilities at the foot.
//
// The highlight is driven by `section`, never by the raw view, so opening a pack
// or a tool full-screen keeps its section lit instead of going dark at depth.

const BUTTON_SIZE = 56
const ITEM_SIZE = BUTTON_SIZE - 16
/** Sections read heavier than utilities on purpose: they are the app's top
 *  level, and same-weight glyphs made Tools look like a sibling of Settings. */
const SECTION_ICON = 28
const UTILITY_ICON = 24

function RailButton({
  active,
  icon,
  size,
  label,
  onClick,
  children,
}: {
  active: boolean
  icon: IconName
  size: number
  label: string
  onClick: () => void
  children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative mb-2 flex items-center justify-center rounded transition-colors ${
        active ? "bg-accent text-white" : "text-txt-muted hover:bg-surface-bright hover:text-txt"
      }`}
      style={{ width: `${ITEM_SIZE}px`, height: `${ITEM_SIZE}px` }}
      title={label}
      aria-label={label}
    >
      {active && <div className="absolute inset-y-0 left-0 w-1 rounded-l bg-accent-bright" />}
      <div className="relative">
        <Icon name={icon} size={size} />
        {children}
      </div>
    </button>
  )
}

/**
 * The outage's PERMANENT home, once the banner has been dismissed or the player
 * is in Tools. One icon in space the rail already owns, so an offline session
 * costs no content area at all — which is the whole point: the tools work
 * offline, and a player using them should not be paying a banner's height for
 * the privilege of being told so.
 *
 * Clickable, because "retry" is the only thing anyone wants from it, and the
 * tooltip carries the full explanation the one-line banner leaves out.
 */
function BackendIndicator() {
  const st = useT("shell")
  const { backendStatus, retryBackend } = useApp()

  if (backendStatus !== "down" && backendStatus !== "unreachable") return null
  const isDown = backendStatus === "down"
  const title = `${isDown ? st("serverDownTitle") : st("serverUnreachableTitle")} — ${st("retryButton")}`

  return (
    <button
      type="button"
      onClick={retryBackend}
      title={title}
      aria-label={title}
      className="relative mb-2 flex items-center justify-center rounded text-warn transition-colors hover:bg-surface-bright"
      style={{ width: `${ITEM_SIZE}px`, height: `${ITEM_SIZE}px` }}
    >
      <Icon name="alert" size={UTILITY_ICON} />
    </button>
  )
}

/**
 * The full vertical navigation rail. Always rendered, signed in or not.
 * Top: the app's sections (Play, Tools). Bottom: the game-running indicator,
 * Logs, Settings, a divider and the account chip.
 */
export function AppRail() {
  const t = useT("appRail")
  const st = useT("shell")
  const { section, view, go, game, logs } = useApp()

  const errorCount = logs.filter((l) => l.level === "error").length
  const isSection = (s: Section) => section === s

  return (
    <nav
      className="flex h-full shrink-0 flex-col items-center overflow-y-auto bg-base-deep px-2 py-4"
      style={{ width: `${BUTTON_SIZE}px` }}
      aria-label={t("navLabel")}
    >
      {/* Sections. Play is gated on a session, but it is NOT hidden without one:
          entering it shows the sign-in panel inside the section (L3), which is
          the one obvious route to a session from anywhere in the app. */}
      <RailButton
        active={isSection("play")}
        icon="gamepad"
        size={SECTION_ICON}
        label={t("play")}
        onClick={() => go("packs")}
      />
      <RailButton
        active={isSection("tools")}
        icon="wrench"
        size={SECTION_ICON}
        label={t("tools")}
        onClick={() => go("tools")}
      />

      <div className="flex-1" />

      {/* Game-running indicator (only when running) */}
      {game.kind === "running" && (
        <div
          className="relative mb-2 flex items-center justify-center rounded bg-ok/20"
          style={{ width: `${ITEM_SIZE}px`, height: `${ITEM_SIZE}px` }}
          title={`${st("running")} · pid ${game.pid}`}
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-ok" />
        </div>
      )}

      <BackendIndicator />

      {/* Utilities. Same positions they have always occupied, so muscle memory
          survives the filter block leaving. */}
      <RailButton
        active={view === "logs"}
        icon="list"
        size={UTILITY_ICON}
        label={st("navLogs")}
        onClick={() => go("logs")}
      >
        {errorCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bad text-[10px] font-bold text-white">
            {errorCount > 9 ? "9+" : errorCount}
          </span>
        )}
      </RailButton>

      <RailButton
        active={view === "settings"}
        icon="sliders"
        size={UTILITY_ICON}
        label={st("navSettings")}
        onClick={() => go("settings")}
      />

      <div className="my-2 h-px w-8 bg-line" />

      <AccountSwitcher />
    </nav>
  )
}
