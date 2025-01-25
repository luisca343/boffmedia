"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PokemonName, PokemonSprite } from "./PokemonSprite"
import { InternalLink } from "@/components/nav/Link"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"
import { usePokemonStore } from "@/stores/pokemonStore"

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
            <div className="overflow-auto h-48 flex flex-wrap justify-center">
                {pokemon?.map(p => (
                    <InternalLink href={`/pokedex/entrada/${p.item.dex}`} key={p.item.dex} className="flex justify-center hover:bg-surface-600 text-surface-50 items-center w-48 m-1 rounded-md">
                        <PokemonSprite width={40} id={p.item.dex} form={"base"} palette={"none"} hide={true}/>
                        <PokemonName id={p.item.dex} form={"base"} palette={"none"} hide={true} name={p.item.name} />
                    </InternalLink>
                ))}
            </div>
        </div>
    )
}