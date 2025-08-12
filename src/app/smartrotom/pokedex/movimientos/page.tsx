"use client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import MoveDataElement from "./_components/MoveData";
import { useTranslations } from "next-intl";
import { useGetAllMoves } from "@/hooks/pokemon/useGetAllMoves";
import { MoveCount } from "@/services/api/smartrotom/pokemonService";
import { InternalLink } from "@/components/nav/Link";
import { BookOpenIcon, BoltIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Movimientos() {
    const { moves } = useGetAllMoves()
    const t = useTranslations("pokedex");
    const [searchQuery, setSearchQuery] = useState("");

    if (!moves) return (
        <div className="bg-surface-800 min-h-full overflow-auto flex justify-center items-center">
            <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent"></div>
                <div className="text-surface-100 text-xl">Cargando movimientos...</div>
            </div>
        </div>
    );

    const filteredMoves = moves.filter(move => 
        t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-surface-800 min-h-full overflow-auto">
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                {/* Header section */}
                <div className="bg-surface-700/30 rounded-lg p-4 border border-surface-600/50 mb-4">
                    <div className="flex items-center mb-3">
                        <BookOpenIcon className="h-6 w-6 text-primary-400 mr-2" />
                        <h1 className="text-xl font-bold text-surface-50">Movimientos Pokémon</h1>
                    </div>
                    
                    <p className="text-surface-200">
                        Explora los diferentes movimientos que pueden aprender los Pokémon. 
                        Pasa el cursor sobre un movimiento para ver más detalles o haz clic para ver qué Pokémon pueden aprenderlo.
                    </p>
                </div>

                {/* Search bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-surface-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar movimiento..."
                        className="bg-surface-700/50 border border-surface-600 text-surface-100 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                                                    rounded-lg border border-surface-600 bg-surface-700/50
                                                    hover:bg-surface-600/80 hover:border-surface-500 hover:text-surface-50 transition-all
                                                    shadow-md hover:shadow-lg group">
                                            <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <BoltIcon className="h-5 w-5 text-primary-300 mx-auto" />
                                            </div>
                                            <span className="text-lg font-bold text-surface-100 mb-2 group-hover:text-surface-50 transition-colors">
                                                {t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)}
                                            </span>
                                            <div className="flex items-center justify-center space-x-2">
                                                <span className="text-xl text-amber-400 font-medium">
                                                    {move.count}
                                                </span>
                                                <span className="text-xs text-surface-300 group-hover:text-surface-200">
                                                    Pokémon
                                                </span>
                                            </div>
                                        </div>
                                    </InternalLink>
                                </HoverCardTrigger>
                                <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-600 border font-normal p-4 rounded-lg z-50 shadow-xl">
                                    <MoveDataElement id={move.name} />
                                </HoverCardContent>
                            </HoverCard>
                        ))
                    ) : (
                        <div className="col-span-full bg-surface-700/30 rounded-lg p-8 text-center border border-surface-600/50">
                            <p className="text-surface-300 text-lg">No se encontraron movimientos que coincidan con la búsqueda</p>
                        </div>
                    )}
                </div>

                {/* Statistics footer */}
                <div className="mt-6 pt-4 border-t border-surface-700/50 text-surface-400 text-sm flex justify-between items-center">
                    <div>Total de movimientos: {moves.length}</div>
                    <div>Movimientos encontrados: {filteredMoves.length}</div>
                </div>
            </div>
        </div>
    );
}