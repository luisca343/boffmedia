"use client";

import * as React from "react";
import { useLocale, useToolT } from "../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon, Empty, Spinner, ToolTitle } from "@boffmedia/ui";
import {
  MhApp,
  MhBar,
  MhBody,
  MhSeal,
  MhSearch,
  MhPanel,
  MhLabel,
  MhLoadError,
  MhTypeChip,
} from "../ui/mh-kit";
import { elementColor } from "../ui/mh-helpers";
import type {
  MhMonster,
  MhWildsAnatomySlot,
  MhWildsHitzone,
  MhWildsPartData,
} from "../types";
import { mhwildsBestiaryAsset, mhwildsItemIconAsset } from "./assets";
import { anatomyCalloutTarget } from "./anatomy-geometry";
import { useMonsters } from "./useMonsters";
import {
  MonsterCard,
  MonsterRow,
  MonsterArt,
  WeakCell,
  VulnRow,
  Tag2,
  chanceTone,
  vulnColor,
  vulnLabel,
} from "./bst-kit";

type View = "grid" | "list";
type Sort = "name" | "health";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

type BestiaryTranslate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

type DropGroup = {
  key: string;
  name: string;
  rarity: number;
  iconKind?: string;
  iconColor?: string;
  conditions: MhMonster["rewards"][number]["conditions"];
};

const DROP_KIND_KEYS: Record<string, string> = {
  carve: "dropCarve",
  carving: "dropCarve",
  reward: "dropReward",
  quest: "dropReward",
  break: "dropBreak",
  broken: "dropBreak",
  track: "dropTrack",
  wound: "dropWound",
  capture: "dropCapture",
};

function dropKindLabel(kind: string, t: BestiaryTranslate): string {
  const normalized = kind.trim().toLowerCase();
  const key =
    DROP_KIND_KEYS[normalized] ??
    (normalized.includes("target")
      ? "dropReward"
      : normalized.includes("break") || normalized.includes("broken")
        ? "dropBreak"
        : normalized.includes("wound")
          ? "dropWound"
          : normalized.includes("capture")
            ? "dropCapture"
            : normalized.includes("carve")
              ? "dropCarve"
              : undefined);
  return key ? t(key) : kind;
}

function breakTargetCount(
  breakData: MhWildsPartData["breaks"][number],
): number | null {
  const value = breakData.maxCount ?? breakData.executeCount;
  return value == null || value < 1 || value >= 9999 ? null : value;
}

function partBreakCount(part: MhWildsPartData): number {
  return Math.max(...part.breaks.map((item) => breakTargetCount(item) ?? 0), 0);
}

function ailmentLabel(a: unknown): string | null {
  if (!a || typeof a !== "object") return null;
  const o = a as Record<string, any>;
  return o.name ?? o.ailment?.name ?? null;
}

function localizedText(
  value: Record<string, string> | null | undefined,
  locale: string,
): string | null {
  return value?.[locale] ?? value?.en ?? value?.es ?? value?.es419 ?? null;
}

export function BestiaryView() {
  const t = useToolT("tools.mhwilds.bestiary");
  const { monsters, loading, error } = useMonsters();

  const [q, setQ] = React.useState("");
  const [view, setView] = React.useState<View>("grid");
  const [sort, setSort] = React.useState<Sort>("name");
  const [species, setSpecies] = React.useState<string | null>(null);
  const [element, setElement] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<string | null>(null);
  const [selId, setSelId] = React.useState<number | null>(null);
  const detailRef = React.useRef<HTMLDivElement>(null);

  // facets
  const speciesList = React.useMemo(() => {
    const m = new Map<string, number>();
    monsters.forEach((x) => m.set(x.species, (m.get(x.species) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [monsters]);

  const elementList = React.useMemo(() => {
    const s = new Set<string>();
    monsters.forEach((x) =>
      x.weaknesses.forEach(
        (w) => w.kind === "element" && w.element && s.add(w.element),
      ),
    );
    return [...s].sort();
  }, [monsters]);

  const filtered = React.useMemo(() => {
    const nq = q.trim().toLowerCase();
    let out = monsters.filter((m) => {
      if (
        nq &&
        !m.name.toLowerCase().includes(nq) &&
        !m.species.toLowerCase().includes(nq)
      )
        return false;
      if (species && m.species !== species) return false;
      if (kind && m.kind !== kind) return false;
      if (
        element &&
        !m.weaknesses.some(
          (w) =>
            w.kind === "element" &&
            w.element === element &&
            (w.level ?? 0) >= 2,
        )
      )
        return false;
      return true;
    });
    out = [...out].sort((a, b) =>
      sort === "health"
        ? (b.baseHealth ?? 0) - (a.baseHealth ?? 0)
        : a.name.localeCompare(b.name),
    );
    return out;
  }, [monsters, q, species, element, kind, sort]);

  // keep a valid selection
  React.useEffect(() => {
    if (!filtered.length) return;
    if (selId == null || !filtered.some((m) => m.id === selId))
      setSelId(filtered[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const selected: MhMonster | undefined = monsters.find((m) => m.id === selId);

  const pick = (m: MhMonster) => {
    setSelId(m.id);
    if (window.matchMedia("(max-width: 1023px)").matches)
      setTimeout(
        () =>
          detailRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        40,
      );
  };

  return (
    <MhApp>
      <MhBar>
        <MhSeal name="paw" />
        <ToolTitle title={t("title")} sub={t("kicker")} />
        {!loading && !error && (
          <span className="ml-auto font-mono text-[0.6875rem] leading-none uppercase tracking-[0.1em] text-txt-dim">
            {t("count", { count: monsters.length })}
          </span>
        )}
      </MhBar>

      <MhBody>
        {loading ? (
          <div className="grid place-items-center py-24">
            <Spinner size={30} className="text-[var(--mh)]" />
          </div>
        ) : error ? (
          <div className="py-16">
            <MhLoadError title={t("errorTitle")} detail={error} />
          </div>
        ) : (
          // Master/detail: the roster is a sticky, self-scrolling column and the
          // detail rides the page scroll — MhApp does not bound their height.
          <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(18.75rem,22.5rem)_minmax(0,1fr)]">
            {/* ── roster ── */}
            {/* `--tool-vh` is the height of the box the host gives a tool. A
                self-scrolling column is the one case a document-layout tool
                cannot express without it: its height must match the SCROLLPORT,
                and only the host knows how tall that is. Falls back to the full
                viewport, which is right for a host that is the whole window. */}
            <div className="flex flex-col min-h-0 lg:sticky lg:top-[calc(var(--tool-sticky-top,0px)_+_var(--tool-bar-h,3.625rem))] lg:h-[calc(var(--tool-vh,100dvh)_-_var(--tool-bar-h,3.625rem))] lg:border-r border-solid border-line bg-base-2">
              <div className="flex flex-col gap-2.5 p-[12px_13px] border-b border-solid border-line">
                <div className="flex gap-2 items-center">
                  <MhSearch
                    value={q}
                    onChange={setQ}
                    placeholder={t("searchPlaceholder")}
                  />
                  <div className="flex border border-solid border-line bg-panel">
                    {(["grid", "list"] as View[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        aria-label={v}
                        className={cn(
                          "w-[2.125rem] h-[1.875rem] grid place-items-center transition-colors",
                          view === v
                            ? "bg-[var(--mh-soft)] text-[var(--mh-bright)]"
                            : "text-txt-dim hover:text-txt",
                        )}
                      >
                        <Icon name={v === "grid" ? "grid" : "list"} size={15} />
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="appearance-none bg-panel border border-solid border-line text-txt cursor-pointer font-mono text-[0.75rem] p-[8px_10px] focus:outline-none focus:border-[var(--mh)]"
                >
                  <option value="name">{t("sortName")}</option>
                  <option value="health">{t("sortHealth")}</option>
                </select>

                {/* kind + species + element filters */}
                <div className="flex flex-col gap-1.5">
                  <MhLabel className="mb-0">{t("filterKind")}</MhLabel>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { v: null, label: t("all") },
                      { v: "large", label: t("kindLarge") },
                      { v: "small", label: t("kindSmall") },
                    ].map((o) => (
                      <MhTypeChip
                        key={String(o.v)}
                        label={o.label}
                        on={kind === o.v}
                        onClick={() => setKind(o.v)}
                      />
                    ))}
                  </div>
                </div>

                {elementList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <MhLabel className="mb-0">{t("filterWeakness")}</MhLabel>
                    <div className="flex flex-wrap gap-1">
                      <MhTypeChip
                        label={t("all")}
                        on={element === null}
                        onClick={() => setElement(null)}
                      />
                      {elementList.map((el) => (
                        <button
                          key={el}
                          onClick={() => setElement(element === el ? null : el)}
                          className={cn(
                            "inline-flex items-center gap-1.5 p-[5px_8px] bg-panel border border-solid font-mono text-[0.6875rem] leading-none capitalize transition-colors",
                            element === el
                              ? "text-txt border-line-2"
                              : "text-txt-muted border-line hover:text-txt",
                          )}
                          style={
                            element === el
                              ? {
                                  borderColor: elementColor(el),
                                  background: `color-mix(in srgb, ${elementColor(el)} 14%, transparent)`,
                                }
                              : undefined
                          }
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: elementColor(el) }}
                          />
                          {el}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-[12px_13px_40px] bm-scroll">
                <div className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim mb-2.5">
                  {t("results", { count: filtered.length })}
                </div>
                {filtered.length === 0 ? (
                  <p className="font-mono text-[0.75rem] text-txt-dim py-6 text-center">
                    {t("noResults")}
                  </p>
                ) : view === "grid" ? (
                  <div className="grid grid-cols-2 gap-[0.5625rem]">
                    {filtered.map((m) => (
                      <MonsterCard
                        key={m.id}
                        m={m}
                        active={m.id === selId}
                        onClick={() => pick(m)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {filtered.map((m) => (
                      <MonsterRow
                        key={m.id}
                        m={m}
                        active={m.id === selId}
                        onClick={() => pick(m)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── detail ── */}
            <div ref={detailRef} className="min-w-0">
              {selected ? <MonsterDetail m={selected} /> : null}
            </div>
          </div>
        )}
      </MhBody>
    </MhApp>
  );
}

function MonsterDetail({ m }: { m: MhMonster }) {
  const t = useToolT("tools.mhwilds.bestiary");
  const locale = useLocale();
  const [selectedPartType, setSelectedPartType] = React.useState<number | null>(
    null,
  );
  const elemWeak = m.weaknesses.filter((w) => w.kind === "element");
  const bestLvl = Math.max(0, ...elemWeak.map((w) => w.level ?? 0));
  const statusVuln = m.weaknesses.filter(
    (w) => w.kind === "status" || w.kind === "effect",
  );
  const ailments = (m.ailments ?? [])
    .map(ailmentLabel)
    .filter(Boolean) as string[];
  const parts = m.localData?.data?.parts ?? [];
  const drops = m.rewards.reduce<DropGroup[]>((groups, reward) => {
    const name = reward.item?.name ?? t("unknownDrop");
    const key = String(reward.item?.id ?? name);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.conditions.push(...(reward.conditions ?? []));
      existing.iconKind ??= reward.item?.icon?.kind;
      existing.iconColor ??= reward.item?.icon?.color;
    } else {
      groups.push({
        key,
        name,
        rarity: reward.item?.rarity ?? 1,
        iconKind: reward.item?.icon?.kind,
        iconColor: reward.item?.icon?.color,
        conditions: [...(reward.conditions ?? [])],
      });
    }
    return groups;
  }, []);
  const dropConditionCount = drops.reduce(
    (total, drop) => total + drop.conditions.length,
    0,
  );

  React.useEffect(() => {
    setSelectedPartType(null);
  }, [m.id]);

  const focusPart = (partType: number) => {
    setSelectedPartType((current) => (current === partType ? null : partType));
  };

  return (
    <div className="p-[clamp(1rem,2.4vw,1.875rem)] flex flex-col gap-4 max-w-[62.5rem]">
      {/* header */}
      <div className="flex flex-wrap items-start gap-4">
        <MonsterArt
          monster={m}
          alt={m.name}
          className="h-[8.75rem] w-[8.75rem] flex-none border border-solid border-line bg-base-2"
          fit="cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-display text-[clamp(1.625rem,4vw,2.375rem)] font-extrabold italic leading-[0.95] uppercase">
              {m.name}
            </h2>
            <Tag2 dot={`hsl(${(m.species.length * 47) % 360} 45% 60%)`}>
              {cap(m.species)}
            </Tag2>
            <Tag2>{m.kind === "large" ? t("kindLarge") : t("kindSmall")}</Tag2>
          </div>
          {m.description && (
            <p className="mt-3 text-txt-muted text-[0.90625rem] leading-[1.55] max-w-[70ch] text-pretty">
              {m.description}
            </p>
          )}
        </div>
      </div>

      {m.localData?.assets?.anatomy?.png && (
        <AnatomyPanel
          monster={m}
          parts={parts}
          locale={locale}
          t={t}
          selectedPartType={selectedPartType}
          onSelectPart={focusPart}
        />
      )}

      {parts.length > 0 && (
        <PartDamagePanel
          parts={parts}
          locale={locale}
          t={t}
          selectedPartType={selectedPartType}
          onSelectPart={focusPart}
        />
      )}

      {/* overview stats */}
      <MhPanel title={t("overview")} icon="target">
        <div className="flex flex-col">
          {m.baseHealth != null && (
            <StatRow k={t("baseHealth")} v={m.baseHealth.toLocaleString()} />
          )}
          {m.size?.base != null && (
            <StatRow k={t("baseSize")} v={`${m.size.base.toFixed(0)}`} />
          )}
          {m.size?.silver != null && (
            <StatRow k={t("crownSilver")} v={`≥ ${m.size.silver.toFixed(0)}`} />
          )}
          {m.size?.gold != null && (
            <StatRow k={t("crownGold")} v={`≥ ${m.size.gold.toFixed(0)}`} />
          )}
          {m.elements && m.elements.length > 0 && (
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 py-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.04em] text-txt-dim">
                {t("elements")}
              </span>
              <span className="flex flex-wrap gap-1.5 justify-end">
                {m.elements.map((el) => (
                  <Tag2 key={el} dot={elementColor(el)}>
                    {cap(el)}
                  </Tag2>
                ))}
              </span>
            </div>
          )}
        </div>
      </MhPanel>

      {/* weaknesses */}
      {elemWeak.length > 0 && (
        <MhPanel title={t("weaknesses")} icon="flame">
          <div className="grid gap-[0.4375rem] [grid-template-columns:repeat(auto-fit,minmax(7.5rem,1fr))]">
            {elemWeak
              .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
              .map((w) => (
                <WeakCell
                  key={w.id}
                  w={w}
                  best={bestLvl > 0 && (w.level ?? 0) === bestLvl}
                />
              ))}
          </div>
        </MhPanel>
      )}

      {/* status / effect vulns */}
      {statusVuln.length > 0 && (
        <MhPanel title={t("statusVulns")} icon="zap">
          <div className="flex flex-col gap-[0.3125rem]">
            {statusVuln
              .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
              .map((w) => (
                <VulnRow key={w.id} w={w} />
              ))}
          </div>
        </MhPanel>
      )}

      {/* resistances */}
      {m.resistances.length > 0 && (
        <MhPanel title={t("resistances")} icon="shield">
          <div className="flex flex-wrap gap-1.5">
            {m.resistances.map((r) => (
              <Tag2 key={r.id} dot={vulnColor(r)}>
                {cap(vulnLabel(r))}
              </Tag2>
            ))}
          </div>
        </MhPanel>
      )}

      {/* ailments inflicted */}
      {ailments.length > 0 && (
        <MhPanel title={t("ailments")} icon="alert">
          <div className="flex flex-wrap gap-1.5">
            {ailments.map((a) => (
              <Tag2 key={a}>{cap(a)}</Tag2>
            ))}
          </div>
        </MhPanel>
      )}

      {/* locations */}
      <MhPanel title={t("locations")} icon="map">
        {m.locations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {m.locations.map((l) => (
              <Tag2 key={l.id} good>
                {l.name}
              </Tag2>
            ))}
          </div>
        ) : (
          <BstNone>{t("noLocations")}</BstNone>
        )}
      </MhPanel>

      {/* drops */}
      <MhPanel
        title={t("drops")}
        icon="gift"
        count={dropConditionCount || undefined}
      >
        {drops.length > 0 ? (
          <div className="grid gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.75fr)] gap-3 px-2.5 font-mono text-[0.59375rem] uppercase tracking-[0.08em] text-txt-dim">
              <span>{t("dropSource")}</span>
              <span className="text-right">{t("dropChance")}</span>
            </div>
            {drops.map((drop) => (
              <div
                key={drop.key}
                className="overflow-hidden border border-solid border-line bg-base-2 shadow-[0_8px_20px_-18px_#000]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-solid border-line bg-panel px-2.5 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <DropItemIcon
                      iconKind={drop.iconKind}
                      iconColor={drop.iconColor}
                      rarity={drop.rarity}
                      version={m.localAssetVersion}
                      alt=""
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-body text-[0.8125rem] font-semibold">
                        {drop.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.5625rem] uppercase tracking-[0.06em] text-txt-dim">
                        {t("rarity")} {drop.rarity}
                      </span>
                    </span>
                  </span>
                </div>
                <div className="divide-y divide-dashed divide-line">
                  {drop.conditions.map((condition) => {
                    const chance = Math.max(
                      0,
                      Math.min(100, condition.chance ?? 0),
                    );
                    const tone = chanceTone(chance);
                    return (
                      <div
                        key={`${drop.key}-${condition.id}`}
                        className="grid grid-cols-[minmax(7rem,1fr)_auto_minmax(7rem,0.7fr)] items-center gap-3 px-2.5 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[0.65625rem] uppercase tracking-[0.04em] text-txt-muted">
                            {condition.rank ? `${condition.rank} · ` : ""}
                            {dropKindLabel(condition.kind, t)}
                          </span>
                          <span className="mt-1 block h-[0.25rem] max-w-[14rem] overflow-hidden bg-base-deep">
                            <span
                              className="block h-full"
                              style={{
                                width: `${chance}%`,
                                background: tone.color,
                              }}
                            />
                          </span>
                        </span>
                        <span className="whitespace-nowrap font-mono text-[0.65625rem] text-txt-dim">
                          {t("dropQuantity")} ×{condition.quantity ?? 1}
                        </span>
                        <span
                          className="text-right font-mono text-[0.75rem] font-bold"
                          style={{ color: tone.color }}
                        >
                          {chance}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <BstNone>{t("noDrops")}</BstNone>
        )}
      </MhPanel>
    </div>
  );
}

function DropItemIcon({
  iconKind,
  iconColor,
  rarity,
  version,
  alt,
}: {
  iconKind?: string;
  iconColor?: string;
  rarity: number;
  version?: string;
  alt: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const rarityColor = `var(--rar${Math.min(8, Math.max(1, rarity))})`;
  const iconSrc = mhwildsItemIconAsset(iconKind, iconColor, version);
  const showImage = iconSrc != null && !failed;
  React.useEffect(() => setFailed(false), [iconSrc]);
  return (
    <span
      className="relative grid h-11 w-11 flex-none place-items-center border border-solid bg-base-deep"
      style={{
        borderColor: `color-mix(in srgb, ${rarityColor} 55%, var(--line))`,
      }}
    >
      {showImage ? (
        <img
          src={iconSrc}
          alt={alt}
          aria-hidden={!alt}
          width={40}
          height={40}
          draggable={false}
          onError={() => setFailed(true)}
          className="block h-full w-full object-contain p-0.5"
        />
      ) : (
        <span
          className="h-3 w-3 rotate-45 border border-solid"
          style={{
            borderColor: rarityColor,
            background: `color-mix(in srgb, ${rarityColor} 70%, transparent)`,
          }}
        />
      )}
      <span
        aria-hidden="true"
        className="absolute bottom-[-1px] right-[-1px] h-1.5 w-1.5 border border-solid bg-base-deep"
        style={{ borderColor: rarityColor }}
      />
    </span>
  );
}

function AnatomyPanel({
  monster,
  parts,
  locale,
  t,
  selectedPartType,
  onSelectPart,
}: {
  monster: MhMonster;
  parts: MhWildsPartData[];
  locale: string;
  t: BestiaryTranslate;
  selectedPartType: number | null;
  onSelectPart: (partType: number) => void;
}) {
  const variant = monster.localData;
  if (!variant?.assets?.anatomy?.png) return null;
  const slots =
    variant.report?.anatomyLayout?.slots.filter(
      (slot) => slot.visible && slot.part?.name,
    ) ?? [];

  return (
    <MhPanel
      title={t("anatomy")}
      icon="crosshair"
      aside={
        <span className="font-mono text-[0.625rem] uppercase text-txt-dim">
          {t("gameSource")}
        </span>
      }
    >
      <div className="grid gap-3 md:grid-cols-[minmax(16rem,23rem)_minmax(0,1fr)] md:items-start">
        <div className="relative isolate aspect-square overflow-hidden border border-solid border-line bg-[#eee2c5] p-1 shadow-[0_14px_28px_-24px_#000]">
          <div className="pointer-events-none absolute inset-2 border border-[#8d7957]/30" />
          <div className="relative h-full w-full overflow-hidden">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {slots.map((slot) => {
                const callout = anatomyCalloutTarget(slot);
                if (!callout) return null;
                const active = selectedPartType === slot.partType;
                return (
                  <g key={`${slot.key}-leader`}>
                    <line
                      x1={callout.anchor.x}
                      y1={callout.anchor.y}
                      x2={callout.target.x}
                      y2={callout.target.y}
                      stroke={active ? "var(--mh-bright)" : "var(--mh)"}
                      strokeWidth={active ? 0.9 : 0.55}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={callout.target.x}
                      cy={callout.target.y}
                      r={active ? 2.3 : 1.5}
                      fill={active ? "var(--mh-bright)" : "var(--mh)"}
                    />
                  </g>
                );
              })}
            </svg>
            <img
              src={mhwildsBestiaryAsset(
                variant.assets.anatomy.png,
                monster.localAssetVersion,
              )}
              alt={t("anatomyAlt", { name: monster.name })}
              className="block h-full w-full object-contain"
            />
            {slots.map((slot, slotIndex) => {
              const callout = anatomyCalloutTarget(slot);
              if (!callout) return null;
              const name =
                localizedText(slot.part?.name, locale) ?? t("unknownPart");
              const active = selectedPartType === slot.partType;
              return (
                <button
                  key={`${slot.key}-marker`}
                  type="button"
                  title={name}
                  aria-label={name}
                  aria-pressed={active}
                  onClick={() => onSelectPart(slot.partType)}
                  className={cn(
                    "absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-[0.5625rem] font-bold shadow-[0_0_0_2px_rgba(8,12,16,0.7)] transition-all",
                    active
                      ? "z-10 scale-110 border-[var(--mh-bright)] bg-[var(--mh-bright)] text-base-deep shadow-[0_0_0_3px_rgba(8,12,16,0.75),0_0_18px_var(--mh-bright)]"
                      : "border-[var(--mh)] bg-panel/95 text-[var(--mh-bright)] hover:scale-110 hover:border-[var(--mh-bright)]",
                  )}
                  style={{
                    left: `${callout.target.x}%`,
                    top: `${callout.target.y}%`,
                  }}
                >
                  {String(slotIndex + 1).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <MhLabel className="mb-0">{t("reportParts")}</MhLabel>
            <span className="font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-txt-dim">
              {t("anatomyHint")}
            </span>
          </div>
          {slots.length > 0 ? (
            <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              {slots.map((slot, slotIndex) => {
                const name =
                  localizedText(slot.part?.name, locale) ?? t("unknownPart");
                const breakName = localizedText(slot.break?.name, locale);
                const part = parts.find((item) => item.type === slot.partType);
                const active = selectedPartType === slot.partType;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectPart(slot.partType)}
                    className={cn(
                      "flex items-center gap-2 border border-solid px-2.5 py-2 text-left transition-colors",
                      active
                        ? "border-[var(--mh-bright)] bg-[var(--mh-soft)]"
                        : "border-line bg-base-2 hover:border-[var(--mh)]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 flex-none place-items-center rounded-full border border-solid font-mono text-[0.5625rem]",
                        active
                          ? "border-[var(--mh-bright)] bg-[var(--mh-bright)] text-base-deep"
                          : "border-[var(--mh-bright)] text-[var(--mh-bright)]",
                      )}
                    >
                      {String(slotIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-[0.75rem] font-semibold">
                        {name}
                      </span>
                      <span className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 font-mono text-[0.59375rem] text-txt-dim">
                        {breakName && <span>{breakName}</span>}
                        {part && partBreakCount(part) > 0 && (
                          <span className="text-[var(--mh-bright)]">
                            {t("breakCount", { count: partBreakCount(part) })}
                          </span>
                        )}
                      </span>
                    </span>
                    <Icon
                      name="arrow"
                      size={13}
                      className={cn(
                        "flex-none text-txt-dim transition-colors",
                        active && "text-[var(--mh-bright)]",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="m-0 font-mono text-[0.71875rem] text-txt-dim">
              {t("noReportParts")}
            </p>
          )}
        </div>
      </div>
    </MhPanel>
  );
}

type HitzoneColumn = {
  key: keyof MhWildsHitzone;
  translation: string;
  group: "physical" | "element";
  color: string;
};

const HITZONE_COLUMNS: HitzoneColumn[] = [
  {
    key: "slash",
    translation: "damageSlash",
    group: "physical",
    color: "var(--mh-bright)",
  },
  {
    key: "blunt",
    translation: "damageBlunt",
    group: "physical",
    color: "var(--mh-bright)",
  },
  {
    key: "shot",
    translation: "damageShot",
    group: "physical",
    color: "var(--mh-bright)",
  },
  {
    key: "fire",
    translation: "damageFire",
    group: "element",
    color: elementColor("fire"),
  },
  {
    key: "water",
    translation: "damageWater",
    group: "element",
    color: elementColor("water"),
  },
  {
    key: "thunder",
    translation: "damageThunder",
    group: "element",
    color: elementColor("thunder"),
  },
  {
    key: "ice",
    translation: "damageIce",
    group: "element",
    color: elementColor("ice"),
  },
  {
    key: "dragon",
    translation: "damageDragon",
    group: "element",
    color: elementColor("dragon"),
  },
];

function DamageCell({
  value,
  active = false,
  color = "var(--mh-bright)",
}: {
  value?: number | null;
  active?: boolean;
  color?: string;
}) {
  const safe = value == null ? null : Math.max(0, Math.min(100, value));
  return (
    <td
      className={cn(
        "min-w-[3.35rem] border-l border-solid border-line px-1.5 py-2.5 text-center align-middle font-mono text-[0.6875rem] font-bold",
        active &&
          "shadow-[inset_0_2px_0_var(--mh-bright),inset_0_-2px_0_var(--mh-bright)]",
      )}
      style={
        safe == null
          ? active
            ? { background: "var(--mh-soft)" }
            : undefined
          : {
              background: `linear-gradient(180deg, color-mix(in srgb, ${color} ${Math.max(10, Math.round(safe * 0.42))}%, transparent), transparent)`,
            }
      }
    >
      {safe == null ? (
        "—"
      ) : (
        <>
          <span className="block" style={{ color }}>
            {safe}
          </span>
          <span className="mx-auto mt-1.5 block h-[0.1875rem] max-w-[2.5rem] overflow-hidden bg-base-deep">
            <span
              className="block h-full"
              style={{ width: `${safe}%`, background: color }}
            />
          </span>
        </>
      )}
    </td>
  );
}

function PartDamagePanel({
  parts,
  locale,
  t,
  selectedPartType,
  onSelectPart,
}: {
  parts: MhWildsPartData[];
  locale: string;
  t: BestiaryTranslate;
  selectedPartType: number | null;
  onSelectPart: (partType: number) => void;
}) {
  const visibleParts = parts.filter(
    (part) => part.typeInfo.name && (part.health ?? 0) > 0,
  );
  const breakableParts = visibleParts.filter(
    (part) => part.breaks.length > 0 || part.breakHitzone,
  );

  return (
    <MhPanel title={t("partDamage")} icon="target" count={visibleParts.length}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <MhLabel className="mb-0">{t("damageProfile")}</MhLabel>
        <span className="font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-txt-dim">
          {t("anatomyHint")}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 border border-[var(--mh-line)] bg-[var(--mh-soft)] px-2 py-1 font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-[var(--mh-bright)]">
          <span className="h-1.5 w-1.5 -skew-x-12 bg-[var(--mh-bright)]" />
          {t("physical")}
        </span>
        <span className="inline-flex items-center gap-1.5 border border-line bg-base-2 px-2 py-1 font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-txt-muted">
          <span
            className="h-1.5 w-1.5 -skew-x-12"
            style={{ background: elementColor("fire") }}
          />
          {t("elements")}
        </span>
        <span className="font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-txt-dim">
          {t("damageLegend")}
        </span>
      </div>
      <div className="overflow-x-auto border border-solid border-line bg-base-2 bm-scroll">
        <table className="w-full min-w-[57rem] border-collapse">
          <thead>
            <tr className="border-b border-solid border-line bg-panel text-left">
              <th
                rowSpan={2}
                className="sticky left-0 z-10 w-[13rem] bg-panel px-2.5 py-2.5 font-mono text-[0.625rem] uppercase tracking-[0.05em] text-txt-dim"
              >
                {t("part")}
              </th>
              <th
                rowSpan={2}
                className="w-[4.5rem] px-2 py-2.5 text-right font-mono text-[0.625rem] uppercase tracking-[0.05em] text-txt-dim"
              >
                {t("partHealth")}
              </th>
              <th
                colSpan={3}
                className="border-l border-solid border-line bg-[var(--mh-soft)] px-1.5 py-1.5 text-center font-mono text-[0.59375rem] uppercase tracking-[0.08em] text-[var(--mh-bright)]"
              >
                {t("physical")}
              </th>
              <th
                colSpan={5}
                className="border-l border-solid border-line bg-base-2 px-1.5 py-1.5 text-center font-mono text-[0.59375rem] uppercase tracking-[0.08em] text-txt-muted"
              >
                {t("elements")}
              </th>
            </tr>
            <tr className="border-b border-solid border-line bg-panel text-left">
              {HITZONE_COLUMNS.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-1.5 py-2 text-center font-mono text-[0.59375rem] uppercase tracking-[0.05em] text-txt-dim",
                    (index === 0 || index === 3) &&
                      "border-l border-solid border-line",
                  )}
                  style={{ color: column.color }}
                >
                  {t(column.translation)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleParts.map((part) => {
              const name =
                localizedText(part.typeInfo.name, locale) ?? t("unknownPart");
              const breakCount = partBreakCount(part);
              const health = part.healthStages?.length
                ? part.healthStages.join(" / ")
                : part.health;
              const active = selectedPartType === part.type;
              return (
                <React.Fragment key={part.id}>
                  <tr
                    className={cn(
                      "border-b border-dashed border-line transition-colors",
                      active && "bg-[var(--mh-soft)]",
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-[1] px-2 py-2 font-body text-[0.75rem] font-semibold",
                        active ? "bg-[var(--mh-soft)]" : "bg-panel",
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelectPart(part.type)}
                        className="group flex w-full min-w-[8.5rem] items-center gap-2 text-left"
                      >
                        <span
                          className={cn(
                            "h-2 w-2 flex-none rotate-45 border border-solid transition-colors",
                            active
                              ? "border-[var(--mh-bright)] bg-[var(--mh-bright)]"
                              : "border-[var(--mh)] bg-transparent group-hover:bg-[var(--mh)]",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{name}</span>
                          {breakCount > 0 && (
                            <span className="block font-mono text-[0.59375rem] font-normal text-[var(--mh-bright)]">
                              {t("breakCount", { count: breakCount })}
                            </span>
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-[0.6875rem] text-txt-muted">
                      <span className="whitespace-nowrap">{health ?? "—"}</span>
                    </td>
                    {HITZONE_COLUMNS.map((column) => (
                      <DamageCell
                        key={column.key}
                        value={part.hitzone?.[column.key]}
                        active={active}
                        color={column.color}
                      />
                    ))}
                  </tr>
                  {part.breakHitzone && (
                    <tr
                      className={cn(
                        "border-b border-dashed border-line bg-base-2/60",
                        active && "bg-[var(--mh-soft)]/60",
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-[1] px-2 py-1.5 font-mono text-[0.59375rem] uppercase tracking-[0.04em] text-txt-dim",
                          active ? "bg-[var(--mh-soft)]/60" : "bg-base-2",
                        )}
                      >
                        <span className="pl-4 text-[var(--mh-bright)]">
                          {t("afterBreak")}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[0.625rem] text-txt-dim">
                        <span className="whitespace-nowrap">—</span>
                      </td>
                      {HITZONE_COLUMNS.map((column) => (
                        <DamageCell
                          key={column.key}
                          value={part.breakHitzone?.[column.key]}
                          active={active}
                          color={column.color}
                        />
                      ))}
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {breakableParts.length > 0 && (
        <div className="mt-3 border-t border-solid border-line pt-3">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <MhLabel className="mb-0">{t("breakSchema")}</MhLabel>
            <span className="font-mono text-[0.59375rem] uppercase tracking-[0.06em] text-txt-dim">
              {t("breakSchemaHint")}
            </span>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {breakableParts.map((part) => {
              const name =
                localizedText(part.typeInfo.name, locale) ?? t("unknownPart");
              const active = selectedPartType === part.type;
              return (
                <button
                  key={`${part.id}-break-schema`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectPart(part.type)}
                  className={cn(
                    "relative overflow-hidden border border-solid px-2.5 py-2.5 text-left transition-colors",
                    active
                      ? "border-[var(--mh-bright)] bg-[var(--mh-soft)]"
                      : "border-line bg-base-2 hover:border-[var(--mh)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 top-0 w-[3px] bg-[var(--mh)]"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate pl-1 font-body text-[0.75rem] font-semibold">
                      {name}
                    </span>
                    <span className="shrink-0 font-mono text-[0.59375rem] uppercase text-[var(--mh-bright)]">
                      {t("breakCount", {
                        count: partBreakCount(part) || part.breaks.length,
                      })}
                    </span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1 pl-1">
                    {part.breaks.map((breakData, index) => (
                      <span
                        key={breakData.id}
                        className="border border-solid border-[var(--mh-line)] bg-panel px-1.5 py-1 font-mono text-[0.59375rem] text-txt-muted"
                      >
                        {t("breakStage", {
                          stage: index + 1,
                          count: breakTargetCount(breakData) ?? "∞",
                        })}
                      </span>
                    ))}
                    {part.breakHitzone && (
                      <span className="border border-solid border-[var(--mh-line)] bg-panel px-1.5 py-0.5 font-mono text-[0.59375rem] text-[var(--mh-bright)]">
                        {t("afterBreak")}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </MhPanel>
  );
}

function BstNone({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 py-1 font-mono text-[0.71875rem] leading-[1.5] text-txt-dim">
      {children}
    </p>
  );
}

function StatRow({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-3 py-2 border-b border-dashed border-line last:border-b-0">
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.04em] text-txt-dim">
        {k}
      </span>
      <span className="font-body text-[0.8125rem] font-semibold text-txt text-right">
        {v}
      </span>
    </div>
  );
}
