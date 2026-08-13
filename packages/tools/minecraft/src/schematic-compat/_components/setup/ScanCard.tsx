"use client";

import { useToolT } from "../../../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon } from "@boffmedia/ui";
import type { SchEnvMode, SchGame, SchRegistry } from "../ui/sch-tokens";

const GAMES_LIST: { id: SchGame; labelKey: string; icon: "cube" | "gamepad" }[] = [
  { id: "minecraft", labelKey: "game.minecraft", icon: "cube" },
  { id: "hytale", labelKey: "game.hytale", icon: "gamepad" },
];

/** Environment capture: game toggle · folder pick or vanilla version · result. */
export function ScanCard({
  role,
  roleLabel,
  game,
  onGame,
  registry,
  scanning = false,
  progress = 0,
  onPick,
  mode = "instance",
  onMode,
  versions,
  version,
  onVersion,
}: {
  role: "source" | "target";
  roleLabel: string;
  game: SchGame;
  onGame: (id: SchGame) => void;
  registry?: SchRegistry | null;
  scanning?: boolean;
  progress?: number;
  onPick: () => void;
  /** "instance" scans a game folder; "vanilla" uses a bundled registry. */
  mode?: SchEnvMode;
  /** Omit to hide the mode toggle entirely (games with no bundled registries). */
  onMode?: (m: SchEnvMode) => void;
  versions?: readonly string[];
  version?: string;
  onVersion?: (v: string) => void;
}) {
  const t = useToolT("tools.schematicCompat");
  const vanilla = mode === "vanilla";
  return (
    <div
      className={cn(
        "flex flex-col gap-[10px] p-3 bg-panel border border-solid transition-[border-color] duration-[140ms]",
        "border-l-[3px]",
        role === "target" ? "border-l-signal" : "border-l-accent",
        registry ? "border-[color-mix(in_srgb,var(--ok)_40%,var(--line))]" : "border-line",
      )}
    >
      {/* top: role + game toggle */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] uppercase text-txt-muted">
          <span className={cn("w-1.5 h-1.5 shrink-0", role === "target" ? "bg-signal" : "bg-accent")} />
          {roleLabel}
        </span>
        <div
          className="ml-auto inline-flex gap-0.5 p-0.5 border border-line bg-base"
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
                "inline-flex items-center gap-1 py-1 px-[7px] font-mono text-[10.5px]",
                "cursor-pointer transition-colors duration-[140ms] disabled:opacity-50 disabled:cursor-default",
                game === g.id
                  ? "bg-panel-2 text-txt shadow-[inset_0_0_0_1px_var(--line-2)]"
                  : "text-txt-dim enabled:hover:text-txt-muted",
              )}
            >
              <Icon name={g.icon} size={12} />
              {t(g.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* environment source: scan a folder, or pick a bundled vanilla version */}
      {onMode && (
        <div className="inline-flex gap-0.5 p-0.5 border border-line bg-base" role="group">
          {(["instance", "vanilla"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              disabled={scanning}
              onClick={() => onMode(m)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1 py-1 px-[7px] font-mono text-[10.5px]",
                "cursor-pointer transition-colors duration-[140ms] disabled:opacity-50 disabled:cursor-default",
                mode === m
                  ? "bg-panel-2 text-txt shadow-[inset_0_0_0_1px_var(--line-2)]"
                  : "text-txt-dim enabled:hover:text-txt-muted",
              )}
            >
              <Icon name={m === "vanilla" ? "cube" : "folder"} size={12} />
              {m === "vanilla" ? t("setup.modeVanilla") : t("setup.modeInstance")}
            </button>
          ))}
        </div>
      )}

      {/* pick */}
      {vanilla ? (
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-txt-dim">
            {t("setup.vanillaVersion")}
          </span>
          <select
            value={version ?? ""}
            disabled={scanning}
            onChange={(e) => onVersion?.(e.target.value)}
            className={cn(
              "w-full p-[9px] bg-base border border-solid border-line-2 font-mono text-[12.5px] text-txt",
              "cursor-pointer transition-[border-color] duration-[140ms]",
              "hover:border-accent-line disabled:opacity-60 disabled:cursor-default",
            )}
          >
            {(versions ?? []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <button
          type="button"
          disabled={scanning}
          onClick={onPick}
          className={cn(
            "flex items-center justify-center gap-2 p-[9px] w-full bg-base border border-dashed border-line-2",
            "text-txt-muted text-[13px] cursor-pointer transition-[border-color,color] duration-[140ms]",
            "enabled:hover:border-accent-line enabled:hover:text-txt disabled:opacity-60 disabled:cursor-default",
          )}
        >
          <Icon name="folder" size={15} />
          {scanning ? t("setup.scanningShort") : game === "hytale" ? t("setup.pickHytaleShort") : t("setup.pickInstanceShort")}
        </button>
      )}

      {scanning && (
        <div className="h-1 bg-line overflow-hidden">
          <div className="h-full bg-accent transition-[width] duration-[120ms] ease-linear" style={{ width: progress + "%" }} />
        </div>
      )}

      {/* result */}
      <div className="flex items-start gap-2 text-[12px] leading-[1.5] min-h-[18px]">
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0 mt-1",
            registry ? "bg-ok shadow-[0_0_0_3px_var(--ok-soft)]" : "bg-txt-dim",
          )}
        />
        {registry ? (
          <span className="min-w-0 text-txt-muted">
            {registry.name ? (
              <>
                <b className="text-txt font-semibold">{registry.name}</b> ·{" "}
              </>
            ) : null}
            <code className="font-mono text-[11px] text-accent-bright">{registry.version}</code>
            {registry.loader ? " · " + registry.loader : ""}
            <br />
            {registry.bundled
              ? t("setup.vanillaRegistry")
              : `${registry.mods} ${t("setup.modsLabel")}`}{" "}
            · {registry.blocks.toLocaleString()} {t("setup.blocksLabel")}
          </span>
        ) : (
          <span className="text-txt-dim">{scanning ? progress + "% · " + t("setup.reading") : t("setup.noEnv")}</span>
        )}
      </div>
    </div>
  );
}
