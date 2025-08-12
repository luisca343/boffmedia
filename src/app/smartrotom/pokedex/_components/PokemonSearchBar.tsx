"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PokemonSprite, PokemonSpriteLink } from "./PokemonSprite"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Loading } from "@/components/smartrotom/Loading"

export default function PokemonSearchBar() {
    const [text, setText] = useState("")
    const [pokemon, setPokemon] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    async function typeKey(value: string) {
        setText(value)
        if (value.trim().length > 2) {
            setIsSearching(true)
            try {
                const res = (await PokemonService.searchPokemon(value)).data as any
                setPokemon(res)
            } catch (error) {
                console.error("Error searching for Pokemon:", error)
            } finally {
                setIsSearching(false)
            }
        }
        if (value.length === 0) setPokemon([])
    }

    return (
        <div className="w-full m-auto">
            <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input 
                    variant="dark" 
                    type="text" 
                    placeholder="Buscar un Pokémon" 
                    value={text} 
                    onChange={(e) => typeKey(e.target.value)} 
                    className="pl-10"
                />
            </div>
            
            {isSearching && (
                <div className="flex justify-center py-4">
                    <Loading width={30} height={30} />
                </div>
            )}
            
            {!isSearching && pokemon.length > 0 && (
                <div className="bg-surface-700/30 p-3 rounded-lg max-h-64 overflow-y-auto">
                    <div className="overflow-auto flex flex-wrap justify-center gap-2">
                        {pokemon.map(p => (
                            <PokemonSpriteLink 
                                key={p.item.dex} 
                                width={40} 
                                id={p.item.dex} 
                                form={"base"} 
                                palette={"none"} 
                                hide={true} 
                                displayName={true} 
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {!isSearching && text.length > 2 && pokemon.length === 0 && (
                <div className="text-center py-2 text-surface-300">
                    No se encontraron resultados
                </div>
            )}
        </div>
    )
}