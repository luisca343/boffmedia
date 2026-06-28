"use client";
import { Badge } from "@/components/ui/primitives/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card";
import { Input } from "@/components/ui/primitives/input";
import MoveDataElement from "@/app/smartrotom/pokedex/movimientos/_components/MoveData";
import { useTranslations } from "next-intl";
import { getTranslatedMoveName, getTranslatedMoveCategory } from "@/utils/pokemonTranslations";
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

interface PokemonMovesCardProps {
  data: {
    moves: Record<string, any>;
    pokemonName: string;
  };
}

export default function PokemonMovesCard({ data }: PokemonMovesCardProps) {
  const t = useTranslations("pokedex");
  const [searchTerm, setSearchTerm] = useState("");
  const { moves, pokemonName } = data;
  
  // Debug logging
  console.log("PokemonMovesCard received moves:", moves);
  
  // Filter moves based on search term (always call hooks at the top level)
  const filteredMoves = useMemo(() => {
    if (!searchTerm.trim()) return moves;

    const filtered: Record<string, any> = {};
    const lowerSearchTerm = searchTerm.toLowerCase();

  // Check if moves is empty or invalid
  if (!moves || Object.keys(moves).length === 0) {
    return (
      <div className="bg-layer-3/50 rounded-lg p-4 mt-3 border border-edge">
        <h3 className="text-lg font-bold text-ink mb-2 text-center">
          {pokemonName}
        </h3>
        <h4 className="text-sm font-semibold text-primary-hover uppercase tracking-wide mb-3 text-center">
          Movimientos
        </h4>
        <p className="text-ink text-sm text-center">No hay movimientos disponibles</p>
      </div>
    );
  }

    Object.entries(moves).forEach(([type, moveList]) => {
      if (!moveList || (Array.isArray(moveList) && moveList.length === 0)) {
        return;
      }

      const filteredMoveList: any[] = [];

      if (Array.isArray(moveList)) {
        moveList.forEach((move: any) => {
          if (type.includes("level")) {
            // For level moves, check attacks array
            const moveNames = Array.isArray(move.attacks) ? move.attacks : [move.attacks];
            const matchingAttacks = moveNames.filter((moveName: string) =>
              getTranslatedMoveName(moveName, t).toLowerCase().includes(lowerSearchTerm) ||
              moveName.toLowerCase().includes(lowerSearchTerm)
            );
            
            if (matchingAttacks.length > 0) {
              filteredMoveList.push({
                ...move,
                attacks: matchingAttacks
              });
            }
          } else {
            // For other move types
            const moveName = move.toString();
            if (
              getTranslatedMoveName(moveName, t).toLowerCase().includes(lowerSearchTerm) ||
              moveName.toLowerCase().includes(lowerSearchTerm)
            ) {
              filteredMoveList.push(move);
            }
          }
        });
      }

      if (filteredMoveList.length > 0) {
        filtered[type] = filteredMoveList;
      }
    });

    return filtered;
  }, [moves, searchTerm, t]);

  const clearSearch = () => {
    setSearchTerm("");
  };
  
  return (
    <div className="bg-layer-3/50 rounded-lg p-4 mt-3 border border-edge relative">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-ink mb-2 text-center">
          {pokemonName}
        </h3>
        <h4 className="text-sm font-semibold text-primary-hover uppercase tracking-wide text-center">
          Movimientos
        </h4>
      </div>
      
      {/* Search Filter */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar movimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 bg-layer-3 border-edge text-ink placeholder-ink-dim focus:border-primary focus:ring-primary/20"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {Object.keys(filteredMoves).length === 0 && searchTerm ? (
        <div className="text-center py-8">
          <p className="text-ink-muted text-sm">
            No se encontraron movimientos que coincidan con &quot;{searchTerm}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredMoves).map(([type, moveList], index) => {
            console.log(`Processing ${type}:`, moveList);
            
            // Skip if moveList is empty
            if (!moveList || (Array.isArray(moveList) && moveList.length === 0)) {
              return null;
            }
            
            return (
              <div key={index} className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-hover uppercase tracking-wide">
                  {getTranslatedMoveCategory(type, t)}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(moveList) ? (
                    moveList.map((move: any, moveIndex: number) => {
                      if (type.includes("level")) {
                        // For level moves, extract the move name from attacks array
                        const moveNames = Array.isArray(move.attacks) ? move.attacks : [move.attacks];
                        return moveNames.map((moveName: string, attackIndex: number) => (
                          <HoverCard key={`${moveIndex}-${attackIndex}`}>
                            <HoverCardTrigger>
                              <Badge 
                                variant="secondary"
                                className="bg-layer-3 text-ink hover:bg-layer-3 text-xs cursor-pointer transition-colors"
                              >
                                {move.level} - {getTranslatedMoveName(moveName, t)}
                              </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent 
                              className="bg-layer-3 text-ink w-[400px] border-edge-strong border font-normal"
                              style={{ zIndex: 9999 }}
                              side="top"
                              align="center"
                            >
                              <MoveDataElement id={moveName} />
                            </HoverCardContent>
                          </HoverCard>
                        ));
                      } else {
                        // For other move types, the move is just a string
                        const moveName = move.toString();
                        return (
                          <HoverCard key={moveIndex}>
                            <HoverCardTrigger>
                              <Badge 
                                variant="secondary"
                                className="bg-layer-3 text-ink hover:bg-layer-3 text-xs cursor-pointer transition-colors"
                              >
                                {getTranslatedMoveName(moveName, t)}
                              </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent 
                              className="bg-layer-3 text-ink w-[400px] border-edge-strong border font-normal"
                              style={{ zIndex: 9999 }}
                              side="top"
                              align="center"
                            >
                              <MoveDataElement id={moveName} />
                            </HoverCardContent>
                          </HoverCard>
                        );
                      }
                    })
                  ) : (
                    <span className="text-ink text-sm">{moveList?.toString() || 'No data'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}