"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { SchIcon } from "./sch-icon"
import type { SchGame, SchRegistry } from "./lib"

const GAMES_LIST: { id: SchGame; label: string; icon: string }[] = [
  { id: "minecraft", label: "Minecraft", icon: "cube" },
  { id: "hytale", label: "Hytale", icon: "gamepad" },
]

export interface ScanCardProps {
  role: "source" | "target"
  roleLabel: string
  game: SchGame
  onGame: (id: SchGame) => void
  registry?: SchRegistry | null
  scanning?: boolean
  progress?: number
  onPick: () => void
}

// Environment-capture card: game toggle (Minecraft / Hytale), folder-pick button
// and a result line with a status LED. Border turns green once a registry loads.
export function ScanCard({
  role,
  roleLabel,
  game,
  onGame,
  registry,
  scanning = false,
  progress = 0,
  onPick,
}: ScanCardProps) {
  const t = useTranslations("games.minecraft.schematicCompat")
  return (
    <div
      className={cn(
        "flex flex-col gap-[0.55rem] p-[0.7rem] rounded-[var(--radius)] border bg-layer-2",
        "transition-[border-color] duration-[var(--dur)] ease-[var(--ease)]",
        registry ? "border-[color-mix(in_srgb,var(--emerald-500)_40%,var(--border))]" : "border-edge",
      )}
    >
      {/* top: role + game toggle */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase font-bold text-ink-muted">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-[5px] align-middle"
            style={{ background: role === "target" ? "var(--orange-500)" : "var(--accent)" }}
          />
          {roleLabel}
        </span>
        <div
          className="ml-auto inline-flex gap-[2px] p-[2px] rounded-[var(--radius)] border border-edge bg-[color-mix(in_srgb,var(--layer-3)_60%,transparent)]"
          role="group"
          aria-label={t("game.title")}
        >
          {GAMES_LIST.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={game === g.id}
              disabled={scanning}
              onClick={() => onGame(g.id)}
              className={cn(
                "inline-flex items-center gap-[0.3rem] py-[0.2rem] px-[0.45rem] rounded-[calc(var(--radius)-2px)]",
                "font-body text-[10px] font-semibold cursor-pointer",
                "transition-all duration-[var(--dur)] ease-[var(--ease)] disabled:cursor-default",
                game === g.id
                  ? "bg-[var(--accent-soft)] text-[color:var(--accent-bright)]"
                  : "text-ink-dim hover:text-ink",
              )}
            >
              <SchIcon name={g.icon} size={15} />
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* pick button */}
      <BoffButton
        variant="ghost"
        size="sm"
        disabled={scanning}
        onClick={onPick}
        className="w-full !justify-start gap-[0.55rem] py-[0.6rem] px-3 text-[length:var(--t-sm)] [&_svg]:text-ink-muted"
      >
        <SchIcon name="folder" size={17} />
        {scanning
          ? t("setup.scanningShort")
          : game === "hytale"
            ? t("setup.pickHytaleShort")
            : t("setup.pickInstanceShort")}
      </BoffButton>

      {scanning && (
        <div className="h-1 rounded-[4px] bg-layer-3 overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-[4px] transition-[width] duration-200 ease-linear"
            style={{ width: progress + "%" }}
          />
        </div>
      )}

      {/* result line */}
      <div className="flex items-start gap-[0.45rem] text-[length:var(--t-xs)] leading-[1.4] min-h-[18px]">
        <span
          className={cn(
            "w-[7px] h-[7px] rounded-full shrink-0 mt-1",
            registry
              ? "bg-[color:var(--emerald-400)] shadow-[0_0_6px_color-mix(in_srgb,var(--emerald-400)_80%,transparent)]"
              : "bg-layer-3 border border-edge-strong",
          )}
        />
        {registry ? (
          <span className="min-w-0 text-ink-muted">
            {registry.name ? (
              <>
                <b className="text-ink font-semibold">{registry.name}</b> ·{" "}
              </>
            ) : null}
            <code className="font-mono text-[color:var(--accent-bright)]">{registry.version}</code>
            {registry.loader ? " · " + registry.loader : ""}
            <br />
            {registry.mods} {t("setup.modsLabel")} · {registry.blocks.toLocaleString()} {t("setup.blocksLabel")}
          </span>
        ) : (
          <span className="text-ink-dim">
            {scanning ? progress + "% · " + t("setup.reading") : t("setup.noEnv")}
          </span>
        )}
      </div>
    </div>
  )
}
