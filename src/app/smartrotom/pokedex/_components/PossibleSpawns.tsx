"use client"

import { mcefQuery } from "@/services/mcefHelper"
import { useEffect, useState } from "react"
import { PokemonSprite } from "./PokemonSprite"

export function PossibleSpawns(){
    const [spawns, setSpawns] = useState<any []>()
    useEffect(() => {
        mcefQuery('getSpawns')
            .then((response) => {
                const res = response as any[]
                res.sort((a, b) => b.spawnChance - a.spawnChance)
                return setSpawns(res.sort((a, b) => b.spawnChance - a.spawnChance) as any[])
            })
            .catch((error) => {
                alert("error")
            })
    }, [])
    return(
        <div className="flex  flex-wrap">
            {spawns?.map((spawn) => (
                <div key={spawn.pokemonName} className="flex flex-col items-center p-2 hover:bg-gray-400 border rounded-sm text-center w-24  m-2">
                    <PokemonSprite id={spawn.dex} form={"base"} palette={"none"} width={40} />
                    <div>{spawn.pokemonName}</div>
                    <div>{spawn.spawnChance} %</div>
                </div>
            ))    
            }
        </div>
    )
}