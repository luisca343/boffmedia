import * as React from "react";
import { useLocale, useToolT } from "../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon, type IconName } from "@boffmedia/ui";
import {
  attributeColor,
  attributeDefinition,
  normalizeAttributeKey,
} from "../ui/mh-helpers";
import { MhAttributeIcon } from "../ui/mh-kit";
import type { MhMonster, MhMonsterWeakness } from "../types";
import { mhwildsBestiaryAsset } from "./assets";

export function vulnLabel(w: {
  element?: string;
  status?: string;
  effect?: string;
}): string {
  return w.element ?? w.status ?? w.effect ?? "—";
}
export function vulnColor(w: {
  kind?: string;
  element?: string;
  status?: string;
  effect?: string;
}): string {
  if (w.element) return attributeColor(w.element);
  return attributeColor(w.status ?? w.effect) || "var(--mh)";
}

/** Deterministic species hue so avatars read as families. Cosmetic. */
export function speciesHue(species: string): number {
  let h = 0;
  for (let i = 0; i < species.length; i++)
    h = (h * 31 + species.charCodeAt(i)) % 360;
  return h;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function attributeLabel(
  type: string | undefined,
  t: (key: string) => string,
): string {
  const key = normalizeAttributeKey(type);
  return attributeDefinition(key) ? t(key) : cap(type ?? "—");
}

/* ── threat tiers & species meta (editorial — see [deferred] fields on MhMonster) ── */
// Labels/descriptions are chrome and live under the mhwilds.bestiary.threat
// namespace, keyed by the `key` below and resolved by MhThreatBadge.
// Never resolve them at module scope — that freezes the first locale loaded.
export const THREAT: Record<number, { key: string; color: string }> = {
  1: { key: "low", color: "#7fd6a8" },
  2: { key: "med", color: "#6cc4e8" },
  3: { key: "high", color: "#ffb224" },
  4: { key: "apex", color: "#ff7a33" },
  5: { key: "elder", color: "#b06bff" },
};

export const SPECIES: Record<
  string,
  { label: string; icon: IconName; hue: number }
> = {
  "flying-wyvern": { label: "Wyvern volador", icon: "flame", hue: 8 },
  "bird-wyvern": { label: "Wyvern pájaro", icon: "flame", hue: 12 },
  "brute-wyvern": { label: "Wyvern brutal", icon: "axe", hue: 24 },
  "fanged-wyvern": { label: "Wyvern de colmillos", icon: "bolt", hue: 48 },
  "fanged-beast": { label: "Bestia de colmillos", icon: "paw", hue: 210 },
  amphibian: { label: "Anfibio", icon: "paw", hue: 160 },
  cephalopod: { label: "Cefalópodo", icon: "paw", hue: 300 },
  construct: { label: "Constructo", icon: "axe", hue: 90 },
  "demi-elder": { label: "Semianciano", icon: "sparkles", hue: 250 },
  temnoceran: { label: "Temnoceran", icon: "puzzle", hue: 280 },
  leviathan: { label: "Leviatán", icon: "target", hue: 190 },
  "elder-dragon": { label: "Dragón anciano", icon: "sparkles", hue: 270 },
  machine: { label: "Máquina", icon: "axe", hue: 110 },
  wraith: { label: "Wyvern guardián", icon: "sword", hue: 340 },
};

function speciesMeta(species: string): {
  label: string;
  icon: IconName;
  hue: number;
} {
  return (
    SPECIES[species] ?? {
      label: cap(species.replace(/-/g, " ")),
      icon: "paw",
      hue: speciesHue(species),
    }
  );
}

function localizedSpeciesLabel(
  monster: MhMonster,
  locale: string,
): string | null {
  const names = monster.localData?.identity?.speciesNames;
  const label =
    names?.[locale] ??
    names?.[locale.replaceAll("-", "")] ??
    names?.en ??
    names?.es ??
    names?.es419 ??
    null;
  return label && !label.includes("?") ? label : null;
}

function monsterAssetSlug(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MonsterArt({
  monster,
  alt = "",
  className = "",
  fit = "contain",
}: {
  monster: MhMonster;
  alt?: string;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const species = speciesMeta(monster.species);
  const imagePath =
    monster.localData?.assets?.icon?.png ??
    `monsters/${monsterAssetSlug(monster.name)}/icon.png`;
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => setImageFailed(false), [imagePath]);
  const image = imageFailed ? null : imagePath;
  return (
    <span
      className={cn(
        "relative grid place-items-center overflow-hidden",
        className,
      )}
    >
      {image ? (
        <>
          <img
            src={mhwildsBestiaryAsset(image, monster.localAssetVersion)}
            alt={alt}
            className={cn(
              "relative z-[1] block h-full w-full",
              fit === "cover" ? "object-cover" : "object-contain p-1",
            )}
            onError={() => setImageFailed(true)}
          />
        </>
      ) : (
        <Icon name={species.icon} size={40} />
      )}
    </span>
  );
}

function topWeaknesses(m: MhMonster): MhMonsterWeakness[] {
  return m.weaknesses
    .filter((w) => w.kind === "element")
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
}

/* ── star rating (weakness effectiveness, break impact) ─────────────────────── */
export function MhStars({
  value = 0,
  max = 3,
}: {
  value?: number;
  max?: number;
}) {
  return (
    <span className="inline-flex gap-px" title={`${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size={12}
          className={i < value ? "text-warn" : "text-line-2"}
        />
      ))}
    </span>
  );
}

/* ── threat tier badge ──────────────────────────────────────────────────────── */
export function MhThreatBadge({
  threat,
  showLabel = true,
  size = "md",
}: {
  threat: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const t = useToolT("tools.mhwilds.bestiary.threat");
  const tier = THREAT[threat];
  if (!tier) return null;
  const sm = size === "sm";
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={t(`${tier.key}.desc`)}
    >
      <span className="inline-flex gap-[2px]">
        {[1, 2, 3, 4, 5].map((n) => (
          <i
            key={n}
            className={cn(
              "block",
              sm ? "w-1 h-[0.5625rem]" : "w-[0.3125rem] h-[0.6875rem]",
            )}
            style={{
              transform: "skewX(-12deg)",
              background: n <= threat ? tier.color : "var(--line-2)",
            }}
          />
        ))}
      </span>
      {showLabel && (
        <span
          className={cn(
            "font-mono font-bold leading-none uppercase tracking-[0.06em]",
            sm ? "text-[0.5625rem]" : "text-[0.625rem]",
          )}
          style={{ color: tier.color }}
        >
          {t(`${tier.key}.label`)}
        </span>
      )}
    </span>
  );
}

/* ── species tag ────────────────────────────────────────────────────────────── */
export function MhSpeciesTag({
  species,
  label,
  icon = true,
}: {
  species: string;
  label?: string | null;
  icon?: boolean;
}) {
  const s = speciesMeta(species);
  return (
    <span
      className="inline-flex items-center gap-[0.3125rem] px-2 py-1 border border-solid font-mono text-[0.625rem] font-semibold leading-none uppercase tracking-[0.04em]"
      style={{
        color: `hsl(${s.hue} 45% 74%)`,
        background: `hsl(${s.hue} 45% 40% / 0.14)`,
        borderColor: `hsl(${s.hue} 45% 50% / 0.3)`,
      }}
    >
      {icon && <Icon name={s.icon} size={12} />}
      {label ?? s.label}
    </span>
  );
}

/* ── element badge (weakness / damage recommendation) ───────────────────────── */
export function MhElemBadge({
  element,
  stars,
  muted,
}: {
  element: string;
  stars?: number;
  muted?: boolean;
}) {
  const t = useToolT("tools.mhwilds");
  const color = attributeColor(element);
  const label = attributeLabel(element, t);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-[0.5625rem] py-[0.3125rem] bg-base-2 border border-solid border-line font-mono text-[0.75rem] font-semibold leading-none",
        muted && "opacity-45",
      )}
    >
      <MhAttributeIcon
        type={element}
        size={13}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
      <span>{label}</span>
      {stars != null && <MhStars value={stars} max={3} />}
    </span>
  );
}

/* ── level pips (weakness strength 0–3) ─────────────────────────────────────── */
export function Pips({ level, color }: { level: number; color: string }) {
  return (
    <span className="inline-flex gap-[3px]">
      {[1, 2, 3].map((i) => (
        <i
          key={i}
          className="w-[0.875rem] h-[0.375rem] -skew-x-12 bg-line-2"
          style={i <= level ? { background: color } : undefined}
        />
      ))}
    </span>
  );
}

/* ── weakness dot row (roster) ──────────────────────────────────────────────── */
export function WeakDots({ monster }: { monster: MhMonster }) {
  const t = useToolT("tools.mhwilds");
  const els = monster.weaknesses
    .filter((w) => w.kind === "element" && (w.level ?? 0) >= 2)
    .slice(0, 4);
  if (!els.length) return null;
  return (
    <span className="inline-flex gap-[3px]">
      {els.map((w) => (
        <MhAttributeIcon
          key={w.id}
          type={w.element ?? w.status ?? w.effect}
          size={12}
          title={attributeLabel(w.element ?? w.status ?? w.effect, t)}
        />
      ))}
    </span>
  );
}

/* ── roster: grid card ──────────────────────────────────────────────────────── */
export function MonsterCard({
  m,
  active,
  onClick,
}: {
  m: MhMonster;
  active: boolean;
  onClick: () => void;
}) {
  const t = useToolT("tools.mhwilds.bestiary");
  const tAttr = useToolT("tools.mhwilds");
  const locale = useLocale();
  const s = speciesMeta(m.species);
  const speciesLabel = localizedSpeciesLabel(m, locale);
  const top = topWeaknesses(m).slice(0, 3);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cut-corner cut-corner-edge hover:[--cut-line:var(--line-2)] [--cut-lg:10px] ",
        "flex flex-col text-left bg-panel border border-solid border-line text-inherit cursor-pointer transition-[border-color,transform,box-shadow] duration-[140ms] hover:border-line-2 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-16px_#000]",
        active &&
          "border-[var(--mh)] [--cut-line:var(--mh)] shadow-[0_0_0_1px_var(--mh)]",
      )}
    >
      <div
        className="relative aspect-square w-full grid place-items-center overflow-hidden"
        style={{
          background: `radial-gradient(120% 90% at 70% 10%, hsl(${s.hue} 45% 30% / 0.5), transparent 60%), repeating-linear-gradient(135deg, var(--bg-2) 0 8px, var(--panel-2) 8px 16px)`,
        }}
      >
        <MonsterArt monster={m} className="h-full w-full" fit="cover" alt="" />
        {m.threat != null && (
          <span className="absolute top-[0.4375rem] left-[0.4375rem]">
            <MhThreatBadge threat={m.threat} size="sm" />
          </span>
        )}
        {m.flagship && (
          <span
            className="absolute top-[0.4375rem] right-[0.4375rem] font-mono text-[0.5rem] font-bold leading-none uppercase tracking-[0.05em] text-warn bg-warn-soft border border-solid px-[0.3125rem] py-[3px]"
            style={{
              borderColor: "color-mix(in srgb, var(--warn) 40%, transparent)",
            }}
            title={t("flagshipTitle")}
          >
            ◆ {t("flagship")}
          </span>
        )}
      </div>
      <div className="p-[9px_10px_10px] flex flex-col gap-0.5 min-w-0">
        <div className="font-display text-[0.875rem] font-bold leading-[1.05] uppercase tracking-[0.01em]">
          {m.name}
        </div>
        {m.title && (
          <div className="font-mono text-[0.625rem] font-medium leading-[1.2] text-txt-muted truncate">
            {m.title}
          </div>
        )}
        <div className="flex items-center justify-between gap-1.5 mt-[0.4375rem]">
          <MhSpeciesTag species={m.species} label={speciesLabel} />
          <span className="inline-flex gap-[3px]">
            {top.map((w) => (
              <MhAttributeIcon
                key={w.id}
                type={w.element ?? w.status ?? w.effect}
                size={12}
                title={`${attributeLabel(w.element ?? w.status ?? w.effect, tAttr)} ${w.level ?? 0}★`}
              />
            ))}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── roster: list row ───────────────────────────────────────────────────────── */
export function MonsterRow({
  m,
  active,
  onClick,
}: {
  m: MhMonster;
  active: boolean;
  onClick: () => void;
}) {
  const t = useToolT("tools.mhwilds.bestiary");
  const tAttr = useToolT("tools.mhwilds");
  const locale = useLocale();
  const s = speciesMeta(m.species);
  const speciesLabel = localizedSpeciesLabel(m, locale);
  const top = topWeaknesses(m).slice(0, 3);
  const tc =
    m.threat != null ? (THREAT[m.threat]?.color ?? "var(--mh)") : "var(--mh)";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ borderLeftColor: tc }}
      className={cn(
        "grid grid-cols-[2.125rem_1fr_auto_auto] items-center gap-2.5 w-full text-left p-[8px_10px] bg-panel border border-solid border-line border-l-[3px] text-inherit cursor-pointer transition-[border-color,background] duration-[140ms] hover:bg-panel-2 hover:border-line-2",
        active && "border-[var(--mh)] shadow-[inset_0_0_0_1px_var(--mh)]",
      )}
    >
      <MonsterArt
        monster={m}
        className="w-[2.125rem] h-[2.125rem]"
        fit="cover"
        alt=""
      />
      <span className="min-w-0">
        <span className="flex items-center gap-[0.3125rem] font-display text-[0.8125rem] font-bold leading-[1.1] uppercase tracking-[0.01em]">
          <span className="truncate">{m.name}</span>
          {m.flagship && (
            <span
              className="text-warn text-[0.625rem] flex-none"
              title={t("flagship")}
            >
              ◆
            </span>
          )}
        </span>
        <span className="block font-mono text-[0.625rem] font-medium leading-[1.2] text-txt-dim truncate">
          {speciesLabel ?? s.label}
          {m.locations[0] ? ` · ${m.locations[0].name}` : ""}
        </span>
      </span>
      <span className="inline-flex gap-[3px]">
        {top.map((w) => (
          <MhAttributeIcon
            key={w.id}
            type={w.element ?? w.status ?? w.effect}
            size={12}
            title={attributeLabel(w.element ?? w.status ?? w.effect, tAttr)}
          />
        ))}
      </span>
      {m.threat != null ? (
        <MhThreatBadge threat={m.threat} showLabel={false} size="sm" />
      ) : (
        <span />
      )}
    </button>
  );
}

/* ── detail: element weakness cell ──────────────────────────────────────────── */
export function WeakCell({ w, best }: { w: MhMonsterWeakness; best: boolean }) {
  const t = useToolT("tools.mhwilds");
  const color = vulnColor(w);
  const label = attributeLabel(w.element ?? w.status ?? w.effect, t);
  const immune = (w.level ?? 0) <= 0;
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-2 p-[9px_11px] bg-base-2 border border-solid border-line border-t-2",
        immune && "opacity-50",
      )}
      style={{
        borderTopColor: color,
        ...(best
          ? {
              background: `color-mix(in srgb, ${color} 12%, var(--bg-2))`,
              boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 40%, transparent)`,
            }
          : {}),
      }}
    >
      <MhAttributeIcon
        type={w.element ?? w.status ?? w.effect}
        size={13}
        muted={immune}
      />
      <span className="font-mono text-[0.75rem] text-txt capitalize">
        {label}
      </span>
      <Pips level={w.level ?? 0} color={color} />
      {w.condition && (
        <span className="col-span-full font-mono text-[0.625rem] leading-[1.3] text-warn pl-[1.125rem]">
          {w.condition}
        </span>
      )}
    </div>
  );
}

/* ── detail: status/effect vuln row ─────────────────────────────────────────── */
export function VulnRow({ w }: { w: MhMonsterWeakness }) {
  const t = useToolT("tools.mhwilds");
  const color = vulnColor(w);
  const label = attributeLabel(w.element ?? w.status ?? w.effect, t);
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[0.5625rem] p-[7px_10px] bg-base-2 border border-solid border-line">
      <MhAttributeIcon type={w.element ?? w.status ?? w.effect} size={13} />
      <span className="font-body text-[0.75rem] font-semibold capitalize">
        {label}
      </span>
      <Pips level={w.level ?? 0} color={color} />
    </div>
  );
}

/* ── detail: neutral tag ────────────────────────────────────────────────────── */
export function Tag2({
  children,
  good,
  dot,
  icon,
  attribute,
}: {
  children: React.ReactNode;
  good?: boolean;
  dot?: string;
  icon?: IconName;
  attribute?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 p-[4px_8px] font-mono text-[0.6875rem] leading-none border border-solid",
        good
          ? "text-[var(--mh-bright)] border-[var(--mh-line)] bg-panel"
          : "text-txt-muted bg-base-2 border-line",
      )}
    >
      {attribute ? (
        <MhAttributeIcon type={attribute} size={12} />
      ) : icon ? (
        <Icon name={icon} size={12} style={dot ? { color: dot } : undefined} />
      ) : dot ? (
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ background: dot }}
        />
      ) : null}
      {children}
    </span>
  );
}

/* ── detail: drop row ───────────────────────────────────────────────────────── */
export function chanceTone(pct: number): { cls: string; color: string } {
  if (pct >= 60) return { cls: "hi", color: "var(--ok)" };
  if (pct >= 30) return { cls: "mid", color: "var(--warn)" };
  return { cls: "low", color: "var(--bad)" };
}
