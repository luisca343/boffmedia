"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search, Zap, Star, Sparkles, ChevronUp, ChevronDown, Plus, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";
import { ModifierPanel } from "../_components/ModifierPanel";
import {
  computeSpeeds,
  calcSpeedStat,
  applyMods,
  DEFAULT_MODIFIERS,
  Modifiers,
  ComputedSpeeds,
  compareSpeed,
} from "../speedCalc";
import {
  VgcService,
  ChampionsRegulation,
  SpeedTierEntry,
} from "@/services/api/boffmedia/vgcService";

type SortKey = "name" | "baseSpeed" | "s0n" | "s0p" | "s252n" | "s252p" | "scarf" | "scarfPlus";
type SortDir = "asc" | "desc";

interface TeamMember {
  entry: SpeedTierEntry;
  mods: Modifiers;
  manualSpeed: string;
}

function pokemonSpriteUrl(name: string) {
  return `https://play.pokemonshowdown.com/sprites/dex/${name.toLowerCase().replace(/\s+/g, "-")}.png`;
}

function getMemberEffective(member: TeamMember): number {
  const manual = parseInt(member.manualSpeed, 10);
  if (!isNaN(manual) && manual > 0) {
    return applyMods(manual, member.mods, true);
  }
  const stat = calcSpeedStat(member.entry.baseSpeed, 252, 1.0);
  return applyMods(stat, member.mods, !member.entry.requiredItem);
}

function SpeedCell({ value, highlight }: { value: number | null; highlight: number | null }) {
  const t = useTranslations("vgc.speedTiers");
  if (value === null) {
    return (
      <td className="px-3 py-2 text-center text-surface-600 text-sm select-none" title={t("columns.noScarf")}>
        —
      </td>
    );
  }
  const isHighlighted = highlight !== null && value === highlight;
  const isNear = highlight !== null && Math.abs(value - highlight) <= 1 && !isHighlighted;
  return (
    <td
      className={`px-3 py-2 text-center font-mono text-sm tabular-nums transition-colors ${
        isHighlighted
          ? "bg-primary-500/30 text-primary-200 font-bold ring-1 ring-inset ring-primary-400/50"
          : isNear
          ? "bg-primary-900/20 text-primary-300"
          : "text-surface-200"
      }`}
    >
      {value}
    </td>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp className="w-3 h-3 opacity-20 inline ml-1" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1 text-primary-400" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1 text-primary-400" />
  );
}

function ComparisonDots({
  pokSpeeds,
  team,
}: {
  pokSpeeds: ComputedSpeeds | undefined;
  team: TeamMember[];
}) {
  if (!pokSpeeds) return <td className="px-2 py-2" />;
  return (
    <td className="px-2 py-2">
      <div className="flex gap-1 justify-center flex-wrap">
        {team.map((member) => {
          const memberEffective = getMemberEffective(member);
          const result = compareSpeed(pokSpeeds.s252p, memberEffective);
          return (
            <span
              key={member.entry.name}
              title={`${member.entry.name} (${memberEffective}): ${result}`}
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                result === "faster" ? "bg-red-400" : result === "tie" ? "bg-yellow-400" : "bg-green-400"
              }`}
            />
          );
        })}
      </div>
    </td>
  );
}

export default function SpeedTiersPage() {
  const t = useTranslations("vgc.speedTiers");
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);
  const [selectedReg, setSelectedReg] = useState<string>("vgc2026regma");
  const [speedTiers, setSpeedTiers] = useState<SpeedTierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("baseSpeed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modifiers, setModifiers] = useState<Modifiers>(DEFAULT_MODIFIERS);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [filterOutspeedsTeam, setFilterOutspeedsTeam] = useState(false);

  const highlightSpeed = useMemo(() => {
    const v = parseInt(highlightInput, 10);
    return isNaN(v) ? null : v;
  }, [highlightInput]);

  useEffect(() => {
    VgcService.getChampionsRegulations()
      .then((res) => setRegulations(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSearch("");
    setHighlightInput("");
    setTeam([]);
    VgcService.getChampionsSpeedTiers(selectedReg)
      .then((res) => setSpeedTiers(res.data ?? []))
      .catch(() => setError(t("error")))
      .finally(() => setLoading(false));
  }, [selectedReg]);

  const computedMap = useMemo(() => {
    const map = new Map<string, ComputedSpeeds>();
    for (const p of speedTiers) {
      map.set(p.name, computeSpeeds(p.baseSpeed, p.requiredItem, modifiers));
    }
    return map;
  }, [speedTiers, modifiers]);

  const handleSort = useCallback(
    (col: SortKey) => {
      if (col === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortKey(col); setSortDir("desc"); }
    },
    [sortKey]
  );

  const isInTeam = useCallback((name: string) => team.some((m) => m.entry.name === name), [team]);

  const toggleTeamMember = useCallback((entry: SpeedTierEntry) => {
    setTeam((prev) => {
      const exists = prev.some((m) => m.entry.name === entry.name);
      if (exists) return prev.filter((m) => m.entry.name !== entry.name);
      if (prev.length >= 6) return prev;
      return [...prev, { entry, mods: DEFAULT_MODIFIERS, manualSpeed: "" }];
    });
  }, []);

  const updateTeamMember = useCallback(
    (name: string, update: Partial<Pick<TeamMember, "mods" | "manualSpeed">>) => {
      setTeam((prev) => prev.map((m) => (m.entry.name === name ? { ...m, ...update } : m)));
    },
    []
  );

  const getVal = useCallback(
    (p: SpeedTierEntry, key: SortKey): number | string => {
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
    },
    [computedMap]
  );

  const filtered = useMemo(() => {
    let list = speedTiers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (filterOutspeedsTeam && team.length > 0) {
      list = list.filter((p) => {
        const ps = computedMap.get(p.name);
        if (!ps) return false;
        return team.some((member) => compareSpeed(ps.s252p, getMemberEffective(member)) !== "slower");
      });
    }
    return [...list].sort((a, b) => {
      const va = getVal(a, sortKey);
      const vb = getVal(b, sortKey);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [speedTiers, search, sortKey, sortDir, computedMap, filterOutspeedsTeam, team, getVal]);

  const selectedRegData = regulations.find((r) => r.id === selectedReg);
  const showScarfCols = !modifiers.scarf;
  const showComparisonCol = team.length > 0;

  const columns: { key: SortKey; label: string; title: string }[] = [
    { key: "baseSpeed", label: t("columns.base"), title: t("columns.baseTitle") },
    { key: "s0n", label: t("columns.minNeutral"), title: t("columns.minNeutralTitle") },
    { key: "s0p", label: t("columns.minPlus"), title: t("columns.minPlusTitle") },
    { key: "s252n", label: t("columns.maxNeutral"), title: t("columns.maxNeutralTitle") },
    { key: "s252p", label: t("columns.maxPlus"), title: t("columns.maxPlusTitle") },
    ...(showScarfCols
      ? [
          { key: "scarf" as SortKey, label: t("columns.scarf"), title: t("columns.scarfTitle") },
          { key: "scarfPlus" as SortKey, label: t("columns.scarfPlus"), title: t("columns.scarfPlusTitle") },
        ]
      : []),
  ];

  const totalCols = 2 + columns.length + (showComparisonCol ? 1 : 0) + 1;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
            <Zap className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-surface-50">{t("title")}</h1>
            <p className="text-surface-400 text-sm">{t("subtitle")}</p>
          </div>
        </div>
      </motion.div>

      {/* Regulation tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-wrap gap-2"
      >
        {(regulations.length === 0
          ? ["vgc2026regma", "vgc2026regmabo3", "bssregma", "ou"].map((id) => ({ id, name: id, notes: undefined }))
          : regulations
        ).map((reg) => (
          <button
            key={reg.id}
            onClick={() => setSelectedReg(reg.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              selectedReg === reg.id
                ? "bg-primary-500/20 border-primary-500/60 text-primary-300"
                : "border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200"
            }`}
          >
            {reg.name.replace(/\[Gen 9 Champions\]\s*/i, "")}
          </button>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="pl-9 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500"
          />
        </div>
        <div className="relative max-w-[200px]">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <Input
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            placeholder={t("highlightPlaceholder")}
            type="number"
            min={1}
            max={999}
            className="pl-9 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500"
          />
        </div>
        {highlightSpeed !== null && (
          <p className="self-center text-xs text-surface-400">{t("showingTier", { speed: highlightSpeed })}</p>
        )}
        {!loading && (
          <p className="self-center text-xs text-surface-500 ml-auto">
            {t("pokemonCount", { count: filtered.length })}
          </p>
        )}
      </motion.div>

      {/* Table modifier panel */}
      <ModifierPanel modifiers={modifiers} onChange={setModifiers} />

      {/* Team panel — always visible */}
      <div className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-800 bg-surface-900/50">
          <span className="text-[11px] text-surface-400 font-semibold uppercase tracking-wider">
            {t("team.title")} ({team.length}/6)
          </span>
          <div className="flex items-center gap-2">
            {team.length > 0 && (
              <button
                onClick={() => setFilterOutspeedsTeam((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                  filterOutspeedsTeam
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                    : "bg-surface-800/80 text-surface-400 border-transparent hover:text-surface-200 hover:bg-surface-700/60"
                }`}
              >
                <Filter className="w-3 h-3" />
                {t("team.filterToggle")}
              </button>
            )}
            {team.length > 0 && (
              <button
                onClick={() => { setTeam([]); setFilterOutspeedsTeam(false); }}
                className="text-xs text-surface-500 hover:text-red-400 transition-colors"
              >
                {t("team.clearTeam")}
              </button>
            )}
          </div>
        </div>

        {team.length === 0 ? (
          <div className="px-4 py-6 text-center text-surface-600 text-sm">
            Click <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-surface-700 text-surface-400 text-xs mx-1"><Plus className="w-3 h-3" /> Team</span> on any Pokémon below to add it here
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
            {team.map((member) => {
              const effective = getMemberEffective(member);
              return (
                <div key={member.entry.name} className="rounded-lg border border-surface-700 bg-surface-900 overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pokemonSpriteUrl(member.entry.name)}
                      alt={member.entry.name}
                      width={32}
                      height={32}
                      className="object-contain shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-surface-100 truncate leading-tight">
                        {member.entry.name}
                      </span>
                      <span className="text-[10px] text-surface-500">Base {member.entry.baseSpeed}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                      <span className="text-base font-bold font-mono text-primary-300 tabular-nums">
                        {effective}
                      </span>
                      <button
                        onClick={() => setTeam((prev) => prev.filter((m) => m.entry.name !== member.entry.name))}
                        className="p-1 text-surface-600 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Manual speed input */}
                  <div className="px-3 pb-2 flex items-center gap-2 border-t border-surface-800">
                    <span className="text-[10px] text-surface-500 uppercase tracking-wider shrink-0 pt-2">
                      Speed stat
                    </span>
                    <Input
                      value={member.manualSpeed}
                      onChange={(e) => updateTeamMember(member.entry.name, { manualSpeed: e.target.value })}
                      placeholder={String(calcSpeedStat(member.entry.baseSpeed, 252, 1.0))}
                      type="number"
                      min={1}
                      max={999}
                      className="h-7 text-xs font-mono mt-2 bg-surface-800 border-surface-700 text-surface-100 placeholder:text-surface-600"
                    />
                  </div>

                  {/* Individual modifier panel */}
                  <div className="px-3 pb-3 border-t border-surface-800 pt-2">
                    <ModifierPanel
                      modifiers={member.mods}
                      onChange={(m) => updateTeamMember(member.entry.name, { mods: m })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison legend */}
        {showComparisonCol && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-surface-800 text-xs text-surface-500">
            <span className="text-[10px] uppercase tracking-wider font-semibold">vs Team (252/+ → member effective)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />{t("comparison.faster")}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />{t("comparison.tie")}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />{t("comparison.slower")}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-surface-500">
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-400" /> {t("legend.restricted")}
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> {t("legend.mythical")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary-500/30 ring-1 ring-primary-400/50 inline-block" />
          {t("legend.highlighted")}
        </span>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="rounded-xl border border-surface-800 overflow-hidden bg-surface-950"
      >
        {loading ? (
          <div className="py-24 text-center text-surface-400 animate-pulse">{t("loading")}</div>
        ) : error ? (
          <div className="py-24 text-center text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-surface-500">{t("empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-900 border-b border-surface-800">
                  <th className="px-3 py-3 text-left w-10 text-surface-500 font-medium">{t("columns.number")}</th>
                  <th className="px-3 py-3 text-left min-w-[220px]">
                    <button
                      onClick={() => handleSort("name")}
                      className="text-surface-300 hover:text-surface-100 font-semibold uppercase tracking-wider text-xs transition-colors"
                    >
                      {t("columns.pokemon")}
                      <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleSort(col.key)}
                        title={col.title}
                        className="text-surface-300 hover:text-surface-100 font-semibold uppercase tracking-wider text-xs transition-colors"
                      >
                        {col.label}
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </th>
                  ))}
                  {showComparisonCol && (
                    <th className="px-2 py-3 text-center text-surface-400 font-semibold uppercase tracking-wider text-xs">
                      {t("comparison.column")}
                    </th>
                  )}
                  <th className="px-3 py-3 text-center text-surface-500 font-semibold uppercase tracking-wider text-xs w-28">
                    Team
                  </th>
                </tr>
                <tr className="bg-surface-900/60 border-b border-surface-800/50">
                  <td colSpan={2} />
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-1 text-center">
                      <span className="text-[10px] text-surface-600">{col.title}</span>
                    </td>
                  ))}
                  {showComparisonCol && <td />}
                  <td />
                </tr>
              </thead>
              <tbody>
                {filtered.map((pokemon, idx) => {
                  const speeds = computedMap.get(pokemon.name);
                  const inTeam = isInTeam(pokemon.name);
                  const canAdd = !inTeam && team.length < 6;
                  const prevBase = idx > 0 ? filtered[idx - 1].baseSpeed : null;
                  const isNewGroup = sortKey === "baseSpeed" && prevBase !== null && prevBase !== pokemon.baseSpeed;

                  return [
                    isNewGroup && (
                      <tr key={`divider-${idx}`} aria-hidden>
                        <td colSpan={totalCols} className="h-px bg-surface-800/60 border-0 p-0" />
                      </tr>
                    ),
                    <tr
                      key={pokemon.name}
                      className={`group border-b border-surface-800/40 transition-colors hover:bg-surface-900/60 ${
                        pokemon.isRestricted
                          ? "border-l-2 border-l-yellow-500/50"
                          : pokemon.isMythical
                          ? "border-l-2 border-l-purple-500/40"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-surface-600 text-xs tabular-nums">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={pokemonSpriteUrl(pokemon.name)}
                              alt={pokemon.name}
                              width={40}
                              height={40}
                              className="object-contain drop-shadow-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-surface-100 truncate">{pokemon.name}</span>
                              {pokemon.isRestricted && (
                                <span
                                  title={t("badge.restrictedTitle")}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                                >
                                  <Star className="w-2.5 h-2.5" />
                                  {t("badge.restricted")}
                                </span>
                              )}
                              {pokemon.isMythical && (
                                <span
                                  title={t("badge.mythicalTitle")}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {t("badge.mythical")}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-0.5">
                              {pokemon.types.map((type) => (
                                <TypeBadgeSmall key={type} type={type} className="!m-0" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {columns.map((col) => {
                        let value: number | null;
                        switch (col.key) {
                          case "baseSpeed": value = pokemon.baseSpeed; break;
                          case "s0n": value = speeds?.s0n ?? null; break;
                          case "s0p": value = speeds?.s0p ?? null; break;
                          case "s252n": value = speeds?.s252n ?? null; break;
                          case "s252p": value = speeds?.s252p ?? null; break;
                          case "scarf": value = speeds?.scarf ?? null; break;
                          case "scarfPlus": value = speeds?.scarfPlus ?? null; break;
                          default: value = null;
                        }
                        return <SpeedCell key={col.key} value={value} highlight={highlightSpeed} />;
                      })}

                      {showComparisonCol && <ComparisonDots pokSpeeds={speeds} team={team} />}

                      <td className="px-3 py-2">
                        <button
                          onClick={() => toggleTeamMember(pokemon)}
                          disabled={!inTeam && team.length >= 6}
                          title={inTeam ? t("team.remove") : !canAdd ? t("team.full") : t("team.add")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            inTeam
                              ? "bg-primary-500/20 border-primary-500/50 text-primary-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
                              : !canAdd
                              ? "border-surface-800 text-surface-700 cursor-not-allowed"
                              : "border-surface-700 text-surface-500 hover:border-primary-500/50 hover:text-primary-300 hover:bg-primary-500/10"
                          }`}
                        >
                          {inTeam ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          Team
                        </button>
                      </td>
                    </tr>,
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {!loading && !error && filtered.length > 0 && (
        <p className="text-xs text-surface-600 text-center">{t("footer")}</p>
      )}
    </div>
  );
}
