"use client"

// Every player name/avatar in Seguridad routes through here so it always opens the citizen
// dossier. When a record has no identified player yet (an unassigned denuncia — the accused
// is optional on the real DTO), it renders a neutral, non-interactive placeholder instead of
// guessing a name.
import { useTranslations } from "next-intl"
import { Avatar } from "../ui"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import type { PlayerRef } from "../../_types"

export function PlayerLink({
  player,
  size = 32,
  sub,
  className = "",
}: {
  player: PlayerRef | null | undefined
  size?: number
  sub?: string
  className?: string
}) {
  const t = useTranslations("gobierno")
  const openDossier = useGobiernoUi((s) => s.openDossier)

  if (!player) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div
          className="flex-none rounded-[4px] border border-dashed border-gt-line-strong bg-gt-paper-1"
          style={{ width: size, height: size }}
        />
        <span className="text-[0.8125rem] italic text-gt-ink-400">{t("denuncias.sinIdentificar")}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // Stops the click from also toggling a row this sits inside (Denuncias, Patrullas
        // both wrap their whole card in a click target) — opening the dossier should never
        // fire a second, unrelated interaction.
        e.stopPropagation()
        openDossier(player.uuid)
      }}
      className={`group flex items-center gap-2.5 rounded-gt-sm text-left transition-transform hover:-translate-y-px active:translate-y-0 motion-reduce:hover:translate-y-0 ${className}`}
    >
      <Avatar user={player.username} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-gt-display text-[0.9375rem] font-bold text-gt-ink-900 group-hover:underline">
          {player.username}
        </span>
        {sub && <span className="block truncate font-gt-mono text-[0.65625rem] text-gt-ink-400">{sub}</span>}
      </span>
    </button>
  )
}
