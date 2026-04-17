"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Swords, Search, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { ModifierPanel } from "../_components/ModifierPanel";
import { applyMods, compareSpeed, DEFAULT_MODIFIERS, Modifiers } from "../speedCalc";
import { VgcService, SpeedTierEntry } from "@/services/api/boffmedia/vgcService";

interface TeamMember {
  id: string;
  name: string;
  speed: string;
  mods: Modifiers;
}

interface OpponentState {
  name: string;
  speed: string;
  pokemon: SpeedTierEntry | null;
  mods: Modifiers;
}

let _id = 1;
const genId = () => String(_id++);

function newMember(): TeamMember {
  return { id: genId(), name: "", speed: "", mods: DEFAULT_MODIFIERS };
}

function calcEffective(speed: string, mods: Modifiers): number | null {
  const v = parseInt(speed, 10);
  if (isNaN(v) || v <= 0) return null;
  return applyMods(v, mods, true);
}

function ResultBadge({
  mySpeed,
  opponentSpeed,
  t,
}: {
  mySpeed: number | null;
  opponentSpeed: number | null;
  t: ReturnType<typeof useTranslations>;
}) {
  if (mySpeed === null || opponentSpeed === null) return null;
  const result = compareSpeed(mySpeed, opponentSpeed);
  const diff = mySpeed - opponentSpeed;
  if (result === "faster") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 whitespace-nowrap">
        ▲ {t("faster")} +{diff}
      </span>
    );
  }
  if (result === "slower") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 whitespace-nowrap">
        ▼ {t("slower")} {diff}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 whitespace-nowrap">
      = {t("tie")}
    </span>
  );
}

function pokemonSpriteUrl(name: string) {
  return `https://play.pokemonshowdown.com/sprites/dex/${name.toLowerCase().replace(/\s+/g, "-")}.png`;
}

export default function SpeedComparisonPage() {
  const t = useTranslations("vgc.speedComparison");
  const [speedTiers, setSpeedTiers] = useState<SpeedTierEntry[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [opponent, setOpponent] = useState<OpponentState>({
    name: "",
    speed: "",
    pokemon: null,
    mods: DEFAULT_MODIFIERS,
  });
  const [team, setTeam] = useState<TeamMember[]>([newMember(), newMember(), newMember()]);

  useEffect(() => {
    VgcService.getChampionsSpeedTiers("vgc2026regma")
      .then((res) => setSpeedTiers(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingTiers(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery === opponent.name) return [];
    const q = searchQuery.toLowerCase();
    return speedTiers.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [speedTiers, searchQuery, opponent.name]);

  const opponentEffective = useMemo(
    () => calcEffective(opponent.speed, opponent.mods),
    [opponent.speed, opponent.mods]
  );

  const selectPokemon = (p: SpeedTierEntry) => {
    setOpponent((prev) => ({
      ...prev,
      name: p.name,
      speed: String(p.speedTiers.max),
      pokemon: p,
    }));
    setSearchQuery(p.name);
    setShowDropdown(false);
  };

  const clearOpponent = () => {
    setOpponent({ name: "", speed: "", pokemon: null, mods: DEFAULT_MODIFIERS });
    setSearchQuery("");
  };

  const updateMember = (id: string, update: Partial<Omit<TeamMember, "id">>) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...update } : m)));
  };

  const addMember = () => {
    if (team.length < 6) setTeam((prev) => [...prev, newMember()]);
  };

  const removeMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const refSpeeds = useMemo(() => {
    const p = opponent.pokemon;
    if (!p) return [];
    const chips: { label: string; value: number }[] = [
      { label: "0/N", value: p.speedTiers.min },
      { label: "0/+", value: p.speedTiers.minPlus },
      { label: "252/N", value: p.speedTiers.max },
      { label: "252/+", value: p.speedTiers.maxPlus },
    ];
    if (p.speedTiers.scarf !== null) {
      chips.push({ label: "Scarf", value: p.speedTiers.scarf });
      if (p.speedTiers.scarfPlus !== null) chips.push({ label: "Scarf+", value: p.speedTiers.scarfPlus });
    }
    return chips;
  }, [opponent.pokemon]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
          <Swords className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-surface-50">{t("title")}</h1>
          <p className="text-surface-400 text-sm">{t("subtitle")}</p>
        </div>
      </motion.div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">

        {/* ── Opponent panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-surface-800 bg-surface-900/50">
            <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
              {t("opponentTitle")}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) setOpponent((prev) => ({ ...prev, pokemon: null, name: "" }));
                  }}
                  onFocus={() => { if (searchQuery) setShowDropdown(true); }}
                  placeholder={t("opponentSearch")}
                  className="pl-9 pr-8 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearOpponent}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-surface-500 hover:text-surface-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 rounded-lg border border-surface-700 bg-surface-900 shadow-xl overflow-hidden">
                  {loadingTiers ? (
                    <div className="px-3 py-2 text-sm text-surface-400">{t("loading")}</div>
                  ) : (
                    searchResults.map((p) => (
                      <button
                        key={p.name}
                        onMouseDown={() => selectPokemon(p)}
                        className="w-full text-left px-3 py-2 hover:bg-surface-800 transition-colors flex items-center gap-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pokemonSpriteUrl(p.name)} alt={p.name} width={24} height={24} className="object-contain" />
                        <span className="text-sm text-surface-200">{p.name}</span>
                        <span className="ml-auto text-xs text-surface-500 font-mono">{p.baseSpeed}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Reference speed chips */}
            {refSpeeds.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-surface-500 uppercase tracking-wider">{t("referenceSpeed")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {refSpeeds.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => setOpponent((prev) => ({ ...prev, speed: String(chip.value) }))}
                      className={`px-2 py-0.5 rounded text-xs font-mono border transition-all ${
                        opponent.speed === String(chip.value)
                          ? "bg-primary-500/20 border-primary-500/50 text-primary-300"
                          : "bg-surface-800 border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-600"
                      }`}
                    >
                      {chip.label}: {chip.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual speed */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider">{t("opponentManual")}</span>
              <Input
                value={opponent.speed}
                onChange={(e) => setOpponent((prev) => ({ ...prev, speed: e.target.value }))}
                placeholder={t("opponentSpeedPlaceholder")}
                type="number"
                min={1}
                max={999}
                className="bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500"
              />
            </div>

            {/* Opponent modifiers */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider">{t("opponentModifiers")}</span>
              <ModifierPanel
                modifiers={opponent.mods}
                onChange={(m) => setOpponent((prev) => ({ ...prev, mods: m }))}
              />
            </div>

            {/* Effective speed */}
            <div className="rounded-lg bg-surface-900 border border-surface-800 px-4 py-4 text-center">
              <div className="text-[10px] text-surface-500 uppercase tracking-wider mb-1">{t("effectiveSpeed")}</div>
              <div className="text-5xl font-bold font-mono text-surface-50 tabular-nums">
                {opponentEffective !== null ? opponentEffective : "—"}
              </div>
              {opponent.name && (
                <div className="text-xs text-surface-400 mt-1.5">{opponent.name}</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── My Team panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="rounded-xl border border-surface-800 bg-surface-950 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800 bg-surface-900/50">
            <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
              {t("myTeamTitle")} ({team.length}/6)
            </h2>
            <button
              onClick={() => setTeam(team.map((m) => ({ ...m, name: "", speed: "", mods: DEFAULT_MODIFIERS })))}
              className="text-xs text-surface-500 hover:text-red-400 transition-colors"
            >
              {t("clearTeam")}
            </button>
          </div>

          <div className="divide-y divide-surface-800/60">
            {team.map((member, idx) => {
              const effective = calcEffective(member.speed, member.mods);
              return (
                <div key={member.id} className="px-4 py-3 space-y-2.5">
                  {/* Row: index + inputs + result + remove */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-surface-600 w-4 shrink-0 text-center">{idx + 1}</span>
                    <Input
                      value={member.name}
                      onChange={(e) => updateMember(member.id, { name: e.target.value })}
                      placeholder={t("teamMemberName")}
                      className="flex-1 h-8 text-sm bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-600"
                    />
                    <Input
                      value={member.speed}
                      onChange={(e) => updateMember(member.id, { speed: e.target.value })}
                      placeholder={t("teamMemberSpeed")}
                      type="number"
                      min={1}
                      max={999}
                      className="w-28 h-8 text-sm font-mono bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-600"
                    />
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-1.5 text-surface-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Effective speed + result badge */}
                  <div className="flex items-center gap-3 pl-6">
                    <div className="text-[10px] text-surface-500 uppercase tracking-wider shrink-0">
                      {t("effectiveSpeed")}
                    </div>
                    <div className="text-lg font-bold font-mono text-surface-200 tabular-nums min-w-[2.5rem]">
                      {effective !== null ? effective : <span className="text-surface-700 text-base">—</span>}
                    </div>
                    {opponentEffective !== null && effective !== null && (
                      <ResultBadge mySpeed={effective} opponentSpeed={opponentEffective} t={t} />
                    )}
                    {opponentEffective === null && (
                      <span className="text-xs text-surface-600 italic">{t("noOpponent")}</span>
                    )}
                  </div>

                  {/* Per-member modifier panel */}
                  <div className="pl-6">
                    <ModifierPanel
                      modifiers={member.mods}
                      onChange={(m) => updateMember(member.id, { mods: m })}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {team.length < 6 && (
            <div className="px-4 py-3 border-t border-surface-800/60">
              <button
                onClick={addMember}
                className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("addMember")}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
