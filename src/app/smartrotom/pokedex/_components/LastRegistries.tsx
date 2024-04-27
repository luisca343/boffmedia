"use client"

import { getSmartRotomUser } from "@/lib/utils"
import { rotomGET } from "@/services/boffAPI"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { PokedexRegistry } from "@/types/Pokemon"
import { PokemonSprite } from "./PokemonSprite"
import { StatusIcon } from "./StatusIcon"
import Link from "next/link"
import { PokedexSection } from "./PokedexSection"

export function LastRegistries(){
    const {data: session} = useSession()
    const [registries, setRegistries] = useState() as [PokedexRegistry[], Function]

    useEffect(() => {
        if(session){
            rotomGET(`/pokemon/registries/${getSmartRotomUser(session).uuid}`)
                .then((response) => {
                    console.log(response)
                    setRegistries(response)
                })
                .catch((error) => {
                    console.log(error)
                })
        }
    }, [session])

    if(!registries) return <div>Loading...</div>
    return (
            <div className="flex justify-center ">
                {registries.map((reg) => (
                    <Link key={`${reg.pokemonId}-${reg.formId}-${reg.paletteId}-${reg.seenAt}`} className="relative border m-2 rounded-md hover:bg-gray-400" href={`/smartrotom/pokedex/entrada/${reg.pokemonId}/${reg.formId}`}>
                        <PokemonSprite id={reg.pokemonId} form={reg.formId} palette={reg.paletteId} />
                        <div className="absolute top-0 left-0">
                            <StatusIcon caughtAt={reg.caughtAt} seenAt={reg.seenAt} palette={reg.paletteId} />
                         </div>
                    </Link>
                ))}
            </div>
    )
}