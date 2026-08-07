import { useMemo } from "react"
import { Icon } from "@boffmedia/ui"
import type { SystemId } from "../../services/systems"
import { SYSTEMS, systemOfEntry } from "../../services/systems"
import { useT } from "../../i18n"
import { useLauncher } from "../../state/launcher"
import { AccountSwitcher } from "../AccountSwitcher"

/**
 * The full vertical navigation rail. Always rendered (never hidden).
 * Structure: systems at top, spacer, game-running indicator, logs, settings, divider, account avatar.
 */
export function GameRail() {
  const t = useT("common")
  const gt = useT("gameSidebar")
  const st = useT("shell")
  const { packs, selectedSystem, selectSystem, view, go, game, logs } = useLauncher()

  // Collect unique systems from all packs
  const systems = useMemo(() => {
    const seen = new Set<SystemId>()
    packs.forEach((p) => {
      seen.add(systemOfEntry(p))
    })
    return Array.from(seen).sort()
  }, [packs])

  const systemMap = new Map(SYSTEMS.map((s) => [s.id, s]))
  const ICON_SIZE = 24
  const BUTTON_SIZE = 56
  const errorCount = logs.filter((l) => l.level === "error").length

  const handleSelectSystem = (systemId: SystemId | "All") => {
    selectSystem(systemId)
    go("packs")
  }

  return (
    <nav className="flex h-full shrink-0 flex-col items-center bg-base-deep py-4 px-2 overflow-y-auto" style={{ width: `${BUTTON_SIZE}px` }}>
      {/* Systems group: "Todos" + system buttons (only show buttons when >=2 systems) */}
      <button
        onClick={() => handleSelectSystem("All")}
        className={`relative flex items-center justify-center rounded transition-colors mb-2 ${
          selectedSystem === "All"
            ? "bg-accent text-white"
            : "text-txt-muted hover:bg-surface-bright hover:text-txt"
        }`}
        style={{ width: `${BUTTON_SIZE - 16}px`, height: `${BUTTON_SIZE - 16}px` }}
        title={gt("allSystemsTooltip")}
      >
        {selectedSystem === "All" && (
          <div className="absolute inset-0 left-0 top-0 bottom-0 w-1 rounded-l bg-accent-bright" />
        )}
        <Icon name="grid" size={ICON_SIZE} />
      </button>

      {/* Individual system buttons (only rendered when 2+ systems) */}
      {systems.length >= 2 &&
        systems.map((systemId) => {
          const meta = systemMap.get(systemId)
          if (!meta) return null
          const label = t(meta.labelKey)
          const isSelected = selectedSystem === systemId
          return (
            <button
              key={systemId}
              onClick={() => handleSelectSystem(systemId)}
              className={`relative flex items-center justify-center rounded transition-colors mb-2 ${
                isSelected
                  ? "bg-accent text-white"
                  : "text-txt-muted hover:bg-surface-bright hover:text-txt"
              }`}
              style={{ width: `${BUTTON_SIZE - 16}px`, height: `${BUTTON_SIZE - 16}px` }}
              title={label}
            >
              {isSelected && (
                <div className="absolute inset-0 left-0 top-0 bottom-0 w-1 rounded-l bg-accent-bright" />
              )}
              <Icon name={meta.icon} size={ICON_SIZE} />
            </button>
          )
        })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Game-running indicator (only when running) */}
      {game.kind === "running" && (
        <div
          className="flex items-center justify-center rounded mb-2 bg-ok/20 relative"
          style={{ width: `${BUTTON_SIZE - 16}px`, height: `${BUTTON_SIZE - 16}px` }}
          title={`${st("running")} · pid ${game.pid}`}
        >
          <div className="h-2 w-2 bg-ok rounded-full animate-pulse" />
        </div>
      )}

      {/* Logs button */}
      <button
        onClick={() => go("logs")}
        className={`relative flex items-center justify-center rounded transition-colors mb-2 ${
          view === "logs"
            ? "bg-accent text-white"
            : "text-txt-muted hover:bg-surface-bright hover:text-txt"
        }`}
        style={{ width: `${BUTTON_SIZE - 16}px`, height: `${BUTTON_SIZE - 16}px` }}
        title={st("navLogs")}
      >
        {view === "logs" && (
          <div className="absolute inset-0 left-0 top-0 bottom-0 w-1 rounded-l bg-accent-bright" />
        )}
        <div className="relative">
          <Icon name="list" size={ICON_SIZE} />
          {errorCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-bad text-[10px] font-bold text-white">
              {errorCount > 9 ? "9+" : errorCount}
            </span>
          )}
        </div>
      </button>

      {/* Settings button */}
      <button
        onClick={() => go("settings")}
        className={`relative flex items-center justify-center rounded transition-colors mb-2 ${
          view === "settings"
            ? "bg-accent text-white"
            : "text-txt-muted hover:bg-surface-bright hover:text-txt"
        }`}
        style={{ width: `${BUTTON_SIZE - 16}px`, height: `${BUTTON_SIZE - 16}px` }}
        title={st("navSettings")}
      >
        {view === "settings" && (
          <div className="absolute inset-0 left-0 top-0 bottom-0 w-1 rounded-l bg-accent-bright" />
        )}
        <Icon name="sliders" size={ICON_SIZE} />
      </button>

      {/* Divider */}
      <div className="my-2 h-px w-8 bg-line" />

      {/* Account switcher (compact avatar) */}
      <AccountSwitcher />
    </nav>
  )
}
