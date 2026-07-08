"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button, Badge, Icon } from "@/components/boffmedia/primitives";

// =============================================================================
// v3 «Señal» — Schematic Compat · route-local kit (Minecraft · Hytale).
//   Faithful Tailwind port of the handoff `sch-*` design, token-driven (theme ·
//   accent · cut). Consumes the real engine shapes via the wrapper components;
//   no mock data. The whole graphite/steel/brand-orange broadcast look lives
//   here so the tool pages stay thin.
// =============================================================================

export type SchStatus = "safe" | "renamed" | "state-changed" | "missing" | "mod-only";
export type SchGame = "minecraft" | "hytale";
export type SchRing = "safe" | "warn" | "bad" | null;
export type BulkAction = "skip" | "remap" | "air";

export interface SchBlock {
  id: string;
  namespace: string;
  states?: Record<string, string>;
}
export interface SchDiffEntry {
  block: SchBlock;
  status: SchStatus;
  instanceCount: number;
  autoCandidate?: string;
  incompatibleStates?: string[];
}
export interface SchRegistry {
  name?: string | null;
  version: string;
  loader?: string;
  mods: number;
  blocks: number;
}
export interface BulkNsGroup {
  namespace: string;
  entries: unknown[];
  remap: number;
}
export interface FilterChip {
  key: SchStatus;
  label: string;
  count: number;
}

/** Optional real-texture thumb renderer; falls back to {@link AssetThumb}. */
export type ThumbRenderer = (id: string, size: number, ring?: SchRing) => ReactNode;

// ── deterministic placeholder (matches the engine BlockThumb fallback) ────────
export function placeholderColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `oklch(0.55 0.12 ${h % 360})`;
}
export function placeholderGlyph(id: string): string {
  const name = id.includes(":") ? id.split(":")[1] : id;
  return (name[0] || "?").toUpperCase();
}

// ── semantic tone → concrete v3 classes ──────────────────────────────────────
type Tone = "ok" | "warn" | "bad" | "accent" | "dim";
const TONE: Record<Tone, { fg: string; soft: string; bd: string; dot: string; cssVar: string }> = {
  ok: { fg: "text-ok", soft: "bg-ok-soft", bd: "border-ok", dot: "bg-ok", cssVar: "var(--ok)" },
  warn: { fg: "text-warn", soft: "bg-warn-soft", bd: "border-warn", dot: "bg-warn", cssVar: "var(--warn)" },
  bad: { fg: "text-bad", soft: "bg-bad-soft", bd: "border-bad", dot: "bg-bad", cssVar: "var(--bad)" },
  accent: { fg: "text-accent-bright", soft: "bg-accent-soft", bd: "border-accent-line", dot: "bg-accent", cssVar: "var(--accent)" },
  dim: { fg: "text-txt-dim", soft: "bg-panel-2", bd: "border-line-2", dot: "bg-txt-dim", cssVar: "var(--dim)" },
};

export const STATUS_META: Record<SchStatus, { ring: SchRing; tone: Tone }> = {
  safe: { ring: "safe", tone: "ok" },
  renamed: { ring: "warn", tone: "warn" },
  "state-changed": { ring: "warn", tone: "warn" },
  missing: { ring: "bad", tone: "bad" },
  // Mod-only shares the "missing" red treatment; a "mod" pill distinguishes it.
  "mod-only": { ring: "bad", tone: "bad" },
};

const RING_VAR: Record<Exclude<SchRing, null>, string> = {
  safe: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
};

const POP_SHADOW = "shadow-[0_20px_46px_-18px_var(--shadow-color)]";

// =============================================================================
//  AssetThumb — deterministic block tile (colour by id hash + initial).
// =============================================================================
export function AssetThumb({ id, size = 28, ring }: { id: string; size?: number; ring?: SchRing }) {
  const style: CSSProperties = {
    width: size,
    height: size,
    background: placeholderColor(id),
    fontSize: Math.round(size * 0.42),
    boxShadow: ring ? `0 0 0 1.5px color-mix(in srgb, ${RING_VAR[ring]} 60%, transparent)` : undefined,
  };
  return (
    <div
      title={id}
      className="relative shrink-0 overflow-hidden border border-line grid place-items-center font-extrabold text-white/90 [image-rendering:pixelated]"
      style={style}
    >
      {placeholderGlyph(id)}
    </div>
  );
}

// =============================================================================
//  Stepper — linear progress: done = check, active = accent, pending = grey.
// =============================================================================
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="inline-flex items-center shrink-0" role="list">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle";
        return (
          <Fragment key={s}>
            {i > 0 && <span className="w-[22px] h-px bg-line-2 shrink-0" />}
            <span
              role="listitem"
              className={cn(
                "inline-flex items-center gap-2 py-[6px] px-[9px] whitespace-nowrap",
                state === "active" ? "text-txt" : state === "done" ? "text-txt-muted" : "text-txt-dim",
              )}
            >
              <span
                className={cn(
                  "cut-tag [--cut-tag:5px] grid place-items-center w-5 h-5 shrink-0 border border-solid",
                  "font-mono text-[10px] font-semibold transition-[background,border-color,color] duration-[140ms]",
                  state === "idle" && "border-line-2 bg-panel text-txt-muted",
                  state === "done" && "text-ok bg-ok-soft border-ok",
                  state === "active" && "text-accent-ink bg-accent border-accent",
                )}
              >
                {state === "done" ? <Icon name="check" size={11} /> : i + 1}
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase font-semibold max-[1100px]:hidden">
                {s}
              </span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

// =============================================================================
//  CompatMeter — «N de M resueltos» readiness ring (new «Señal» piece).
// =============================================================================
export function CompatMeter({
  resolved,
  total,
  blocked,
  size = 64,
}: {
  resolved: number;
  total: number;
  blocked: number;
  size?: number;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const tone: Tone = blocked > 0 ? "warn" : pct >= 100 ? "ok" : "accent";
  return (
    <div className="relative flex items-center gap-3 shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="block shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="4" fill="none" style={{ stroke: "var(--line-2)" }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-500"
          style={{ stroke: TONE[tone].cssVar }}
        />
      </svg>
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-baseline justify-center gap-px pointer-events-none"
        style={{ width: size }}
      >
        <b className="font-display italic font-extrabold text-[22px] text-txt leading-none">{pct}</b>
        <small className="font-mono text-[10px] text-txt-dim">%</small>
      </div>
      <div className="flex flex-col gap-[3px] min-w-0">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-txt-muted">{t("meter.label")}</span>
        <span className="text-[12.5px] text-txt-dim">
          <b className="text-txt font-semibold">{resolved}</b>/{total} {t("meter.resolved")}
          {blocked > 0 ? (
            <>
              {" · "}
              <span className="text-warn">{t("meter.blocked", { count: blocked })}</span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
//  ScanCard — environment capture: game toggle · folder pick · scan · result.
// =============================================================================
const GAMES_LIST: { id: SchGame; label: string; icon: "cube" | "gamepad" }[] = [
  { id: "minecraft", label: "Minecraft", icon: "cube" },
  { id: "hytale", label: "Hytale", icon: "gamepad" },
];

export function ScanCard({
  role,
  roleLabel,
  game,
  onGame,
  registry,
  scanning = false,
  progress = 0,
  onPick,
}: {
  role: "source" | "target";
  roleLabel: string;
  game: SchGame;
  onGame: (id: SchGame) => void;
  registry?: SchRegistry | null;
  scanning?: boolean;
  progress?: number;
  onPick: () => void;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
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
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* pick */}
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
            {registry.mods} {t("setup.modsLabel")} · {registry.blocks.toLocaleString()} {t("setup.blocksLabel")}
          </span>
        ) : (
          <span className="text-txt-dim">{scanning ? progress + "% · " + t("setup.reading") : t("setup.noEnv")}</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
//  DropZone — schematic loader: empty / dragging / loaded.
// =============================================================================
export interface DropZoneFile {
  name: string;
  size: string;
  dims: string;
}
export function DropZone({ file, onPick }: { file?: DropZoneFile | null; onPick: () => void }) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const [over, setOver] = useState(false);

  if (file) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick())}
        className="flex flex-row items-center gap-2.5 text-left cursor-pointer p-3 bg-panel border border-solid border-[color-mix(in_srgb,var(--ok)_40%,var(--line))]"
      >
        <Icon name="cube" size={20} className="text-ok shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[12.5px] text-txt font-semibold truncate">{file.name}</div>
          <div className="font-mono text-[10.5px] text-txt-dim">
            {file.size} · {file.dims}
          </div>
        </div>
        <Badge tone="ok">{t("setup.loaded")}</Badge>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick())}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onPick();
      }}
      className={cn(
        "flex flex-col items-center gap-1.5 text-center cursor-pointer py-5 px-3.5 bg-panel border border-dashed",
        "transition-[border-color,background] duration-[140ms]",
        over ? "border-accent bg-accent-soft" : "border-line-2 hover:border-accent hover:bg-accent-soft",
      )}
    >
      <Icon name="upload" size={22} className={over ? "text-accent-bright" : "text-txt-dim"} />
      <div className="text-[14px] font-semibold text-txt">{t("setup.dropHere")}</div>
      <div className="font-mono text-[10.5px] tracking-[0.04em] text-txt-dim">.schem · .litematic · .nbt · .mca · .prefab</div>
    </div>
  );
}

// =============================================================================
//  FilterChips — count chips that filter the diff by status.
// =============================================================================
export function FilterChips({
  chips,
  active,
  onToggle,
}: {
  chips: FilterChip[];
  active: SchStatus | null;
  onToggle: (key: SchStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[7px]" role="group">
      {chips.map((c) => {
        const on = active === c.key;
        const dim = active !== null && !on;
        const tone = TONE[STATUS_META[c.key].tone];
        return (
          <button
            key={c.key}
            type="button"
            title={c.label}
            disabled={c.count === 0}
            aria-pressed={on}
            onClick={() => onToggle(c.key)}
            className={cn(
              "flex items-center gap-[7px] py-[5px] px-2.5 bg-panel border border-solid text-[12px] cursor-pointer",
              "transition-[opacity,border-color,background] duration-[140ms] disabled:opacity-[0.32] disabled:cursor-default",
              on ? cn(tone.bd, tone.soft) : "border-line enabled:hover:border-line-2",
              dim && "opacity-[0.42]",
            )}
          >
            <span className={cn("w-[7px] h-[7px] shrink-0", tone.dot)} />
            <span className={cn("font-mono text-[12px] font-bold tabular-nums", tone.fg)}>{c.count}</span>
            <span className={on ? "text-txt" : "text-txt-dim"}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
//  ReplaceSelect — searchable block combobox (fixed popover escapes overflow).
// =============================================================================
interface PopPos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}
export function ReplaceSelect({
  value,
  placeholder,
  options,
  onChange,
  renderThumb,
  fluid,
}: {
  value?: string;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
  renderThumb?: ThumbRenderer;
  fluid?: boolean;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const thumb = (id: string, size: number) => renderThumb?.(id, size) ?? <AssetThumb id={id} size={size} />;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<PopPos | null>(null);
  const trigRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => o.toLowerCase().includes(s)) : options;
  }, [q, options]);

  function place() {
    const el = trigRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(Math.max(r.width, 520), window.innerWidth - 16);
    const openUp = window.innerHeight - r.bottom < 420;
    setPos({
      left: Math.min(r.left, window.innerWidth - w - 8),
      width: w,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
    });
  }
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setQ("");
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (trigRef.current && !trigRef.current.contains(el) && !el.closest(".sch-cmb-pop")) setOpen(false);
    };
    const onScroll = (e: Event) => {
      const el = e.target as Node;
      if (el instanceof Element && el.closest(".sch-cmb-pop")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className={cn("relative", fluid ? "min-w-0 flex-1" : "w-[168px] shrink-0")} ref={trigRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "w-full h-[30px] flex items-center gap-1.5 px-2 bg-base border border-solid cursor-pointer transition-[border-color] duration-[140ms]",
          open ? "border-accent-line" : "border-line hover:border-accent-line",
        )}
      >
        {value ? thumb(value, 18) : null}
        <span className={cn("flex-1 min-w-0 font-mono text-[11px] text-left truncate", value ? "text-txt" : "text-txt-dim")}>
          {value || placeholder}
        </span>
        <Icon
          name="chevronDown"
          size={13}
          className="text-txt-dim shrink-0 transition-transform duration-[140ms]"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && pos ? (
        <div
          className={cn("sch-cmb-pop fixed z-[900] flex flex-col max-h-[420px] overflow-hidden bg-panel border border-line-2", POP_SHADOW)}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 py-2 px-2.5 border-b border-line text-txt-dim shrink-0">
            <Icon name="search" size={13} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("diff.searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-txt font-mono text-[12px] placeholder:text-txt-dim"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-txt-dim text-[12px]">{t("diff.noResults")}</div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1.5">
                {filtered.map((o) => {
                  const name = o.includes(":") ? o.slice(o.indexOf(":") + 1) : o;
                  const sel = o === value;
                  return (
                    <button
                      key={o}
                      type="button"
                      title={o}
                      onClick={() => {
                        onChange(o);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex flex-col items-center gap-1 py-2 px-1 border border-solid cursor-pointer",
                        "font-mono text-[10px] leading-tight text-center transition-[background,border-color,color] duration-[140ms]",
                        sel ? "border-accent-line bg-accent-soft text-accent-bright" : "border-transparent text-txt-muted hover:bg-panel-2 hover:text-txt",
                      )}
                    >
                      {thumb(o, 48)}
                      <span className="w-full truncate">{name}</span>
                      {sel ? <Icon name="check" size={12} className="absolute top-1 right-1 text-accent-bright" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="shrink-0 p-2 border-0 border-t border-line bg-transparent text-txt-dim font-mono text-[10.5px] cursor-pointer transition-colors hover:text-bad"
            >
              {t("diff.clearSelection")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// =============================================================================
//  MappingCard — verbose mapping (source → target thumb, states, replace row).
// =============================================================================
export function MappingCard({
  entry,
  options,
  resolution,
  onResolve,
  selected,
  onSelect,
  renderThumb,
}: {
  entry: SchDiffEntry;
  options: string[];
  resolution?: string;
  onResolve: (blockId: string, target: string) => void;
  selected?: boolean;
  onSelect?: () => void;
  renderThumb?: ThumbRenderer;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const meta = STATUS_META[entry.status];
  const tone = TONE[meta.tone];
  const auto = entry.autoCandidate;
  const effective = resolution || auto;
  const replaceable = entry.status !== "safe";
  const isModOnly = entry.status === "mod-only";
  const stateKeys = Object.keys(entry.block.states || {});
  const thumb = (id: string, size: number, ring?: SchRing) => renderThumb?.(id, size, ring) ?? <AssetThumb id={id} size={size} ring={ring} />;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect?.())}
      style={{ borderLeftColor: tone.cssVar }}
      className={cn(
        "p-2.5 border border-solid border-l-[3px] cursor-pointer transition-[background,border-color] duration-[140ms]",
        selected ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent-line)]" : "border-line bg-panel hover:bg-panel-2",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          {thumb(entry.block.id, 42, meta.ring)}
          {effective ? (
            <div className="flex items-center gap-1.5 self-center shrink-0 text-txt-dim">
              <Icon name="arrow" size={16} />
              {thumb(effective, 34)}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tone.dot)} />
              <span className="font-mono text-[12px] text-txt truncate">{entry.block.id}</span>
              {isModOnly ? (
                <span className="shrink-0 py-[1px] px-1.5 font-mono text-[9px] font-bold tracking-[0.08em] uppercase bg-bad-soft text-bad border border-solid border-[color-mix(in_srgb,var(--bad)_35%,transparent)]">
                  mod
                </span>
              ) : null}
            </div>
            {effective ? (
              <div className={cn("font-mono text-[11px] pl-[13px] mt-0.5 truncate", resolution ? "text-accent-bright" : "text-[color:color-mix(in_srgb,var(--ok)_85%,var(--text))]")}>
                → {effective}
                {resolution ? " · " + t("diff.manual") : ""}
              </div>
            ) : null}
            <div className="pl-[13px] mt-[3px] text-[11px] text-txt-dim">{t("diff.instances", { count: entry.instanceCount })}</div>
            {stateKeys.length > 0 ? (
              <div className="flex flex-wrap gap-[5px] pl-[13px] mt-[7px]">
                {stateKeys.map((k) => {
                  const bad = entry.incompatibleStates?.includes(k);
                  return (
                    <span key={k} className={cn("py-[2px] px-1.5 font-mono text-[10px]", bad ? "bg-bad-soft text-bad" : "bg-panel-2 text-txt-muted")}>
                      {k}={String(entry.block.states?.[k])}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {replaceable ? (
          <div className="flex items-center gap-2 pl-[13px]" onClick={(e) => e.stopPropagation()}>
            <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-txt-dim shrink-0">{t("diff.replace")}</span>
            <ReplaceSelect fluid value={resolution} placeholder={auto || t("diff.choose")} options={options} onChange={(v) => onResolve(entry.block.id, v)} renderThumb={renderThumb} />
            {resolution ? (
              <button
                type="button"
                onClick={() => onResolve(entry.block.id, "")}
                className="bg-transparent border-0 text-txt-dim font-mono text-[10px] cursor-pointer underline underline-offset-2 shrink-0 hover:text-txt-muted"
              >
                {auto ? t("diff.auto") : t("diff.clear")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// =============================================================================
//  AxisSlider — layer crop slider (Y by default).
// =============================================================================
export function AxisSlider({ axis = "Y", value, max, onChange }: { axis?: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="shrink-0 flex items-center gap-2.5 py-[9px] px-3 border-t border-line">
      <span className="font-mono text-[11px] font-bold text-accent-bright w-3.5 text-center shrink-0">{axis}</span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${axis}`}
        className="flex-1 h-1 cursor-pointer [accent-color:var(--accent)]"
      />
      <span className="font-mono text-[11px] text-txt-muted w-11 text-right tabular-nums shrink-0">
        {value}/{max}
      </span>
    </div>
  );
}

// =============================================================================
//  BulkRulesSheet — resolve missing blocks by namespace in one pass.
// =============================================================================
export function BulkRulesSheet({
  open,
  groups,
  onClose,
  onApply,
}: {
  open: boolean;
  groups: BulkNsGroup[];
  onClose: () => void;
  onApply: (actions: Record<string, BulkAction>) => void;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const acts: [BulkAction, string][] = [
    ["skip", t("diff.bulkAction.skip")],
    ["remap", t("diff.bulkAction.remap")],
    ["air", t("diff.bulkAction.air")],
  ];
  const [actions, setActions] = useState<Record<string, BulkAction>>({});
  useEffect(() => {
    if (!open) setActions({});
  }, [open]);
  if (!open) return null;
  const set = (ns: string, a: BulkAction) => setActions((p) => ({ ...p, [ns]: a }));
  const canApply = Object.values(actions).some((a) => a && a !== "skip");

  return (
    <div className="fixed inset-0 z-[950] flex justify-end bg-scrim" onClick={onClose}>
      <aside
        className={cn("relative w-[min(440px,100%)] h-full flex flex-col bg-panel border-l-2 border-accent", POP_SHADOW, "animate-[bm-drawer-in_0.24s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("diff.bulkRulesTitle")}
      >
        <header className="relative py-[18px] px-[18px] border-b border-line">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("diff.close")}
            className="absolute top-3.5 right-3.5 bg-transparent border-0 text-txt-dim cursor-pointer p-1 hover:text-txt"
          >
            <Icon name="x" size={16} />
          </button>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent-bright">{t("diff.bulkRules")}</span>
          <h3 className="font-display italic font-extrabold text-[24px] my-[5px] text-txt not-italic">{t("diff.bulkRulesTitle")}</h3>
          <p className="text-[13px] text-txt-muted m-0 max-w-[40ch]">{t("diff.bulkRulesDesc")}</p>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto py-3.5 px-[18px] flex flex-col gap-2.5">
          {groups.map((g) => {
            const a = actions[g.namespace] || "skip";
            const would = a === "air" ? g.entries.length : a === "remap" ? g.remap : 0;
            return (
              <div key={g.namespace} className="border border-line bg-base-2 p-[11px]">
                <div className="flex items-center justify-between gap-2 mb-[9px]">
                  <span className="flex items-center gap-2">
                    <AssetThumb id={g.namespace + ":block"} size={20} />
                    <span className="font-mono text-[13px] font-semibold text-txt">{g.namespace}</span>
                    <span className="font-mono text-[10px] py-px px-1.5 bg-panel-2 text-txt-muted">{g.entries.length}</span>
                  </span>
                  {a !== "skip" && would > 0 ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-ok">
                      <Icon name="check" size={11} />
                      {t("diff.bulkWouldResolve", { count: would })}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {acts.map(([k, lbl]) => {
                    const disabled = k === "remap" && g.remap === 0;
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={disabled}
                        onClick={() => set(g.namespace, k)}
                        className={cn(
                          "py-[7px] px-1 font-mono text-[11px] border border-solid cursor-pointer transition-[color,border-color,background] duration-[140ms]",
                          "disabled:opacity-40 disabled:cursor-not-allowed",
                          a === k ? "border-accent bg-accent-soft text-accent-bright" : "border-line text-txt-muted enabled:hover:border-line-2 enabled:hover:text-txt",
                        )}
                      >
                        {lbl}
                        {k === "remap" && g.remap > 0 ? ` (${g.remap})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="shrink-0 flex items-center justify-end gap-2.5 py-3 px-[18px] border-t border-line">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("diff.bulkCancel")}
          </Button>
          <Button variant="pri" size="sm" icon="check" disabled={!canApply} onClick={() => onApply(actions)}>
            {t("diff.bulkApply")}
          </Button>
        </footer>
      </aside>
    </div>
  );
}

// =============================================================================
//  ExportBar — footer: meter · rule import/export · format · export.
// =============================================================================
const FMT: Record<SchGame, [string, string][]> = {
  minecraft: [
    [".schem (v2)", "schem"],
    [".schem (v3)", "schem3"],
    [".litematic", "litematic"],
    [".nbt", "nbt"],
  ],
  hytale: [[".prefab.json", "prefab"]],
};

export function ExportBar({
  targetGame,
  canExport,
  ruleCount,
  exporting,
  onExport,
  onImportRules,
  onExportRules,
  meter,
}: {
  targetGame: SchGame;
  canExport: boolean;
  ruleCount: number;
  exporting: boolean;
  onExport: (format: string) => void;
  onImportRules?: () => void;
  onExportRules?: () => void;
  meter?: ReactNode;
}) {
  const t = useTranslations("games.minecraft.schematicCompat");
  const formats = FMT[targetGame] || FMT.minecraft;
  const [fmt, setFmt] = useState(formats[0][1]);
  useEffect(() => {
    if (!formats.some((f) => f[1] === fmt)) setFmt(formats[0][1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetGame]);

  return (
    <footer className="shrink-0 flex items-center flex-wrap gap-3.5 py-2.5 px-4 bg-base-deep border-t-2 border-line">
      {meter}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon="upload" onClick={onImportRules}>
          {t("export.importRules")}
        </Button>
        <Button variant="ghost" size="sm" icon="download" disabled={ruleCount === 0} onClick={onExportRules}>
          {t("export.exportRules")}
          {ruleCount > 0 ? ` (${ruleCount})` : ""}
        </Button>
      </div>

      <div className="flex-1" />

      {exporting ? (
        <span className="inline-flex items-center gap-2 font-mono text-[11px] text-accent-bright">
          <span className="w-[13px] h-[13px] rounded-full border-2 border-line-2 border-t-accent animate-spin shrink-0" />
          {t("export.exporting")}
        </span>
      ) : null}

      <select
        value={fmt}
        disabled={exporting}
        onChange={(e) => setFmt(e.target.value)}
        aria-label={t("export.title")}
        className="h-[34px] min-w-[128px] bg-panel border border-solid border-line px-2 font-mono text-[12px] text-txt-muted cursor-pointer focus:outline-none focus:border-accent-line"
      >
        {formats.map(([lbl, v]) => (
          <option key={v} value={v}>
            {lbl}
          </option>
        ))}
      </select>

      <Button variant="pri" size="sm" icon="download" disabled={!canExport || exporting} onClick={() => onExport(fmt)}>
        {t("export.exportSchematic")}
      </Button>
    </footer>
  );
}
