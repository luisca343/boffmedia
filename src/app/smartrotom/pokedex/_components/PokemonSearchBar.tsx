"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PokemonSprite, PokemonSpriteLink } from "./PokemonSprite"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export default function PokemonSearchBar(){
    const [text, setText] = useState("")
    const [pokemon, setPokemon] = useState<any []>()

    async function typeKey(value: string){
        setText(value)
        if(value.trim().length > 2) {
            const res = (await pokemonService.searchPokemonByName(value)).data as any
            setPokemon(res)
        }
        if(value.length === 0) setPokemon([])
    }

    return (
        <div className="w-full m-auto">
            <Input variant="dark" type="text" placeholder="Buscar un Pokémon" value={text} onChange={(e) => typeKey(e.target.value)} />
            <div className="overflow-auto flex flex-wrap justify-center">
                {pokemon?.map(p => (
                    <PokemonSpriteLink  key={p.item.dex} width={40} id={p.item.dex} form={"base"} palette={"none"} hide={true} displayName={true} />
                ))}
            </div>
        </div>
    )
}