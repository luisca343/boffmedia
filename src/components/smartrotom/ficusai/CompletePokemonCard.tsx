"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useTranslations } from "next-intl";
import TypeBadge from "@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge";
import MoveDataElement from "@/app/smartrotom/pokedex/movimientos/_components/MoveData";
import { getStatColor, statToPercentage, getTotalStatColor } from "@/lib/pokemonColors";
import { getTranslatedMoveName, getTranslatedMoveCategory, getTranslatedBiomeName } from "@/utils/pokemonTranslations";
import { PokemonStats } from "./types";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export interface PokemonData {
  pokemonName: string;
  types?: string[];
  stats?: PokemonStats;
  moves?: Record<string, any>;
  habitat?: string[];
}

interface PokemonDataCardProps {
  data: PokemonData;
}

export default function PokemonDataCard({ data }: PokemonDataCardProps) {
  const t = useTranslations("pokedex");
  const [searchTerm, setSearchTerm] = useState("");

  const { pokemonName, types, stats, moves, habitat } = data;

  // Determine which tabs to show based on available data
  const availableTabs = useMemo(() => {
    const tabs = [];
    
    // Always show overview if we have any data
    //tabs.push({ id: "overview", label: "Resumen" });
    
    if (stats) {
      tabs.push({ id: "stats", label: "Estadísticas" });
    }
    
    if (moves && Object.keys(moves).length > 0) {
      tabs.push({ id: "moves", label: "Movimientos" });
    }
    
    if (habitat && habitat.length > 0) {
      tabs.push({ id: "habitat", label: "Hábitat" });
    }
    
    return tabs;
  }, [stats, moves, types, habitat]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || "overview");

  // Calculate total stats if available
  const totalStats = stats ? stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed : 0;
  
  // Filter biomes if available
  const filteredBiomes = habitat ? habitat.filter(biome => !biome.includes('biomesoplenty') && !biome.includes('terraforged')) : [];

  // Filter moves based on search
  const filteredMoves = useMemo(() => {
    if (!moves) return {};

    const filtered: Record<string, any> = {};

    Object.entries(moves).forEach(([type, moveList]) => {
      // Skip empty categories completely
      if (!moveList || (Array.isArray(moveList) && moveList.length === 0)) return;

      if (!searchTerm.trim()) {
        // If no search term, include all non-empty categories
        filtered[type] = moveList;
        return;
      }

      const lowerSearchTerm = searchTerm.toLowerCase();

      if (type === 'levelUpMoves' && Array.isArray(moveList)) {
        // Handle levelUpMoves structure
        const filteredLevelMoves = moveList.filter((levelEntry: any) => {
          if (!levelEntry.attacks || !Array.isArray(levelEntry.attacks)) return false;
          
          return levelEntry.attacks.some((attack: string) => {
            const translatedName = getTranslatedMoveName(attack, t);
            return attack.toLowerCase().includes(lowerSearchTerm) || 
                   translatedName.toLowerCase().includes(lowerSearchTerm);
          });
        }).map((levelEntry: any) => ({
          ...levelEntry,
          attacks: levelEntry.attacks.filter((attack: string) => {
            const translatedName = getTranslatedMoveName(attack, t);
            return attack.toLowerCase().includes(lowerSearchTerm) || 
                   translatedName.toLowerCase().includes(lowerSearchTerm);
          })
        }));

        if (filteredLevelMoves.length > 0) {
          filtered[type] = filteredLevelMoves;
        }
      } else if (Array.isArray(moveList)) {
        // Handle other move types (arrays of strings)
        const filteredMoveList = moveList.filter((move: string) => {
          const translatedName = getTranslatedMoveName(move, t);
          return move.toLowerCase().includes(lowerSearchTerm) || 
                 translatedName.toLowerCase().includes(lowerSearchTerm);
        });

        if (filteredMoveList.length > 0) {
          filtered[type] = filteredMoveList;
        }
      }
    });

    return filtered;
  }, [moves, searchTerm, t]);

  // Overview section - shows summary based on available data
  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats && (
          <div className="bg-surface-600/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-surface-100">{totalStats}</div>
            <div className="text-sm text-surface-400">Total Base Stats</div>
          </div>
        )}
        {habitat && (
          <div className="bg-surface-600/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-surface-100">{filteredBiomes.length}</div>
            <div className="text-sm text-surface-400">Biomas</div>
          </div>
        )}
        {moves && (
          <div className="bg-surface-600/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-surface-100">{Object.keys(moves).length}</div>
            <div className="text-sm text-surface-400">Tipos de Movimientos</div>
          </div>
        )}
        {types && (
          <div className="bg-surface-600/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-surface-100">{types.length}</div>
            <div className="text-sm text-surface-400">Tipos</div>
          </div>
        )}
      </div>

      {/* Top Stats if available */}
      {stats && (
        <div className="space-y-3">
          <h4 className="text-surface-200 font-medium">Estadísticas Principales</h4>
          {[
            { label: "PS", value: stats.hp },
            { label: "Ataque", value: stats.attack },
            { label: "Velocidad", value: stats.speed }
          ].map((stat, index) => {
            const color = getStatColor(stat.value);
            const percentage = statToPercentage(stat.value);
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-16 text-sm text-surface-300">{stat.label}:</div>
                <div className="w-10 text-sm text-surface-200 font-mono">{stat.value}</div>
                <div className="flex-1">
                  <div className="w-full bg-surface-600 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Types Display */}
      {types && types.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-surface-200 font-medium">Tipos</h4>
          <div className="flex gap-2">
            {types.map((type, index) => (
              <TypeBadge key={index} type={type} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Stats section component
  const StatsSection = () => {
    if (!stats) return <div className="text-surface-400">No hay estadísticas disponibles.</div>;
    
    const statItems = [
      { label: "PS", value: stats.hp, key: "hp" },
      { label: "Ataque", value: stats.attack, key: "attack" },
      { label: "Defensa", value: stats.defense, key: "defense" },
      { label: "At. Especial", value: stats.specialAttack, key: "specialAttack" },
      { label: "Def. Especial", value: stats.specialDefense, key: "specialDefense" },
      { label: "Velocidad", value: stats.speed, key: "speed" },
    ];

    return (
      <div className="space-y-4">
        {/* Total Stats */}
        <div className="bg-surface-600/30 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-surface-200 font-medium">Total Base Stats</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-surface-100">{totalStats}</span>
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getTotalStatColor(totalStats) }}
              />
            </div>
          </div>
        </div>

        {/* Individual Stats */}
        <div className="space-y-3">
          {statItems.map((stat, index) => {
            const color = getStatColor(stat.value);
            const percentage = statToPercentage(stat.value);
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-24 text-sm text-surface-300 font-medium">
                  {stat.label}:
                </div>
                <div className="w-12 text-sm text-surface-200 font-mono text-right">
                  {stat.value}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-surface-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Moves section component
  const MovesSection = () => {
    if (!moves || Object.keys(moves).length === 0) {
      return <div className="text-surface-400">No hay movimientos disponibles.</div>;
    }

    return (
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar movimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 bg-surface-600/50 border-surface-500 text-surface-100 placeholder:text-surface-400"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-surface-400 hover:text-surface-200"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        {Object.keys(filteredMoves).length === 0 && searchTerm ? (
          <div className="text-center py-8 text-surface-400">
            No se encontraron movimientos con "{searchTerm}"
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredMoves).map(([type, moveList], index) => (
              <div key={index} className="bg-surface-600/30 rounded-lg p-4">
                <h4 className="text-primary-400 font-semibold mb-3">
                  {getTranslatedMoveCategory(type, t)} ({
                    type === 'levelUpMoves' && Array.isArray(moveList) 
                      ? moveList.reduce((total: number, level: any) => total + (level.attacks?.length || 0), 0)
                      : Array.isArray(moveList) ? moveList.length : 0
                  })
                </h4>
                
                {type === 'levelUpMoves' && Array.isArray(moveList) ? (
                  // Handle levelUpMoves structure
                  <div className="space-y-3">
                    {moveList.map((levelEntry: any, levelIndex: number) => (
                      <div key={levelIndex} className="space-y-2">
                        <div className="text-sm font-medium text-surface-300">
                          Nivel {levelEntry.level}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(levelEntry.attacks) && levelEntry.attacks.map((attack: string, attackIndex: number) => (
                            <HoverCard key={attackIndex}>
                              <HoverCardTrigger>
                                <Badge 
                                  variant="secondary"
                                  className="bg-surface-600 text-surface-200 hover:bg-surface-500 text-xs cursor-pointer transition-colors"
                                >
                                  {getTranslatedMoveName(attack, t)}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal"
                                style={{ zIndex: 9999 }}
                                side="top"
                                align="center"
                              >
                                <MoveDataElement id={attack} />
                              </HoverCardContent>
                            </HoverCard>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Handle other move types (arrays of strings)
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(moveList) && moveList.map((move: string, moveIndex: number) => (
                      <HoverCard key={moveIndex}>
                        <HoverCardTrigger>
                          <Badge 
                            variant="secondary"
                            className="bg-surface-600 text-surface-200 hover:bg-surface-500 text-xs cursor-pointer transition-colors"
                          >
                            {getTranslatedMoveName(move, t)}
                          </Badge>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal"
                          style={{ zIndex: 9999 }}
                          side="top"
                          align="center"
                        >
                          <MoveDataElement id={move} />
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Types section (for dedicated types tab)
  const TypesSection = () => {
    if (!types || types.length === 0) {
      return <div className="text-surface-400">No hay información de tipos disponible.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="text-surface-300 text-sm">
          {pokemonName} es de tipo:
        </div>
        <div className="flex justify-center gap-3">
          {types.map((type, index) => (
            <TypeBadge key={index} type={type} />
          ))}
        </div>
      </div>
    );
  };

  // Habitat section component
  const HabitatSection = () => {
    if (!habitat || habitat.length === 0) {
      return <div className="text-surface-400">No hay información de hábitat disponible.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="text-surface-300 text-sm">
          {pokemonName} puede encontrarse en los siguientes biomas:
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredBiomes.map((biome, index) => (
            <Badge 
              key={index}
              variant="outline"
              className="bg-green-600/20 border-green-500 text-green-300 hover:bg-green-600/30"
            >
              {getTranslatedBiomeName(biome, t)}
            </Badge>
          ))}
        </div>
        {filteredBiomes.length === 0 && (
          <div className="text-surface-400 text-sm italic">
            No hay biomas válidos disponibles.
          </div>
        )}
      </div>
    );
  };

  if (availableTabs.length === 0) {
    return (
      <div className="bg-surface-700/50 rounded-lg p-6 mt-3 border border-surface-600 text-center">
        <div className="text-surface-400">No hay datos disponibles para mostrar.</div>
      </div>
    );
  }

  return (
    <div className="bg-surface-700/50 rounded-lg p-6 mt-3 border border-surface-600 max-w-4xl">
      {/* Pokemon Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-100 mb-3">
          {pokemonName}
        </h2>
        {types && types.length > 0 && (
          <div className="flex justify-center gap-2">
            {types.map((type, index) => (
              <TypeBadge key={index} type={type} />
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${availableTabs.length} mb-6 bg-surface-600/50`}>
          {availableTabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="data-[state=active]:bg-primary-600"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-[300px]">
          <TabsContent value="overview" className="mt-0">
            <OverviewSection />
          </TabsContent>
          
          {stats && (
            <TabsContent value="stats" className="mt-0">
              <StatsSection />
            </TabsContent>
          )}
          
          {moves && Object.keys(moves).length > 0 && (
            <TabsContent value="moves" className="mt-0">
              <MovesSection />
            </TabsContent>
          )}
          
          {types && types.length > 0 && (
            <TabsContent value="types" className="mt-0">
              <TypesSection />
            </TabsContent>
          )}
          
          {habitat && habitat.length > 0 && (
            <TabsContent value="habitat" className="mt-0">
              <HabitatSection />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
