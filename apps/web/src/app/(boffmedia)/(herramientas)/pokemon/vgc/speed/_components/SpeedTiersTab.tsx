"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Swords,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Card } from "@/components/ui/primitives/card";
import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";
import { ModifierPanel } from "../../_components/ModifierPanel";
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
import { SpeedTierEntry } from "@/services/api/boffmedia/vgcService";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";

type SortKey =
  | "name"
  | "baseSpeed"
  | "s0n"
  | "s0p"
  | "s252n"
  | "s252p"
  | "scarf"
  | "scarfPlus";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_REF: RefState = {
  entry: null,
  preset: "252p",
  customSpeed: "",
  useCustom: false,
  mods: DEFAULT_MODIFIERS,
};

const EV_PRESETS: { key: EVPreset; evs: 0 | 252; nature: 1.0 | 1.1; label: string }[] = [
  { key: "0n",   evs: 0,   nature: 1.0, label: "0/N"   },
  { key: "0p",   evs: 0,   nature: 1.1, label: "0/+"   },
  { key: "252n", evs: 252, nature: 1.0, label: "252/N" },
  { key: "252p", evs: 252, nature: 1.1, label: "252/+" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Reference Panel ──────────────────────────────────────────────────────────

function ReferencePanel({
  speedTiers,
  loading,
  ref: refState,
  refEffective,
  onChange,
}: {
  speedTiers: SpeedTierEntry[];
  loading: boolean;
  ref: RefState;
  refEffective: number | null;
  onChange: (r: RefState) => void;
}) {
  const t = useTranslations("vgc.speedTiers");
  const [search, setSearch] = useState(refState.entry?.name ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const searchResults = useMemo(() => {
    if (!search.trim() || search === refState.entry?.name) return [];
    const q = search.toLowerCase();
    return speedTiers.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [speedTiers, search, refState.entry?.name]);

  const hasRef =
    refState.entry !== null || (refState.useCustom && refState.customSpeed.trim() !== "");

  const clearRef = () => {
    onChange(DEFAULT_REF);
    setSearch("");
  };

  return (
    <Card className="overflow-visible">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-edge bg-layer-1/50">
        <Target className="w-4 h-4 text-primary-hover shrink-0" />
        <span className="text-xs font-semibold text-ink uppercase tracking-wider">
          {t("reference.title")}
        </span>
        {hasRef && (
          <button
            onClick={clearRef}
            className="ml-auto text-xs text-ink-muted hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {t("reference.clearRef")}
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-lg bg-layer-1 p-1">
          <button
            onClick={() => onChange({ ...refState, useCustom: false })}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !refState.useCustom
                ? "bg-primary/20 text-primary-hover shadow"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t("reference.pokemonMode")}
          </button>
          <button
            onClick={() => onChange({ ...refState, useCustom: true })}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              refState.useCustom
                ? "bg-primary/20 text-primary-hover shadow"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t("reference.customMode")}
          </button>
        </div>

        {refState.useCustom ? (
          /* Custom speed input */
          <div className="relative">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <Input
              value={refState.customSpeed}
              onChange={(e) => onChange({ ...refState, customSpeed: e.target.value })}
              placeholder="Speed stat..."
              type="number"
              min={1}
              max={999}
              className="pl-9 bg-layer-1 border-edge text-ink placeholder:text-ink-muted"
            />
          </div>
        ) : (
          /* Pokémon search dropdown */
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) onChange({ ...refState, entry: null });
                }}
                onFocus={() => {
                  if (search) setShowDropdown(true);
                }}
                placeholder={t("reference.searchPlaceholder")}
                className="pl-9 pr-8 bg-layer-1 border-edge text-ink placeholder:text-ink-muted"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    onChange({ ...refState, entry: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-30 w-full mt-1 rounded-lg border border-edge bg-layer-1 shadow-xl overflow-hidden">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-ink-muted">{t("loading")}</div>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.name}
                      onMouseDown={() => {
                        onChange({ ...refState, entry: p });
                        setSearch(p.name);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-layer-2 transition-colors flex items-center gap-2"
                    >
                      { }
                      <img
                        src={spriteUrl(p.name)}
                        onError={handleSpriteError}
                        alt={p.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className="text-sm text-ink">{p.name}</span>
                      <span className="ml-auto text-xs text-ink-muted font-mono">
                        {p.baseSpeed}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* EV / Nature presets (Pokémon mode only) */}
        {!refState.useCustom && refState.entry && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-ink-muted uppercase tracking-wider block">
              {t("reference.evLabel")}
            </span>
            <div className="grid grid-cols-4 gap-1">
              {EV_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => onChange({ ...refState, preset: p.key })}
                  className={`py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
                    refState.preset === p.key
                      ? "bg-primary/20 border-primary/50 text-primary-hover"
                      : "bg-layer-2 border-edge text-ink-muted hover:text-ink hover:border-edge"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifiers */}
        <ModifierPanel
          modifiers={refState.mods}
          onChange={(m) => onChange({ ...refState, mods: m })}
        />

        {/* Effective speed display */}
        {refEffective !== null ? (
          <div className="rounded-lg bg-layer-1/80 border border-primary/30 px-4 pt-3 pb-4 text-center">
            <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">
              {t("reference.effectiveSpeed")}
            </div>
            <div className="text-5xl font-bold font-mono text-primary-hover tabular-nums leading-none">
              {refEffective}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-ink-muted">
              {refState.entry && (
                <>
                  { }
                  <img
                    src={spriteUrl(refState.entry.name)}
                    onError={handleSpriteError}
                    alt={refState.entry.name}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span>{refState.entry.name}</span>
                  <span className="text-ink-dim">·</span>
                  <span className="font-mono">
                    {EV_PRESETS.find((p) => p.key === refState.preset)?.label}
                  </span>
                </>
              )}
              {hasModifiers(refState.mods) && (
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary-hover text-[10px] font-semibold">
                  mods
                </span>
              )}
            </div>
          </div>
        ) : (
          !hasRef && (
            <div className="rounded-lg bg-layer-1/50 border border-edge px-4 py-5 text-center text-xs text-ink-dim leading-relaxed">
              {t("reference.noRef")}
            </div>
          )
        )}
      </div>
    </Card>
  );
}

// ─── Speed Cell ───────────────────────────────────────────────────────────────

function SpeedCell({
  value,
  zone,
  isRefCol,
}: {
  value: number | null;
  zone: SpeedZone | null;
  isRefCol: boolean;
}) {
  const t = useTranslations("vgc.speedTiers");
  if (value === null) {
    return (
      <td
        className="px-3 py-0 text-center text-ink-dim text-sm select-none"
        title={t("columns.noScarf")}
      >
        —
      </td>
    );
  }

  // Highlight the 252+ column when it's the reference column and we have a zone
  const highlight = isRefCol && zone !== null;

  return (
    <td
      className={`px-3 py-0 text-center font-mono text-sm tabular-nums transition-colors ${
        highlight
          ? zone === "faster"
            ? "text-red-300 font-bold"
            : zone === "tie"
            ? "text-yellow-300 font-bold"
            : "text-green-300 font-bold"
          : "text-ink"
      }`}
    >
      {value}
    </td>
  );
}

// ─── Sort Header ──────────────────────────────────────────────────────────────

function SortTh({
  col,
  sortKey,
  sortDir,
  onSort,
  label,
  title,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (c: SortKey) => void;
  label: string;
  title: string;
}) {
  const active = col === sortKey;
  return (
    <th className="px-3 py-3 text-center whitespace-nowrap">
      <button
        onClick={() => onSort(col)}
        title={title}
        className={`text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-0.5 ${
          active ? "text-primary-hover" : "text-ink-muted hover:text-ink"
        }`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ChevronUp className="w-3 h-3 opacity-20" />
        )}
      </button>
    </th>
  );
}

// ─── Expanded Row Content ────────────────────────────────────────────────────

function ExpandedRowContent({
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
  const t = useTranslations("vgc.speedTiers");

  const breakdownItems: { label: string; value: number | null }[] = [
    { label: "0/N",    value: speeds?.s0n    ?? null },
    { label: "0/+",    value: speeds?.s0p    ?? null },
    { label: "252/N",  value: speeds?.s252n  ?? null },
    { label: "252/+",  value: speeds?.s252p  ?? null },
    { label: "Scarf",  value: speeds?.scarf  ?? null },
    { label: "Scarf+", value: speeds?.scarfPlus ?? null },
  ];

  return (
    <tr className="bg-layer-1/60 border-b border-edge">
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Speed breakdown chips */}
          <div className="space-y-1">
            <span className="text-[10px] text-ink-muted uppercase tracking-wider block">
              {t("expanded.breakdown")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {breakdownItems.map((item) => {
                if (item.value === null) return null;
                const zone =
                  refEffective !== null
                    ? compareSpeed(item.value, refEffective)
                    : null;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono ${
                      zone === "faster"
                        ? "border-red-500/30 bg-red-950/30 text-red-300"
                        : zone === "tie"
                        ? "border-yellow-500/30 bg-yellow-950/30 text-yellow-300"
                        : zone === "slower"
                        ? "border-green-500/30 bg-green-950/30 text-green-300"
                        : "border-edge bg-layer-2 text-ink"
                    }`}
                  >
                    <span className="text-[10px] text-ink-muted">{item.label}</span>
                    <span className="font-bold">{item.value}</span>
                    {zone === "faster" && <span className="text-[10px] text-red-400">▲</span>}
                    {zone === "tie"    && <span className="text-[10px] text-yellow-400">=</span>}
                    {zone === "slower" && <span className="text-[10px] text-green-400">▼</span>}
                  </div>
                );
              })}
            </div>
            {refEffective !== null && (
              <div className="text-[10px] text-ink-dim mt-1">
                {t("expanded.vsRef", { speed: refEffective })}
                {" — "}▲ faster · = tie · ▼ slower than you
              </div>
            )}
            {refEffective === null && (
              <div className="text-[10px] text-ink-dim mt-0.5">
                {t("expanded.noRef")}
              </div>
            )}
          </div>

          {/* Send to Matchup */}
          <button
            onClick={() => onSelectForMatchup(pokemon)}
            className="flex items-center gap-1.5 ml-auto px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary-hover hover:bg-primary/20 transition-all text-xs font-semibold shrink-0"
          >
            <Swords className="w-3.5 h-3.5" />
            {t("expanded.sendToMatchup")}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SpeedTiersTab({
  speedTiers,
  loading,
  error,
  onSelectForMatchup,
}: Props) {
  const t = useTranslations("vgc.speedTiers");

  // Reference panel state
  const [refState, setRefState] = useState<RefState>(DEFAULT_REF);

  // Table state
  const [tableSearch, setTableSearch] = useState("");
  const [sortKey, setSortKey]   = useState<SortKey>("s252p");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Derived: your effective speed
  const refEffective = useMemo(() => getRefEffective(refState), [refState]);

  // Table: raw computed speeds (no modifiers — table always shows base stats)
  const computedMap = useMemo(() => {
    const map = new Map<string, ComputedSpeeds>();
    for (const p of speedTiers) {
      map.set(p.name, computeSpeeds(p.baseSpeed, p.requiredItem, DEFAULT_MODIFIERS));
    }
    return map;
  }, [speedTiers]);

  // Zone for each Pokémon vs reference (compared against their 252+)
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

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("desc"); }
  };

  const getVal = (p: SpeedTierEntry, key: SortKey): number | string => {
    const s = computedMap.get(p.name);
    switch (key) {
      case "name":      return p.name;
      case "baseSpeed": return p.baseSpeed;
      case "s0n":       return s?.s0n    ?? 0;
      case "s0p":       return s?.s0p    ?? 0;
      case "s252n":     return s?.s252n  ?? 0;
      case "s252p":     return s?.s252p  ?? 0;
      case "scarf":     return s?.scarf  ?? -1;
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

  // Separator position: index of the first non-faster row when sorted desc by 252+
  const separatorBeforeIdx = useMemo(() => {
    if (refEffective === null || sortKey !== "s252p" || sortDir !== "desc") return -1;
    for (let i = 0; i < filteredSorted.length; i++) {
      const s252p = computedMap.get(filteredSorted[i].name)?.s252p ?? 0;
      if (s252p <= refEffective) return i;
    }
    return filteredSorted.length; // all are faster
  }, [filteredSorted, computedMap, refEffective, sortKey, sortDir]);

  // Stats for separator label
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

  // Total columns for colSpan
  const totalCols = 11; // #, Pokémon, Types, Base, 0N, 0+, 252N, 252+, Scarf, Scarf+, expand

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* ── Reference Panel (left sidebar) ── */}
      <aside className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-4">
        <ReferencePanel
          speedTiers={speedTiers}
          loading={loading}
          ref={refState}
          refEffective={refEffective}
          onChange={setRefState}
        />
      </aside>

      {/* ── Table (right) ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Search + count */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={t("search")}
              className="pl-9 bg-layer-1 border-edge text-ink placeholder:text-ink-muted"
            />
          </div>

          {/* Zone legend (when reference is set) */}
          {refEffective !== null ? (
            <div className="flex items-center gap-3 text-xs ml-auto">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                {t("zones.fasterCount", { count: zoneCounts.faster })}
              </span>
              {zoneCounts.tie > 0 && (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                  {t("zones.tieCount", { count: zoneCounts.tie })}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {t("zones.slowerCount", { count: zoneCounts.slower })}
              </span>
            </div>
          ) : (
            !loading && (
              <p className="text-xs text-ink-muted self-center ml-auto">
                {t("pokemonCount", { count: filteredSorted.length })}
              </p>
            )
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            {t("legend.restricted")}
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {t("legend.mythical")}
          </span>
          {refEffective !== null && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-500 inline-block" />
                Faster than you
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-yellow-400 inline-block" />
                Speed tie
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-green-500 inline-block" />
                You outspeed
              </span>
            </>
          )}
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-xl border border-edge overflow-hidden bg-layer-2 shadow-lg"
        >
          {loading ? (
            <div className="py-24 text-center text-ink-muted animate-pulse">
              {t("loading")}
            </div>
          ) : error ? (
            <div className="py-24 text-center text-red-400">{t("error")}</div>
          ) : filteredSorted.length === 0 ? (
            <div className="py-24 text-center text-ink-muted">{t("empty")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-layer-2 border-b border-edge">
                    <th className="px-3 py-3 text-left w-10">
                      <span className="text-[10px] text-ink-dim font-semibold uppercase tracking-wider">
                        {t("columns.number")}
                      </span>
                    </th>
                    <SortTh col="name"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.pokemon")} title={t("columns.pokemon")} />
                    <th className="px-3 py-3 text-center">
                      <span className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider">Types</span>
                    </th>
                    <SortTh col="baseSpeed" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.base")}    title={t("columns.baseTitle")} />
                    <SortTh col="s0n"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.minNeutral")} title={t("columns.minNeutralTitle")} />
                    <SortTh col="s0p"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.minPlus")}    title={t("columns.minPlusTitle")} />
                    <SortTh col="s252n"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.maxNeutral")} title={t("columns.maxNeutralTitle")} />
                    <SortTh col="s252p"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.maxPlus")}    title={t("columns.maxPlusTitle")} />
                    <SortTh col="scarf"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.scarf")}     title={t("columns.scarfTitle")} />
                    <SortTh col="scarfPlus" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label={t("columns.scarfPlus")} title={t("columns.scarfPlusTitle")} />
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((pokemon, idx) => {
                    const speeds = computedMap.get(pokemon.name);
                    const zone   = zoneMap.get(pokemon.name) ?? null;
                    const isExpanded = expandedRow === pokemon.name;
                    const isRef = !refState.useCustom && refState.entry?.name === pokemon.name;

                    // Show separator before this row
                    const showSeparator = separatorBeforeIdx === idx;

                    const rowBorder =
                      zone === "faster" ? "border-l-2 border-l-red-500/70"
                      : zone === "tie"  ? "border-l-2 border-l-yellow-500/70"
                      : zone === "slower" ? "border-l-2 border-l-green-500/60"
                      : pokemon.isRestricted ? "border-l-2 border-l-yellow-500/40"
                      : pokemon.isMythical  ? "border-l-2 border-l-purple-500/30"
                      : "";

                    const rowBg =
                      zone === "faster" ? "hover:bg-red-950/20"
                      : zone === "tie"  ? "bg-yellow-950/10 hover:bg-yellow-950/20"
                      : "hover:bg-layer-3/40";

                    return [
                      /* ── Separator row ── */
                      showSeparator && refEffective !== null && (
                        <tr key="zone-separator" className="border-y-2 border-primary/40">
                          <td colSpan={totalCols} className="px-4 py-2 bg-layer-1/80">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-red-500/30" />
                              <div className="flex items-center gap-2 text-xs font-bold text-primary-hover uppercase tracking-widest whitespace-nowrap">
                                <Zap className="w-3.5 h-3.5 text-primary-hover" />
                                {t("zones.separator")}: {refEffective}
                                {refState.entry && !refState.useCustom && (
                                  <span className="text-ink-muted font-normal normal-case tracking-normal">
                                    ({refState.entry.name}{" "}
                                    {EV_PRESETS.find((p) => p.key === refState.preset)?.label}
                                    {hasModifiers(refState.mods) ? " + mods" : ""})
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 h-px bg-green-500/30" />
                            </div>
                          </td>
                        </tr>
                      ),

                      /* ── Pokémon row ── */
                      <tr
                        key={pokemon.name}
                        onClick={() =>
                          setExpandedRow((prev) => (prev === pokemon.name ? null : pokemon.name))
                        }
                        className={`group border-b border-edge/50 cursor-pointer transition-colors ${rowBorder} ${rowBg}`}
                      >
                        {/* # */}
                        <td className="px-3 py-2.5 text-ink-dim text-xs tabular-nums">
                          {idx + 1}
                        </td>

                        {/* Pokémon */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-[180px]">
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                              { }
                              <img
                                src={spriteUrl(pokemon.name)}
                                onError={handleSpriteError}
                                alt={pokemon.name}
                                width={36}
                                height={36}
                                className="object-contain drop-shadow-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-medium text-ink truncate text-sm">
                                  {pokemon.name}
                                </span>
                                {isRef && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary-hover border border-primary/30 font-bold uppercase tracking-wider shrink-0">
                                    YOU
                                  </span>
                                )}
                                {pokemon.isRestricted && (
                                  <span title={t("badge.restrictedTitle")}><Star className="w-3 h-3 text-yellow-400 shrink-0" /></span>
                                )}
                                {pokemon.isMythical && (
                                  <span title={t("badge.mythicalTitle")}><Sparkles className="w-3 h-3 text-purple-400 shrink-0" /></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Types */}
                        <td className="px-3 py-2.5">
                          <div className="flex gap-0.5 justify-center">
                            {pokemon.types.map((type) => (
                              <TypeBadgeSmall key={type} type={type} className="!m-0" />
                            ))}
                          </div>
                        </td>

                        {/* Numeric speed columns */}
                        <SpeedCell value={pokemon.baseSpeed} zone={null} isRefCol={false} />
                        <SpeedCell value={speeds?.s0n    ?? null} zone={null} isRefCol={false} />
                        <SpeedCell value={speeds?.s0p    ?? null} zone={null} isRefCol={false} />
                        <SpeedCell value={speeds?.s252n  ?? null} zone={null} isRefCol={false} />
                        <SpeedCell value={speeds?.s252p  ?? null} zone={zone} isRefCol={true}  />
                        <SpeedCell value={speeds?.scarf  ?? null} zone={null} isRefCol={false} />
                        <SpeedCell value={speeds?.scarfPlus ?? null} zone={null} isRefCol={false} />

                        {/* Expand chevron */}
                        <td className="px-2 py-2.5 text-center">
                          <ChevronRight
                            className={`w-4 h-4 text-ink-dim group-hover:text-ink-muted transition-all duration-200 ${
                              isExpanded ? "rotate-90 text-primary-hover" : ""
                            }`}
                          />
                        </td>
                      </tr>,

                      /* ── Expanded row ── */
                      isExpanded && (
                        <ExpandedRowContent
                          key={`${pokemon.name}-expanded`}
                          pokemon={pokemon}
                          speeds={speeds}
                          refEffective={refEffective}
                          colSpan={totalCols}
                          onSelectForMatchup={onSelectForMatchup}
                        />
                      ),
                    ];
                  })}

                  {/* Separator at the very end (all rows faster than you) */}
                  {separatorBeforeIdx === filteredSorted.length && refEffective !== null && (
                    <tr className="border-t-2 border-primary/40">
                      <td colSpan={totalCols} className="px-4 py-2 bg-layer-1/80">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-red-500/30" />
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-hover uppercase tracking-widest whitespace-nowrap">
                            <Zap className="w-3.5 h-3.5 text-primary-hover" />
                            {t("zones.separator")}: {refEffective}
                            <span className="text-ink-muted font-normal normal-case tracking-normal text-[11px]">
                              (all Pokémon are faster)
                            </span>
                          </div>
                          <div className="flex-1 h-px bg-layer-3" />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {!loading && !error && filteredSorted.length > 0 && (
          <p className="text-xs text-ink-dim text-center">{t("footer")}</p>
        )}
      </div>
    </div>
  );
}

