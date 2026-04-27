"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";
import { PokemonUsageDetail } from "@/services/api/boffmedia/vgcService";
import { TypeBadgeSmall } from "@/components/shared/pokemon/TypeBadge";
import { BaseStatsPanel } from "./BaseStatsPanel";
import { StatPanel } from "./StatPanel";
import { TeammatesPanel } from "./TeammatesPanel";
import { TeraTypesPanel } from "./TeraTypesPanel";

// ─── Spread / nature helpers ──────────────────────────────────────────────────

const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatKey = (typeof STAT_ORDER)[number];

const STAT_META: Record<StatKey, { label: string; color: string }> = {
  hp:  { label: "HP",  color: "#ff5959" },
  atk: { label: "Atk", color: "#f5ac78" },
  def: { label: "Def", color: "#fae078" },
  spa: { label: "SpA", color: "#9db7f5" },
  spd: { label: "SpD", color: "#a7db8d" },
  spe: { label: "Spe", color: "#fa92b2" },
};

const NATURE_CHANGES: Record<string, { plus: StatKey; minus: StatKey } | null> = {
  Hardy: null, Docile: null, Serious: null, Bashful: null, Quirky: null,
  Lonely:  { plus: "atk", minus: "def" },
  Brave:   { plus: "atk", minus: "spe" },
  Adamant: { plus: "atk", minus: "spa" },
  Naughty: { plus: "atk", minus: "spd" },
  Bold:    { plus: "def", minus: "atk" },
  Relaxed: { plus: "def", minus: "spe" },
  Impish:  { plus: "def", minus: "spa" },
  Lax:     { plus: "def", minus: "spd" },
  Modest:  { plus: "spa", minus: "atk" },
  Mild:    { plus: "spa", minus: "def" },
  Quiet:   { plus: "spa", minus: "spe" },
  Rash:    { plus: "spa", minus: "spd" },
  Calm:    { plus: "spd", minus: "atk" },
  Gentle:  { plus: "spd", minus: "def" },
  Sassy:   { plus: "spd", minus: "spe" },
  Careful: { plus: "spd", minus: "spa" },
  Timid:   { plus: "spe", minus: "atk" },
  Hasty:   { plus: "spe", minus: "def" },
  Jolly:   { plus: "spe", minus: "spa" },
  Naive:   { plus: "spe", minus: "spd" },
};

function SpreadRow({ nature, spread }: { nature: string; spread: string }) {
  const changes = NATURE_CHANGES[nature] ?? null;
  const values  = spread.split("/").map(Number);
  const nonZero = STAT_ORDER
    .map((stat, i) => ({ stat, value: values[i] ?? 0 }))
    .filter(({ value }) => value > 0);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-surface-300 leading-tight">
        {nature}
        {changes && (
          <span className="ml-1.5 text-[10px] font-normal">
            <span style={{ color: STAT_META[changes.plus].color }}>
              +{STAT_META[changes.plus].label}
            </span>{" "}
            <span className="text-red-400">
              -{STAT_META[changes.minus].label}
            </span>
          </span>
        )}
      </p>
      <p className="text-[11px] font-mono leading-tight mt-0.5">
        {nonZero.map(({ stat, value }, i) => (
          <span key={stat}>
            {i > 0 && <span className="text-surface-700"> / </span>}
            <span className="text-surface-400">{value} </span>
            <span style={{ color: STAT_META[stat].color }}>
              {STAT_META[stat].label}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  detail:    PokemonUsageDetail | null;
  loading:   boolean;
  speciesId: string | undefined;
  onBack:    () => void;
  onSelect?: (speciesId: string) => void;
}

export function PokemonDetailView({ detail, loading, speciesId, onBack, onSelect }: Props) {
  const t = useTranslations("vgc.meta");

  if (!speciesId) {
    return (
      <div className="flex items-center justify-center h-full text-surface-600 text-sm">
        —
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-surface-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{t("detail.loading")}</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        {t("detail.notFound")}
      </div>
    );
  }


  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-surface-800 bg-surface-950/95 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-1 text-surface-400 hover:text-surface-200 text-sm transition-colors mr-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("detail.backToList")}
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spriteUrl(detail.speciesName)}
          alt={detail.speciesName}
          width={56}
          height={56}
          className="object-contain drop-shadow-md shrink-0"
          onError={handleSpriteError}
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-surface-50 leading-tight">
            {detail.speciesName}
          </h2>
          {detail.types.length > 0 && (
            <div className="flex flex-wrap gap-0.5 my-0.5">
              {detail.types.map((type) => (
                <TypeBadgeSmall key={type} type={type} className="m-0" />
              ))}
            </div>
          )}
          <p className="text-sm text-surface-400">
            {detail.usagePercent.toFixed(1)}% usage
            <span className="mx-1.5 text-surface-700">·</span>
            {t("detail.battles", { count: detail.rawCount })}
          </p>
        </div>
      </div>

      {/* Panel grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Base Stats — always first */}
        {detail.baseStats && (
          <BaseStatsPanel baseStats={detail.baseStats} speciesName={detail.speciesName} />
        )}

        <StatPanel title={t("detail.moves")} items={detail.moves.slice(0, 10)} />
        <StatPanel title={t("detail.items")} items={detail.items.slice(0, 8)} />

        {/* Abilities + Tera Types share one column — both are small sections */}
        <div className="flex flex-col gap-4">
          <StatPanel title={t("detail.abilities")} items={detail.abilities} />
          <TeraTypesPanel title={t("detail.teraTypes")} items={detail.teraTypes} />
        </div>

        <TeammatesPanel
          title={t("detail.teammates")}
          items={detail.teammates}
          onSelect={onSelect}
        />

        {/* EV Spreads */}
        <div className="rounded-xl border border-surface-800 bg-surface-950 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-surface-300 mb-3">
            {t("detail.spreads")}
          </h3>
          <div className="space-y-2">
            {detail.spreads.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <SpreadRow nature={s.nature} spread={s.spread} />
                <span className="text-xs text-surface-200 tabular-nums font-mono shrink-0 w-12 text-right pt-0.5">
                  {s.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
