"use client"

import { PokemonSprite, PokemonSpriteLink } from "./PokemonSprite"
import { StatusIcon } from "./StatusIcon"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetRegistries } from "@/hooks/pokemon/useGetRegistries"
import { Loading } from "@/components/smartrotom/Loading"

export function LastRegistries() {
    const { session } = useBoffSession();
    const { registries, isLoading } = useGetRegistries(session.user.smartRotomUser?.uuid!);
    

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-20">
                <Loading width={40} height={40} />
            </div>
        );
    }

    if (!registries?.length) {
        return (
            <div className="flex justify-center items-center h-20 text-ink">
                No hay registros recientes
            </div>
        );
    }

    return (
        <div className="flex justify-center flex-wrap gap-2">
            {registries?.map((reg) => (
                <div key={`${reg.pokemonId}-${reg.formId}-${reg.paletteId}-${reg.seenAt}`} className="relative">
                    <PokemonSpriteLink 
                        width={60} 
                        height={50} 
                        id={reg.pokemonId} 
                        form={reg.formId} 
                        palette={reg.paletteId} 
                        showStatus={false} 
                        hide={true}
                        displayName={true}
                    />
                    <div className="absolute top-1 right-1">
                        <StatusIcon caughtAt={reg.caughtAt} seenAt={reg.seenAt} palette={reg.paletteId} />
                    </div>
                </div>
            ))}
        </div>
    )
}