import { Icon } from "@boffmedia/ui"
import type { SystemId } from "../../services/systems"
import { SYSTEMS } from "../../services/systems"
import { useT } from "../../i18n"

interface GameSidebarProps {
  systems: SystemId[]
  selected: SystemId | "All"
  onSelect: (s: SystemId | "All") => void
}

/**
 * A vertical rail showing available game systems. Hidden when there is only one system.
 * Shows "All" at the top, followed by each system with its icon and localized label.
 */
export function GameSidebar({ systems, selected, onSelect }: GameSidebarProps) {
  const t = useT("common")

  // Hide sidebar if only one system exists
  if (systems.length <= 1) {
    return null
  }

  const systemMap = new Map(SYSTEMS.map((s) => [s.id, s]))

  return (
    <nav className="flex flex-col gap-1 border-r border-line px-3 py-4">
      {/* "All" option at the top */}
      <button
        onClick={() => onSelect("All")}
        className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
          selected === "All"
            ? "bg-accent text-white"
            : "text-txt-muted hover:bg-surface-bright hover:text-txt"
        }`}
        title="Show all packs"
      >
        <Icon name="layers" size={16} />
        <span>All</span>
      </button>

      {/* Individual systems */}
      {systems.map((systemId) => {
        const meta = systemMap.get(systemId)
        if (!meta) return null
        const label = t(meta.labelKey)
        return (
          <button
            key={systemId}
            onClick={() => onSelect(systemId)}
            className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
              selected === systemId
                ? "bg-accent text-white"
                : "text-txt-muted hover:bg-surface-bright hover:text-txt"
            }`}
            title={label}
          >
            <Icon name={meta.icon} size={16} />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
