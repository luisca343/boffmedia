"use client"

import { Input } from "@/components/ui/input"
import { rotomGET } from "@/services/boffAPI"
import Link from "next/link"
import { useState } from "react"
import { PokemonSprite } from "./PokemonSprite"
import { InternalLink } from "@/components/nav/Link"

export default function PokemonSearchBar(){
    const [text, setText] = useState("")
    const [pokemon, setPokemon] = useState<any []>()

    async function type(value: string){
        setText(value)
        if(value.length > 2) {
            const res = await rotomGET(`/pokemon/search/species/${value}`)
            setPokemon(res)
        }
        if(value.length === 0) setPokemon([])
        
    }

    return (
        <div className="w-full m-auto">
            <Input type="text" placeholder="Buscar un Pokémon" value={text} onChange={(e) => type(e.target.value)} />
            <div className="overflow-auto h-48 flex flex-wrap justify-center">
                {pokemon?.map(p => (
                    <InternalLink href={`/pokedex/entrada/${p.item.dex}`} key={p.item.dex} className="flex justify-center hover:bg-main-600 text-main-50 items-center w-48 m-1 rounded-md">
                        <PokemonSprite width={40} id={p.item.dex} form={"base"} palette={"none"}/>
                        <span className='ml-2'>{p.item.name}</span>
                    </InternalLink>
                ))}
            </div>
        </div>
    )
}