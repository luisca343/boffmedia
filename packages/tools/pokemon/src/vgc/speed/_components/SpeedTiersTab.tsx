"use client";

import { Fragment, useMemo, useState } from "react";
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn";
import { Icon, Button } from "@boffmedia/ui"
import { DkTable, DkSprite, DkType, DkEmpty, DkSkelList } from "@boffmedia/ui/datakit";
import { spriteUrl, handleSpriteError } from "../../tracker-core/types";
import { SpeedTierEntry } from "../../service";
import {
  computeSpeeds,
  calcSpeedStat,
  applyMods,
  DEFAULT_MODIFIERS,
  Modifiers,
  ComputedSpeeds,
  compareSpeed,
  hasModifiers,
} from "../../speedCalc";
import { SpdPanel, SpdInput, SpdMonSearch, SpdModifiers, ZONE_TEXT, ZONE_LEFT, ZONE_CHIP, ZONE_MARK } from "./SpdKit";

type SortKey = "name" | "baseSpeed" | "s0n" | "s0p" | "s252n" | "s252p" | "scarf" | "scarfPlus";
type SortDir = "asc" | "desc";
type EVPreset = "0n" | "0p" | "252n" | "252p";
type SpeedZone = "faster" | "tie" | "slower";

interface RefState {
  entry: SpeedTierEntry | null;
  preset: EVPreset;
  customSpeed: string;
  useCustom: boolean;
  mods: Modifiers;
}

interface Props {
  speedTiers: SpeedTierEntry[];
  loading: boolean;
  error: boolean;
  onSelectForMatchup: (entry: SpeedTierEntry) => void;
}

const DEFAULT_REF: RefState = { entry: null, preset: "252p", customSpeed: "", useCustom: false, mods: DEFAULT_MODIFIERS };

const EV_PRESETS: { key: EVPreset; evs: 0 | 252; nature: 1.0 | 1.1; label: string }[] = [
  { key: "0n", evs: 0, nature: 1.0, label: "0/N" },
  { key: "0p", evs: 0, nature: 1.1, label: "0/+" },
  { key: "252n", evs: 252, nature: 1.0, label: "252/N" },
  { key: "252p", evs: 252, nature: 1.1, label: "252/+" },
];

function getRefEffective(ref: RefState): number | null {
  if (ref.useCustom) {
    const v = parseInt(ref.customSpeed, 10);
    if (isNaN(v) || v <= 0) return null;
    return applyMods(v, ref.mods, true);
  }
  if (!ref.entry) return null;
  const p = EV_PRESETS.find((p) => p.key === ref.preset)!;
  const stat = calcSpeedStat(ref.entry.baseSpeed, p.evs, p.nature);
  return applyMods(stat, ref.mods, !ref.entry.requiredItem);
}

// ── Reference panel ──────────────────────────────────────────────────────────
function ReferencePanel({
  speedTiers,
  loading,
  refState,
  refEffective,
  onChange,
}: {
  speedTiers: SpeedTierEntry[];
  loading: boolean;
  refState: RefState;
  refEffective: number | null;
  onChange: (r: RefState) => void;
}) {
  const t = useVgcT("speedTiers");
  const hasRef = refState.entry !== null || (refState.useCustom && refState.customSpeed.trim() !== "");

  return (
    <SpdPanel
      icon="target"
      title={t("reference.title")}
      aside={
        hasRef ? (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_REF)}
            className="inline-flex items-center gap-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt-dim transition-colors hover:text-bad"
          >
            <Icon name="x" size={12} />
            {t("reference.clearRef")}
          </button>
        ) : undefined
      }
      bodyClassName="grid gap-[0.875rem]"
    >
      <div className="grid grid-cols-2 gap-1 border border-solid border-line bg-base p-1">
        {[
          { v: false, label: t("reference.pokemonMode") },
          { v: true, label: t("reference.customMode") },
        ].map((m) => (
          <button
            key={String(m.v)}
            type="button"
            onClick={() => onChange({ ...refState, useCustom: m.v })}
            className={cn(
              "px-3 py-[0.375rem] font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.06em] transition-[color,background]",
              refState.useCustom === m.v ? "bg-accent text-accent-ink" : "text-txt-muted hover:text-txt",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {refState.useCustom ? (
        <SpdInput
          icon="bolt"
          type="number"
          value={refState.customSpeed}
          onChange={(v) => onChange({ ...refState, customSpeed: v })}
          placeholder={t("reference.searchPlaceholder")}
          className="w-full"
        />
      ) : (
        <SpdMonSearch
          speedTiers={speedTiers}
          loading={loading}
          selectedName={refState.entry?.name ?? ""}
          onSelect={(entry) => onChange({ ...refState, entry })}
          onClear={() => onChange({ ...refState, entry: null })}
          placeholder={t("reference.searchPlaceholder")}
        />
      )}

      {!refState.useCustom && refState.entry && (
        <div className="grid gap-[0.375rem]">
          <span className="font-mono text-[0.5625rem] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("reference.evLabel")}</span>
          <div className="grid grid-cols-4 gap-1">
            {EV_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onChange({ ...refState, preset: p.key })}
                className={cn(
                  "border border-solid py-[0.375rem] font-mono text-[0.6875rem] font-semibold transition-[color,background,border-color]",
                  refState.preset === p.key ? "border-accent-line bg-accent-soft text-accent-bright" : "border-line-2 text-txt-muted hover:text-txt",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <SpdModifiers modifiers={refState.mods} onChange={(m) => onChange({ ...refState, mods: m })} />

      {refEffective !== null ? (
        <div className="border border-solid border-accent-line bg-base px-4 pb-4 pt-3 text-center">
          <div className="mb-1 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("reference.effectiveSpeed")}</div>
          <div className="font-display text-[2.875rem] font-extrabold italic leading-none tabular-nums text-accent-bright">{refEffective}</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 font-mono text-[0.6875rem] text-txt-muted">
            {refState.entry && (
              <>
                <DkSprite src={spriteUrl(refState.entry.name)} alt={refState.entry.name} size={20} onError={handleSpriteError} />
                <span>{refState.entry.name}</span>
                <span className="text-txt-dim">·</span>
                <span>{EV_PRESETS.find((p) => p.key === refState.preset)?.label}</span>
              </>
            )}
            {hasModifiers(refState.mods) && (
              <span className="bg-accent-soft px-1.5 py-0.5 text-[0.625rem] font-semibold text-accent-bright">mods</span>
            )}
          </div>
        </div>
      ) : (
        !hasRef && (
          <div className="border border-dashed border-line-2 px-4 py-5 text-center font-mono text-[0.6875rem] leading-relaxed text-txt-dim">
            {t("reference.noRef")}
          </div>
        )
      )}
    </SpdPanel>
  );
}

// ── Numeric column cell ──────────────────────────────────────────────────────
function num(value: number | null, opts?: { zone?: SpeedZone | null; refCol?: boolean }) {
  const zone = opts?.zone ?? null;
  const highlight = opts?.refCol && zone !== null;
  if (value === null) return <td className="!text-center font-mono !text-txt-dim">—</td>;
  return (
    <td className={cn("mono !text-center tabular-nums", highlight ? `font-bold ${ZONE_TEXT[zone!]}` : "")}>{value}</td>
  );
}

export function SpeedTiersTab({ speedTiers, loading, error, onSelectForMatchup }: Props) {
  const t = useVgcT("speedTiers");

  const [refState, setRefState] = useState<RefState>(DEFAULT_REF);
  const [tableSearch, setTableSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("s252p");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const refEffective = useMemo(() => getRefEffective(refState), [refState]);

  const computedMap = useMemo(() => {
    const map = new Map<string, ComputedSpeeds>();
    for (const p of speedTiers) map.set(p.name, computeSpeeds(p.baseSpeed, p.requiredItem, DEFAULT_MODIFIERS));
    return map;
  }, [speedTiers]);

  const zoneMap = useMemo(() => {
    const map = new Map<string, SpeedZone>();
    if (refEffective === null) return map;
    for (const p of speedTiers) {
      const s = computedMap.get(p.name);
      if (!s) continue;
      map.set(p.name, compareSpeed(s.s252p, refEffective));
    }
    return map;
  }, [speedTiers, computedMap, refEffective]);

  const handleSort = (col: string) => {
    const key = col as SortKey;
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const getVal = (p: SpeedTierEntry, key: SortKey): number | string => {
    const s = computedMap.get(p.name);
    switch (key) {
      case "name": return p.name;
      case "baseSpeed": return p.baseSpeed;
      case "s0n": return s?.s0n ?? 0;
      case "s0p": return s?.s0p ?? 0;
      case "s252n": return s?.s252n ?? 0;
      case "s252p": return s?.s252p ?? 0;
      case "scarf": return s?.scarf ?? -1;
      case "scarfPlus": return s?.scarfPlus ?? -1;
    }
  };

  const filteredSorted = useMemo(() => {
    let list = speedTiers;
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const va = getVal(a, sortKey);
      const vb = getVal(b, sortKey);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [speedTiers, tableSearch, sortKey, sortDir, computedMap]);

  const separatorBeforeIdx = useMemo(() => {
    if (refEffective === null || sortKey !== "s252p" || sortDir !== "desc") return -1;
    for (let i = 0; i < filteredSorted.length; i++) {
      const s252p = computedMap.get(filteredSorted[i].name)?.s252p ?? 0;
      if (s252p <= refEffective) return i;
    }
    return filteredSorted.length;
  }, [filteredSorted, computedMap, refEffective, sortKey, sortDir]);

  const zoneCounts = useMemo(() => {
    if (refEffective === null) return { faster: 0, tie: 0, slower: 0 };
    let faster = 0, tie = 0, slower = 0;
    for (const p of filteredSorted) {
      const zone = zoneMap.get(p.name);
      if (zone === "faster") faster++;
      else if (zone === "tie") tie++;
      else if (zone === "slower") slower++;
    }
    return { faster, tie, slower };
  }, [filteredSorted, zoneMap, refEffective]);

  const totalCols = 11;
  const columns = [
    { key: "n", label: t("columns.number"), w: 44 },
    { key: "name", label: t("columns.pokemon"), sortable: true },
    { key: "types", label: t("columns.types"), w: 108, align: "center" as const },
    { key: "baseSpeed", label: t("columns.base"), w: 62, align: "center" as const, sortable: true },
    { key: "s0n", label: t("columns.minNeutral"), w: 62, align: "center" as const, sortable: true },
    { key: "s0p", label: t("columns.minPlus"), w: 62, align: "center" as const, sortable: true },
    { key: "s252n", label: t("columns.maxNeutral"), w: 62, align: "center" as const, sortable: true },
    { key: "s252p", label: t("columns.maxPlus"), w: 62, align: "center" as const, sortable: true },
    { key: "scarf", label: t("columns.scarf"), w: 62, align: "center" as const, sortable: true },
    { key: "scarfPlus", label: t("columns.scarfPlus"), w: 62, align: "center" as const, sortable: true },
    { key: "exp", label: "", w: 34 },
  ];

  const separatorRow = (key: string, allFaster?: boolean) => (
    <tr key={key} className="border-y border-solid border-accent-line">
      <td colSpan={totalCols} className="!bg-base-2 !py-[0.4375rem]">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-bad/30" />
          <div className="flex items-center gap-2 whitespace-nowrap font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-accent-bright">
            <Icon name="bolt" size={13} />
            {t("zones.separator")}: {refEffective}
            {allFaster ? (
              <span className="font-normal normal-case tracking-normal text-txt-muted">({t("zones.fasterCount", { count: zoneCounts.faster })})</span>
            ) : (
              refState.entry && !refState.useCustom && (
                <span className="font-normal normal-case tracking-normal text-txt-muted">
                  ({refState.entry.name} {EV_PRESETS.find((p) => p.key === refState.preset)?.label}
                  {hasModifiers(refState.mods) ? " + mods" : ""})
                </span>
              )
            )}
          </div>
          <div className="h-px flex-1 bg-ok/30" />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4">
        <ReferencePanel speedTiers={speedTiers} loading={loading} refState={refState} refEffective={refEffective} onChange={setRefState} />
      </aside>

      <div className="grid min-w-0 gap-4">
        {/* Search + legend/count */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SpdInput icon="search" value={tableSearch} onChange={setTableSearch} placeholder={t("search")} className="w-full sm:max-w-xs" />
          {refEffective !== null ? (
            <div className="flex flex-wrap items-center gap-3 font-mono text-[0.6875rem] sm:ml-auto">
              <span className="flex items-center gap-1.5 text-bad">
                <span className="inline-block h-2 w-2 rounded-full bg-bad" />
                {t("zones.fasterCount", { count: zoneCounts.faster })}
              </span>
              {zoneCounts.tie > 0 && (
                <span className="flex items-center gap-1.5 text-warn">
                  <span className="inline-block h-2 w-2 rounded-full bg-warn" />
                  {t("zones.tieCount", { count: zoneCounts.tie })}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-ok">
                <span className="inline-block h-2 w-2 rounded-full bg-ok" />
                {t("zones.slowerCount", { count: zoneCounts.slower })}
              </span>
            </div>
          ) : (
            !loading && <p className="font-mono text-[0.6875rem] text-txt-dim sm:ml-auto">{t("pokemonCount", { count: filteredSorted.length })}</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 font-mono text-[0.6875rem] text-txt-dim">
          <span className="flex items-center gap-1.5">
            <Icon name="star" size={13} className="text-warn" />
            {t("legend.restricted")}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="sparkles" size={13} className="text-signal" />
            {t("legend.mythical")}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <DkSkelList rows={12} h={44} />
        ) : error ? (
          <DkEmpty icon="alert" title={t("error")} />
        ) : filteredSorted.length === 0 ? (
          <DkEmpty icon="search" title={t("empty")} />
        ) : (
          <DkTable minWidth="820px" columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} ariaLabel={t("title")}>
            <tbody>
              {filteredSorted.map((pokemon, idx) => {
                const speeds = computedMap.get(pokemon.name);
                const zone = zoneMap.get(pokemon.name) ?? null;
                const isExpanded = expandedRow === pokemon.name;
                const isRef = !refState.useCustom && refState.entry?.name === pokemon.name;
                const showSeparator = separatorBeforeIdx === idx;
                const leftAccent = zone
                  ? ZONE_LEFT[zone]
                  : pokemon.isRestricted
                    ? "border-l-warn/50"
                    : pokemon.isMythical
                      ? "border-l-signal/50"
                      : "border-l-transparent";

                return (
                  <Fragment key={pokemon.name}>
                    {showSeparator && refEffective !== null && separatorRow(`sep-${idx}`)}
                    <tr
                      className={cn("is-click border-l-[3px] border-solid", leftAccent)}
                      onClick={() => setExpandedRow((prev) => (prev === pokemon.name ? null : pokemon.name))}
                    >
                      <td className="mono !text-txt-dim">{idx + 1}</td>
                      <td>
                        <div className="flex min-w-[10rem] items-center gap-2">
                          <DkSprite src={spriteUrl(pokemon.name)} alt={pokemon.name} size={34} onError={handleSpriteError} />
                          <span className="flex items-center gap-1 truncate font-semibold">
                            <span className="truncate">{pokemon.name}</span>
                            {isRef && (
                              <span className="flex-none bg-accent-soft px-1 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-[0.1em] text-accent-bright">YOU</span>
                            )}
                            {pokemon.isRestricted && (
                              <span title={t("badge.restrictedTitle")}>
                                <Icon name="star" size={12} className="flex-none text-warn" />
                              </span>
                            )}
                            {pokemon.isMythical && (
                              <span title={t("badge.mythicalTitle")}>
                                <Icon name="sparkles" size={12} className="flex-none text-signal" />
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {pokemon.types.map((type) => (
                            <DkType key={type} type={type} small />
                          ))}
                        </div>
                      </td>
                      {num(pokemon.baseSpeed)}
                      {num(speeds?.s0n ?? null)}
                      {num(speeds?.s0p ?? null)}
                      {num(speeds?.s252n ?? null)}
                      {num(speeds?.s252p ?? null, { zone, refCol: true })}
                      {num(speeds?.scarf ?? null)}
                      {num(speeds?.scarfPlus ?? null)}
                      <td className="!text-center">
                        <Icon name="chevron" size={14} className={cn("text-txt-dim transition-transform", isExpanded ? "rotate-180 text-accent-bright" : "")} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow pokemon={pokemon} speeds={speeds} refEffective={refEffective} colSpan={totalCols} onSelectForMatchup={onSelectForMatchup} />
                    )}
                  </Fragment>
                );
              })}
              {separatorBeforeIdx === filteredSorted.length && refEffective !== null && separatorRow("sep-end", true)}
            </tbody>
          </DkTable>
        )}

        {!loading && !error && filteredSorted.length > 0 && <p className="text-center font-mono text-[0.625rem] text-txt-dim">{t("footer")}</p>}
      </div>
    </div>
  );
}

// ── Expanded row: per-EV breakdown chips + send-to-matchup ────────────────────
function ExpandedRow({
  pokemon,
  speeds,
  refEffective,
  colSpan,
  onSelectForMatchup,
}: {
  pokemon: SpeedTierEntry;
  speeds: ComputedSpeeds | undefined;
  refEffective: number | null;
  colSpan: number;
  onSelectForMatchup: (entry: SpeedTierEntry) => void;
}) {
  const t = useVgcT("speedTiers");
  const items: { label: string; value: number | null }[] = [
    { label: "0/N", value: speeds?.s0n ?? null },
    { label: "0/+", value: speeds?.s0p ?? null },
    { label: "252/N", value: speeds?.s252n ?? null },
    { label: "252/+", value: speeds?.s252p ?? null },
    { label: "Scarf", value: speeds?.scarf ?? null },
    { label: "Scarf+", value: speeds?.scarfPlus ?? null },
  ];
  return (
    <tr>
      <td colSpan={colSpan} className="!bg-base-2 !px-4 !py-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid gap-1">
            <span className="font-mono text-[0.5625rem] uppercase leading-none tracking-[0.12em] text-txt-dim">{t("expanded.breakdown")}</span>
            <div className="flex flex-wrap gap-1.5">
              {items.map((it) => {
                if (it.value === null) return null;
                const zone = refEffective !== null ? compareSpeed(it.value, refEffective) : null;
                return (
                  <div
                    key={it.label}
                    className={cn(
                      "flex items-center gap-1 border border-solid px-2 py-1 font-mono text-[0.6875rem]",
                      zone ? ZONE_CHIP[zone] : "border-line bg-panel text-txt",
                    )}
                  >
                    <span className="text-[0.5625rem] text-txt-dim">{it.label}</span>
                    <span className="font-bold">{it.value}</span>
                    {zone && <span className="text-[0.5625rem]">{ZONE_MARK[zone]}</span>}
                  </div>
                );
              })}
            </div>
            {refEffective !== null && <div className="mt-1 font-mono text-[0.5625rem] text-txt-dim">{t("expanded.vsRef", { speed: refEffective })}</div>}
            {refEffective === null && <div className="mt-0.5 font-mono text-[0.5625rem] text-txt-dim">{t("expanded.noRef")}</div>}
          </div>
          <Button size="sm" icon="sword" className="ml-auto" onClick={() => onSelectForMatchup(pokemon)}>
            {t("expanded.sendToMatchup")}
          </Button>
        </div>
      </td>
    </tr>
  );
}
