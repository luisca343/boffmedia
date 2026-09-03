"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon, Input, type IconName } from "@boffmedia/ui"
import { DkSprite } from "@boffmedia/ui/datakit";
import { spriteUrl, handleSpriteError } from "../../tracker-core/types";
import type { SpeedTierEntry } from "../../service";
import { Modifiers, hasModifiers } from "../../speedCalc";
import type { Comparison } from "../../speedCalc";

/** Card panel matching the datakit surface (border-line · bg-panel · ◆ header). */
export function SpdPanel({
  title,
  icon,
  aside,
  bodyClassName,
  children,
}: {
  title: React.ReactNode;
  icon?: IconName;
  aside?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 border border-solid border-line bg-panel">
      <header className="flex items-center gap-[0.5rem] border-b border-solid border-line px-[0.875rem] py-[0.625rem]">
        {icon && <Icon name={icon} size={14} className="flex-none text-accent" />}
        <h3 className="m-0 font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.06em]">{title}</h3>
        {aside && <span className="ml-auto flex items-center">{aside}</span>}
      </header>
      <div className={cn("p-[0.875rem]", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Datakit-styled text/number input (cut corner, mono for numbers). */
export function SpdInput({
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  onClear,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  icon?: IconName;
  onClear?: () => void;
  className?: string;
}) {
  const t = useVgcT("speed");
  return (
    // The kit Input is the box; icon and clear button overlay it the way
    // SearchInput does, so the compound keeps the chassis (cut, stroke, focus)
    // without re-declaring it here.
    <div className={cn("relative inline-flex min-w-0", className)}>
      {icon && (
        <Icon name={icon} size={15} className="pointer-events-none absolute left-[0.625rem] top-1/2 -translate-y-1/2 text-txt-dim" />
      )}
      <Input
        size="sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 999 : undefined}
        className={cn(
          type === "number" ? "font-mono tabular-nums" : "font-body",
          icon && "pl-8",
          onClear && "pr-8",
        )}
      />
      {onClear && value && (
        <button
          type="button"
          aria-label={t("clearInput")}
          onClick={onClear}
          className="absolute right-1 top-1/2 grid -translate-y-1/2 place-items-center p-1 text-txt-dim transition-colors hover:text-txt"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

/** Pokémon search box with a live results dropdown; calls onSelect with the entry. */
export function SpdMonSearch({
  speedTiers,
  selectedName,
  onSelect,
  onClear,
  placeholder,
  loading,
}: {
  speedTiers: SpeedTierEntry[];
  selectedName: string;
  onSelect: (entry: SpeedTierEntry) => void;
  onClear: () => void;
  placeholder: string;
  loading?: boolean;
}) {
  const t = useVgcT("speedTiers");
  const [query, setQuery] = useState(selectedName);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(selectedName), [selectedName]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || query === selectedName) return [];
    return speedTiers.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [speedTiers, query, selectedName]);

  return (
    <div className="relative" ref={boxRef}>
      <SpdInput
        icon="search"
        value={query}
        onChange={(v) => {
          setQuery(v);
          setOpen(true);
          if (!v) onClear();
        }}
        onClear={() => {
          setQuery("");
          onClear();
        }}
        placeholder={placeholder}
        className="w-full"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full border border-solid border-line-2 bg-base shadow-xl">
          {loading ? (
            <div className="px-3 py-2 font-mono text-[0.75rem] text-txt-dim">{t("loading")}</div>
          ) : (
            results.map((p) => (
              <button
                key={p.name}
                type="button"
                onMouseDown={() => {
                  onSelect(p);
                  setQuery(p.name);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-panel-2"
              >
                <DkSprite src={spriteUrl(p.name)} alt={p.name} size={24} onError={handleSpriteError} />
                <span className="text-[0.8125rem] text-txt">{p.name}</span>
                <span className="ml-auto font-mono text-[0.6875rem] text-txt-dim">{p.baseSpeed}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const BOOST_STEPS = [-2, -1, 1, 2, 3] as const;

/** Speed modifier row: stat-stage steps + Tailwind/Scarf/Paralysis flags + clear. */
export function SpdModifiers({ modifiers, onChange }: { modifiers: Modifiers; onChange: (m: Modifiers) => void }) {
  const t = useVgcT("speed.modifiers");
  const toggleBoost = (n: number) => onChange({ ...modifiers, boost: modifiers.boost === n ? 0 : n });
  const toggleFlag = (key: "tailwind" | "scarf" | "paralysis") => onChange({ ...modifiers, [key]: !modifiers[key] });
  const active = hasModifiers(modifiers);

  const flag = (key: "tailwind" | "scarf" | "paralysis", label: string, title: string, onCls: string) => (
    <button
      type="button"
      onClick={() => toggleFlag(key)}
      title={title}
      className={cn(
        "border border-solid px-[0.5625rem] py-[0.25rem] font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.06em] transition-[color,background,border-color]",
        modifiers[key] ? onCls : "border-line-2 text-txt-muted hover:text-txt",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border border-solid border-line bg-base-2 px-[0.625rem] py-[0.5rem]">
      <span className="font-mono text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">{t("title")}</span>
      <div className="flex items-center gap-1">
        {BOOST_STEPS.map((n) => {
          const on = modifiers.boost === n;
          const pos = n > 0;
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggleBoost(n)}
              title={t("boostTitle", { n })}
              className={cn(
                "border border-solid px-[0.4375rem] py-[3px] font-mono text-[0.625rem] font-bold leading-none transition-[color,background,border-color]",
                on
                  ? pos
                    ? "border-ok/50 bg-ok/15 text-ok"
                    : "border-bad/50 bg-bad/15 text-bad"
                  : "border-transparent text-txt-muted hover:text-txt",
              )}
            >
              {n > 0 ? `+${n}` : n}
            </button>
          );
        })}
      </div>
      <span className="hidden h-4 w-px bg-line-2 sm:block" />
      <div className="flex items-center gap-1">
        {flag("tailwind", t("tailwindShort"), t("tailwind"), "border-signal/50 bg-signal/15 text-signal")}
        {flag("scarf", t("scarfShort"), t("scarf"), "border-accent-line bg-accent-soft text-accent-bright")}
        {flag("paralysis", t("paralysisShort"), t("paralysis"), "border-warn/50 bg-warn/15 text-warn")}
      </div>
      {active && (
        <button
          type="button"
          onClick={() => onChange({ boost: 0, tailwind: false, scarf: false, paralysis: false })}
          title={t("clear")}
          className="ml-auto grid place-items-center p-1 text-txt-dim transition-colors hover:text-bad"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

// ── Zone (faster / tie / slower) presentation helpers ────────────────────────
export const ZONE_TEXT: Record<Comparison, string> = {
  faster: "text-bad",
  tie: "text-warn",
  slower: "text-ok",
};

export const ZONE_LEFT: Record<Comparison, string> = {
  faster: "border-l-bad",
  tie: "border-l-warn",
  slower: "border-l-ok",
};

export const ZONE_CHIP: Record<Comparison, string> = {
  faster: "border-bad/40 bg-bad/10 text-bad",
  tie: "border-warn/40 bg-warn/10 text-warn",
  slower: "border-ok/40 bg-ok/10 text-ok",
};

export const ZONE_MARK: Record<Comparison, string> = { faster: "▲", tie: "=", slower: "▼" };
