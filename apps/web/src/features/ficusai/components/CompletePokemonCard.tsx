"use client";
import { useState, useMemo, FC } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Badge } from "@/components/ui/primitives/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";

import TypeBadge from "@/components/shared/pokemon/TypeBadge";
import MoveDataElement from "./MoveData";

import { getStatColor, statToPercentage, getTotalStatColor } from "@/lib/pokemonColors";
import { getTranslatedMoveName, getTranslatedMoveCategory, getTranslatedBiomeName, filterVisibleBiomes } from "@/utils/pokemonTranslations";
import { useSpriteManifestStore } from "@/stores/spriteManifestStore";

import { PokemonStats } from "../types";

export interface PokemonData {
  id: number;
  form?: string;
  pokemonName: string;
  types?: string[];
  stats?: PokemonStats;
  moves?: Record<string, any>;
  habitat?: string[];
}

interface PokemonDataCardProps {
  data: PokemonData;
}

/* ---------- Header ---------- */
const PokemonHeader: FC<{ sprite?: string; name: string; types?: string[] }> = ({ sprite, name, types }) => (
  <div className="text-center mb-6">
    {sprite && (
      <img
        src={sprite}
        alt={name}
        className="mx-auto mb-2 h-24 w-24 object-contain"
        loading="lazy"
        style={{ imageRendering: "pixelated" }}
      />
    )}
    <h2 className="text-2xl font-bold text-ink mb-3">{name}</h2>
    {types && types.length > 0 && (
      <div className="flex justify-center gap-2">
        {types.map((type, idx) => (
          <TypeBadge key={idx} type={type} />
        ))}
      </div>
    )}
  </div>
);

/* ---------- Stats Bar ---------- */
const StatBar: FC<{ label: string; value: number }> = ({ label, value }) => {
  const color = getStatColor(value);
  const percentage = statToPercentage(value);
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm text-ink font-medium">{label}:</div>
      <div className="w-12 text-sm text-ink font-mono text-right">{value}</div>
      <div className="flex-1">
        <div className="w-full bg-layer-3 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
};

/* ---------- Overview ---------- */
const OverviewSection: FC<{ stats?: PokemonStats; habitatCount: number; moveTypes: number; typeCount: number }> = ({
  stats,
  habitatCount,
  moveTypes,
  typeCount,
}) => {
  const totalStats = stats
    ? stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed
    : 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats && (
          <InfoCard value={totalStats} label="Total Base Stats" />
        )}
        <InfoCard value={habitatCount} label="Biomas" />
        <InfoCard value={moveTypes} label="Tipos de Movimientos" />
        <InfoCard value={typeCount} label="Tipos" />
      </div>

      {stats && (
        <div className="space-y-3">
          <h4 className="text-ink font-medium">Estadísticas Principales</h4>
          <StatBar label="PS" value={stats.hp} />
          <StatBar label="Ataque" value={stats.attack} />
          <StatBar label="Velocidad" value={stats.speed} />
        </div>
      )}
    </div>
  );
};

const InfoCard: FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="bg-layer-3/30 rounded-lg p-4 text-center">
    <div className="text-2xl font-bold text-ink">{value}</div>
    <div className="text-sm text-ink-muted">{label}</div>
  </div>
);

/* ---------- Full Stats ---------- */
const StatsSection: FC<{ stats: PokemonStats }> = ({ stats }) => {
  const totalStats = stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed;
  const statItems = [
    { label: "PS", value: stats.hp },
    { label: "Ataque", value: stats.attack },
    { label: "Defensa", value: stats.defense },
    { label: "At. Especial", value: stats.specialAttack },
    { label: "Def. Especial", value: stats.specialDefense },
    { label: "Velocidad", value: stats.speed },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-layer-3/30 rounded-lg p-4 mb-4 flex justify-between items-center">
        <span className="text-ink font-medium">Total Base Stats</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-ink">{totalStats}</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTotalStatColor(totalStats) }} />
        </div>
      </div>
      <div className="space-y-3">
        {statItems.map((s, i) => (
          <StatBar key={i} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
};

/* ---------- Moves ---------- */
const MovesSection: FC<{ moves: Record<string, any>; searchTerm: string; setSearchTerm: (v: string) => void; t: any }> = ({
  moves,
  searchTerm,
  setSearchTerm,
  t,
}) => {
  const filteredMoves = useMemo(() => {
    const filtered: Record<string, any> = {};
    Object.entries(moves).forEach(([type, moveList]) => {
      if (!moveList || (Array.isArray(moveList) && moveList.length === 0)) return;
      if (!searchTerm.trim()) return (filtered[type] = moveList);

      const match = (move: string) => {
        const translated = getTranslatedMoveName(move, t);
        return move.toLowerCase().includes(searchTerm.toLowerCase()) || translated.toLowerCase().includes(searchTerm.toLowerCase());
      };

      if (type === "levelUpMoves" && Array.isArray(moveList)) {
        const filteredLevels = moveList
          .map((lvl: any) => ({
            ...lvl,
            attacks: lvl.attacks?.filter(match),
          }))
          .filter((lvl: any) => lvl.attacks?.length);
        if (filteredLevels.length) filtered[type] = filteredLevels;
      } else if (Array.isArray(moveList)) {
        const filteredList = moveList.filter(match);
        if (filteredList.length) filtered[type] = filteredList;
      }
    });
    return filtered;
  }, [moves, searchTerm, t]);

  return (
    <div className="space-y-4">
      <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {Object.keys(filteredMoves).length === 0 && searchTerm ? (
  <div className="text-center py-8 text-ink-muted">No se encontraron movimientos con &quot;{searchTerm}&quot;</div>
      ) : (
        Object.entries(filteredMoves).map(([type, moveList], idx) => (
          <MoveCategory key={idx} type={type} moveList={moveList} t={t} />
        ))
      )}
    </div>
  );
};

const SearchInput: FC<{ searchTerm: string; setSearchTerm: (v: string) => void }> = ({ searchTerm, setSearchTerm }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted h-4 w-4" />
    <Input
      type="text"
      placeholder="Buscar movimiento..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 pr-10 bg-layer-3/50 border-edge text-ink placeholder:text-ink-muted"
    />
    {searchTerm && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSearchTerm("")}
        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-ink-muted hover:text-ink"
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
);

const MoveCategory: FC<{ type: string; moveList: any; t: any }> = ({ type, moveList, t }) => (
  <div className="bg-layer-3/30 rounded-lg p-4">
    <h4 className="text-primary-hover font-semibold mb-3">
      {getTranslatedMoveCategory(type, t)} (
      {type === "levelUpMoves" && Array.isArray(moveList)
        ? moveList.reduce((total: number, lvl: any) => total + (lvl.attacks?.length || 0), 0)
        : Array.isArray(moveList)
        ? moveList.length
        : 0}
      )
    </h4>
    {type === "levelUpMoves" && Array.isArray(moveList) ? (
      <div className="space-y-3">
        {moveList.map((lvl: any, i: number) => (
          <div key={i} className="space-y-2">
            <div className="text-sm font-medium text-ink">Nivel {lvl.level}</div>
            <MoveBadges moves={lvl.attacks} t={t} />
          </div>
        ))}
      </div>
    ) : (
      <MoveBadges moves={moveList} t={t} />
    )}
  </div>
);

const MoveBadges: FC<{ moves: string[]; t: any }> = ({ moves, t }) => (
  <div className="flex flex-wrap gap-2">
    {moves.map((move, idx) => (
      <HoverCard key={idx}>
        <HoverCardTrigger>
          <Badge variant="secondary" className="bg-layer-3 text-ink hover:bg-layer-3 text-xs cursor-pointer transition-colors">
            {getTranslatedMoveName(move, t)}
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent
          className="bg-layer-3 text-ink w-[400px] border-edge-strong border font-normal"
          style={{ zIndex: 9999 }}
          side="top"
          align="center"
        >
          <MoveDataElement id={move} />
        </HoverCardContent>
      </HoverCard>
    ))}
  </div>
);

/* ---------- Types ---------- */
const TypesSection: FC<{ name: string; types: string[] }> = ({ name, types }) => (
  <div className="space-y-4">
    <div className="text-ink text-sm">{name} es de tipo:</div>
    <div className="flex justify-center gap-3">
      {types.map((type, idx) => (
        <TypeBadge key={idx} type={type} />
      ))}
    </div>
  </div>
);

/* ---------- Habitat ---------- */
const HabitatSection: FC<{ name: string; biomes: string[]; t: any }> = ({ name, biomes, t }) => (
  <div className="space-y-4">
    <div className="text-ink text-sm">{name} puede encontrarse en los siguientes biomas:</div>
    <div className="flex flex-wrap gap-2">
      {biomes.map((biome, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className="bg-warning/20 border-warning-border text-warning-hover hover:bg-warning/30"
        >
          {getTranslatedBiomeName(biome, t)}
        </Badge>
      ))}
    </div>
    {biomes.length === 0 && <div className="text-ink-muted text-sm italic">No hay biomas válidos disponibles.</div>}
  </div>
);

/* ---------- Main Card ---------- */
export default function PokemonDataCard({ data }: PokemonDataCardProps) {
  const t = useTranslations("pokedex");
  const [searchTerm, setSearchTerm] = useState("");

  const { id, form = "base", pokemonName, types, stats, moves, habitat } = data;

  const { getSprite } = useSpriteManifestStore();
  const spriteInfo = getSprite({ id, form });

  const filteredBiomes = useMemo(() => filterVisibleBiomes(habitat || []), [habitat]);

  const availableTabs = useMemo(() => {
    const tabs = [{ id: "overview", label: "Resumen" }];
    if (stats) tabs.push({ id: "stats", label: "Estadísticas" });
    if (moves && Object.keys(moves).length) tabs.push({ id: "moves", label: "Movimientos" });
    if (types?.length) tabs.push({ id: "types", label: "Tipos" });
    if (habitat?.length) tabs.push({ id: "habitat", label: "Hábitat" });
    return tabs;
  }, [stats, moves, types, habitat]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id);

  if (!availableTabs.length) {
    return (
      <div className="bg-layer-3/50 rounded-lg p-6 mt-3 border border-edge text-center">
        <div className="text-ink-muted">No hay datos disponibles para mostrar.</div>
      </div>
    );
  }

  return (
    <div className="bg-layer-3/50 rounded-lg p-6 mt-3 border border-edge max-w-4xl w-full sm:w-[420px]">
      <PokemonHeader sprite={spriteInfo?.path} name={pokemonName} types={types} />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {availableTabs.length > 1 && (
          <TabsList className={`grid w-full grid-cols-${availableTabs.length} mb-6 bg-layer-3/50`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-primary-active">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        <div className="min-h-[300px]">
          <TabsContent value="overview">
            <OverviewSection
              stats={stats}
              habitatCount={filteredBiomes.length}
              moveTypes={moves ? Object.keys(moves).length : 0}
              typeCount={types?.length || 0}
            />
          </TabsContent>
          {stats && (
            <TabsContent value="stats">
              <StatsSection stats={stats} />
            </TabsContent>
          )}
          {moves && (
            <TabsContent value="moves">
              <MovesSection moves={moves} searchTerm={searchTerm} setSearchTerm={setSearchTerm} t={t} />
            </TabsContent>
          )}
          {types && (
            <TabsContent value="types">
              <TypesSection name={pokemonName} types={types} />
            </TabsContent>
          )}
          {habitat && (
            <TabsContent value="habitat">
              <HabitatSection name={pokemonName} biomes={filteredBiomes} t={t} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
