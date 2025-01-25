"use client"

import { PokemonSprite, PokemonSpriteLink } from "./PokemonSprite"
import { StatusIcon } from "./StatusIcon"
import { InternalLink } from "@/components/nav/Link"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetRegistries } from "@/hooks/pokemon/useGetRegistries"

export function LastRegistries(){
    const { session } = useBoffSession();
    const {registries} = useGetRegistries(session.user.smartRotomUser?.uuid!);


    return (
            <div className="flex justify-center flex-wrap ">
                {registries?.map((reg) => (
                    <div key={`${reg.pokemonId}-${reg.formId}-${reg.paletteId}-${reg.seenAt}`}>
                        <PokemonSpriteLink width={60} height={50} id={reg.pokemonId} form={reg.formId} palette={reg.paletteId} showStatus={false} hide={true}/>
                        <div className="absolute top-1 right-1">
                            <StatusIcon caughtAt={reg.caughtAt} seenAt={reg.seenAt} palette={reg.paletteId} />
                         </div>
                    </div>
                ))}
            </div>
    )
}