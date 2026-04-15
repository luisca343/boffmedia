"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Star, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";
import {
  VgcService,
  ChampionsRegulation,
  SpeedTierEntry,
} from "@/services/api/boffmedia/vgcService";

type SortKey = "name" | "baseSpeed" | "min" | "minPlus" | "max" | "maxPlus" | "scarf" | "scarfPlus";
type SortDir = "asc" | "desc";

function pokemonSpriteUrl(name: string) {
  const id = name.toLowerCase().replace(/\s+/g, "-");
  return `https://play.pokemonshowdown.com/sprites/dex/${id}.png`;
}

function SpeedCell({
  value,
  highlight,
}: {
  value: number | null;
  highlight: number | null;
}) {
  if (value === null) {
    return (
      <td className="px-3 py-2 text-center text-surface-600 text-sm select-none" title="Cannot hold Choice Scarf">
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

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (col !== sortKey)
    return <ChevronUp className="w-3 h-3 opacity-20 inline ml-1" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1 text-primary-400" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1 text-primary-400" />
  );
}

export default function SpeedTiersPage() {
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);
  const [selectedReg, setSelectedReg] = useState<string>("vgc2026regma");
  const [speedTiers, setSpeedTiers] = useState<SpeedTierEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("baseSpeed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const highlightSpeed = useMemo(() => {
    const v = parseInt(highlightInput, 10);
    return isNaN(v) ? null : v;
  }, [highlightInput]);

  useEffect(() => {
    VgcService.getChampionsRegulations()
      .then((res) => {
        const regs = res.data ?? [];
        setRegulations(regs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSearch("");
    setHighlightInput("");
    VgcService.getChampionsSpeedTiers(selectedReg)
      .then((res) => setSpeedTiers(res.data ?? []))
      .catch(() => setError("Failed to load speed tiers. Make sure the API is running."))
      .finally(() => setLoading(false));
  }, [selectedReg]);

  const handleSort = useCallback(
    (col: SortKey) => {
      if (col === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(col);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  const filtered = useMemo(() => {
    let list = speedTiers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortKey) {
        case "name":
          va = a.name;
          vb = b.name;
          break;
        case "baseSpeed":
          va = a.baseSpeed;
          vb = b.baseSpeed;
          break;
        case "min":
          va = a.speedTiers.min;
          vb = b.speedTiers.min;
          break;
        case "minPlus":
          va = a.speedTiers.minPlus;
          vb = b.speedTiers.minPlus;
          break;
        case "max":
          va = a.speedTiers.max;
          vb = b.speedTiers.max;
          break;
        case "maxPlus":
          va = a.speedTiers.maxPlus;
          vb = b.speedTiers.maxPlus;
          break;
        case "scarf":
          va = a.speedTiers.scarf;
          vb = b.speedTiers.scarf;
          break;
        case "scarfPlus":
          va = a.speedTiers.scarfPlus;
          vb = b.speedTiers.scarfPlus;
          break;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [speedTiers, search, sortKey, sortDir]);

  const selectedRegData = regulations.find((r) => r.id === selectedReg);

  const columns: { key: SortKey; label: string; title: string }[] = [
    { key: "baseSpeed", label: "Base", title: "Base Speed stat" },
    { key: "min", label: "0/N", title: "0 EVs, Neutral nature" },
    { key: "minPlus", label: "0/+", title: "0 EVs, +Speed nature" },
    { key: "max", label: "252/N", title: "252 EVs, Neutral nature" },
    { key: "maxPlus", label: "252/+", title: "252 EVs, +Speed nature" },
    { key: "scarf", label: "Scarf", title: "252 EVs, Choice Scarf" },
    { key: "scarfPlus", label: "Scarf+", title: "252 EVs, +Speed, Choice Scarf" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
            <Zap className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-surface-50">Speed Tiers</h1>
            <p className="text-surface-400 text-sm">
              Level 50 speed stats for legal Pokémon — sorted by base Speed
            </p>
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
        {regulations.length === 0
          ? ["vgc2026regma", "vgc2026regmabo3", "bssregma", "ou"].map((id) => (
              <button
                key={id}
                onClick={() => setSelectedReg(id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedReg === id
                    ? "bg-primary-500/20 border-primary-500/60 text-primary-300"
                    : "border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200"
                }`}
              >
                {id}
              </button>
            ))
          : regulations.map((reg) => (
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
        {selectedRegData?.notes && (
          <span className="self-center text-xs text-surface-500 italic">
            {selectedRegData.notes}
          </span>
        )}
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
            placeholder="Filter Pokémon..."
            className="pl-9 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500"
          />
        </div>
        <div className="relative max-w-[200px]">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <Input
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            placeholder="Highlight speed..."
            type="number"
            min={1}
            max={999}
            className="pl-9 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500"
          />
        </div>
        {highlightSpeed !== null && (
          <p className="self-center text-xs text-surface-400">
            Showing&nbsp;
            <span className="text-primary-300 font-semibold">{highlightSpeed}</span>
            &nbsp;speed tier
          </p>
        )}
        {!loading && (
          <p className="self-center text-xs text-surface-500 ml-auto">
            {filtered.length} Pokémon
          </p>
        )}
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-surface-500">
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-400" /> Restricted
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Mythical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary-500/30 ring-1 ring-primary-400/50 inline-block" />
          Highlighted speed tier
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
          <div className="py-24 text-center text-surface-400 animate-pulse">
            Loading speed tiers...
          </div>
        ) : error ? (
          <div className="py-24 text-center text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-surface-500">No Pokémon found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface-900 border-b border-surface-800">
                  <th className="px-3 py-3 text-left w-10 text-surface-500 font-medium">#</th>
                  <th className="px-3 py-3 text-left min-w-[220px]">
                    <button
                      onClick={() => handleSort("name")}
                      className="text-surface-300 hover:text-surface-100 font-semibold uppercase tracking-wider text-xs transition-colors"
                    >
                      Pokémon
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
                </tr>
                <tr className="bg-surface-900/60 border-b border-surface-800/50">
                  <td colSpan={2} />
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-1 text-center">
                      <span className="text-[10px] text-surface-600">{col.title}</span>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((pokemon, idx) => {
                  const prevBase = idx > 0 ? filtered[idx - 1].baseSpeed : null;
                  const isNewGroup =
                    sortKey === "baseSpeed" && prevBase !== null && prevBase !== pokemon.baseSpeed;

                  return [
                    isNewGroup && (
                      <tr key={`divider-${idx}`} aria-hidden>
                        <td
                          colSpan={9}
                          className="h-px bg-surface-800/60 border-0 p-0"
                        />
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
                      {/* Row number */}
                      <td className="px-3 py-2 text-surface-600 text-xs tabular-nums">
                        {idx + 1}
                      </td>

                      {/* Pokemon info */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {/* Sprite */}
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

                          {/* Name + badges + types */}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-surface-100 truncate">
                                {pokemon.name}
                              </span>
                              {pokemon.isRestricted && (
                                <span
                                  title="Restricted Legendary"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                                >
                                  <Star className="w-2.5 h-2.5" />
                                  Restricted
                                </span>
                              )}
                              {pokemon.isMythical && (
                                <span
                                  title="Mythical Pokémon"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Mythical
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

                      {/* Speed cells */}
                      <SpeedCell value={pokemon.baseSpeed} highlight={highlightSpeed} />
                      <SpeedCell value={pokemon.speedTiers.min} highlight={highlightSpeed} />
                      <SpeedCell value={pokemon.speedTiers.minPlus} highlight={highlightSpeed} />
                      <SpeedCell value={pokemon.speedTiers.max} highlight={highlightSpeed} />
                      <SpeedCell value={pokemon.speedTiers.maxPlus} highlight={highlightSpeed} />
                      <SpeedCell value={pokemon.speedTiers.scarf} highlight={highlightSpeed} />
                      <SpeedCell value={pokemon.speedTiers.scarfPlus} highlight={highlightSpeed} />
                    </tr>,
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Column legend */}
      {!loading && !error && filtered.length > 0 && (
        <p className="text-xs text-surface-600 text-center">
          N = Neutral nature · + = +Speed nature · all calculations at level 50 · 31 IVs
        </p>
      )}
    </div>
  );
}
