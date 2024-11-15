"use client"

import { getSmartRotomUser } from "@/lib/utils"
import { rotomGET } from "@/services/boffAPI"
import { useEffect, useState } from "react"
import { PokedexRegistry } from "@/types/Pokemon"
import { PokemonSprite } from "./PokemonSprite"
import { StatusIcon } from "./StatusIcon"
import { InternalLink } from "@/components/nav/Link"
import { useBoffSession } from "@/services/useBoffSession"

export function LastRegistries(){
    const { session } = useBoffSession();
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
            <div className="flex justify-center flex-wrap">
                {registries.map((reg) => (
                    <InternalLink key={`${reg.pokemonId}-${reg.formId}-${reg.paletteId}-${reg.seenAt}`} className="relative  m-2 rounded-md hover:bg-surface-400" href={`/pokedex/entrada/${reg.pokemonId}/${reg.formId}`}>
                        <PokemonSprite width={60} height={50} id={reg.pokemonId} form={reg.formId} palette={reg.paletteId} showStatus={false}/>
                        <div className="absolute top-1 right-1">
                            <StatusIcon caughtAt={reg.caughtAt} seenAt={reg.seenAt} palette={reg.paletteId} />
                         </div>
                    </InternalLink>
                ))}
            </div>
    )
}