"use client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card";
import { useTranslations } from "next-intl";
import { useGetAllAbilities } from "@/hooks/pokemon/useGetAllAbilities";
import { AbilityCount } from "@/services/api/smartrotom/pokemonService";
import { InternalLink } from "@/components/ui/navigation/Link";
import { BookOpenIcon, SparklesIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import AbilityDataElement from "./_components/AbilityData";

export default function Habilidades() {
    const { abilities } = useGetAllAbilities();
    const t = useTranslations("pokedex");
    const [searchQuery, setSearchQuery] = useState("");

    if (!abilities) return (
        <div className="bg-surface-800 min-h-full overflow-auto flex justify-center items-center">
            <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent"></div>
                <div className="text-surface-100 text-xl">Cargando habilidades...</div>
            </div>
        </div>
    );

    const filteredAbilities = abilities.filter(ability => 
        t(`ability_${ability.name.replace(/\s+/g, "")}`)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
        t(`ability_${ability.name.replace(/\s+/g, "")}_description`)
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
                        <h1 className="text-xl font-bold text-surface-50">Habilidades Pokémon</h1>
                    </div>
                    
                    <p className="text-surface-200">
                        Explora las diferentes habilidades que pueden tener los Pokémon. 
                        Pasa el cursor sobre una habilidad para ver su descripción o haz clic para ver qué Pokémon pueden tenerla.
                    </p>
                </div>

                {/* Search bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-surface-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar habilidad..."
                        className="bg-surface-700/50 border border-surface-600 text-surface-100 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Abilities grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAbilities.length > 0 ? (
                        filteredAbilities.map((ability: AbilityCount) => (
                            <HoverCard key={ability.name}>
                                <HoverCardTrigger>
                                    <InternalLink href={`pokedex/habilidades/${ability.name}`}>
                                        <div className="flex flex-col items-center justify-center text-center p-4 h-32 
                                                    rounded-lg border border-surface-600 bg-surface-700/50
                                                    hover:bg-surface-600/80 hover:border-surface-500 hover:text-surface-50 transition-all
                                                    shadow-md hover:shadow-lg group">
                                            <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <SparklesIcon className="h-5 w-5 text-primary-300 mx-auto" />
                                            </div>
                                            <span className="text-lg font-bold text-surface-100 mb-2 group-hover:text-surface-50 transition-colors">
                                                {t(`ability_${ability.name.replace(/\s+/g, "")}`)}
                                            </span>
                                            <div className="flex items-center justify-center space-x-2">
                                                <span className="text-xl text-amber-400 font-medium">
                                                    {ability.count}
                                                </span>
                                                <span className="text-xs text-surface-300 group-hover:text-surface-200">
                                                    Pokémon
                                                </span>
                                            </div>
                                        </div>
                                    </InternalLink>
                                </HoverCardTrigger>
                                <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-600 border font-normal p-4 rounded-lg z-50 shadow-xl">
                                    <AbilityDataElement id={ability.name} />
                                </HoverCardContent>
                            </HoverCard>
                        ))
                    ) : (
                        <div className="col-span-full bg-surface-700/30 rounded-lg p-8 text-center border border-surface-600/50">
                            <p className="text-surface-300 text-lg">No se encontraron habilidades que coincidan con la búsqueda</p>
                        </div>
                    )}
                </div>

                {/* Statistics footer */}
                <div className="mt-6 pt-4 border-t border-surface-700/50 text-surface-400 text-sm flex justify-between items-center">
                    <div>Total de habilidades: {abilities.length}</div>
                    <div>Habilidades encontradas: {filteredAbilities.length}</div>
                </div>
            </div>
        </div>
    );
}