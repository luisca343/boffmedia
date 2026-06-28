"use client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card";
import MoveDataElement from "./_components/MoveData";
import { useTranslations } from "next-intl";
import { useGetAllMoves } from "@/hooks/pokemon/useGetAllMoves";
import { MoveCount } from "@/services/api/smartrotom/pokemonService";
import { InternalLink } from "@/components/ui/navigation/Link";
import { BookOpenIcon, BoltIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Movimientos() {
    const { moves } = useGetAllMoves()
    const t = useTranslations("pokedex");
    const [searchQuery, setSearchQuery] = useState("");

    if (!moves) return (
        <div className="bg-layer-2 min-h-full overflow-auto flex justify-center items-center">
            <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                <div className="text-ink text-xl">Cargando movimientos...</div>
            </div>
        </div>
    );

    const filteredMoves = moves.filter(move => 
        t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-layer-2 min-h-full overflow-auto">
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                {/* Header section */}
                <div className="bg-layer-3/30 rounded-lg p-4 border border-edge/50 mb-4">
                    <div className="flex items-center mb-3">
                        <BookOpenIcon className="h-6 w-6 text-primary-hover mr-2" />
                        <h1 className="text-xl font-bold text-ink">Movimientos Pokémon</h1>
                    </div>
                    
                    <p className="text-ink">
                        Explora los diferentes movimientos que pueden aprender los Pokémon. 
                        Pasa el cursor sobre un movimiento para ver más detalles o haz clic para ver qué Pokémon pueden aprenderlo.
                    </p>
                </div>

                {/* Search bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-ink-muted" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar movimiento..."
                        className="bg-layer-3/50 border border-edge text-ink rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Moves grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMoves.length > 0 ? (
                        filteredMoves.map((move: MoveCount) => (
                            <HoverCard key={move.name}>
                                <HoverCardTrigger>
                                    <InternalLink href={`pokedex/movimientos/${move.name}`}>
                                        <div className="flex flex-col items-center justify-center text-center p-4 h-32 
                                                    rounded-lg border border-edge bg-layer-3/50
                                                    hover:bg-layer-3/80 hover:border-edge hover:text-ink transition-all
                                                    shadow-md hover:shadow-lg group">
                                            <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <BoltIcon className="h-5 w-5 text-primary-hover mx-auto" />
                                            </div>
                                            <span className="text-lg font-bold text-ink mb-2 group-hover:text-ink transition-colors">
                                                {t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)}
                                            </span>
                                            <div className="flex items-center justify-center space-x-2">
                                                <span className="text-xl text-amber-400 font-medium">
                                                    {move.count}
                                                </span>
                                                <span className="text-xs text-ink group-hover:text-ink">
                                                    Pokémon
                                                </span>
                                            </div>
                                        </div>
                                    </InternalLink>
                                </HoverCardTrigger>
                                <HoverCardContent className="bg-layer-3 text-ink w-[400px] border-edge border font-normal p-4 rounded-lg z-50 shadow-xl">
                                    <MoveDataElement id={move.name} />
                                </HoverCardContent>
                            </HoverCard>
                        ))
                    ) : (
                        <div className="col-span-full bg-layer-3/30 rounded-lg p-8 text-center border border-edge/50">
                            <p className="text-ink text-lg">No se encontraron movimientos que coincidan con la búsqueda</p>
                        </div>
                    )}
                </div>

                {/* Statistics footer */}
                <div className="mt-6 pt-4 border-t border-edge/50 text-ink-muted text-sm flex justify-between items-center">
                    <div>Total de movimientos: {moves.length}</div>
                    <div>Movimientos encontrados: {filteredMoves.length}</div>
                </div>
            </div>
        </div>
    );
}