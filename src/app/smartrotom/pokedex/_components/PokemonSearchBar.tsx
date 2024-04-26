"use client"

import { Input } from "@/components/ui/input"
import { rotomGET } from "@/services/boffAPI"
import Link from "next/link"
import { useState } from "react"
import { PokemonSprite } from "./PokemonSprite"

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
        <div>
            <Input type="text" placeholder="Search for a Pokemon" value={text} onChange={(e) => type(e.target.value)} />
            <div className="overflow-auto max-h-48">
                {pokemon?.map(p => (
                    <Link href={`/smartrotom/pokedex/entrada/${p.item.dex}`} key={p.item.dex} className="flex p-2 hover:bg-gray-600 text-white items-center">
                        <PokemonSprite width={40} id={p.item.dex} form={"base"} palette={"none"}/>
                        <span className='ml-2'>{p.item.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}