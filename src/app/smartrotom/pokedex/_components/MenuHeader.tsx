"use client"
import { useSession } from "next-auth/react";
import { rotomGET } from '@/services/boffAPI'
import { useEffect, useState } from "react";
import { getSmartRotomUser } from "@/lib/utils";

type PokedexRegistries = {
    seenPokemon: number;
    caughtPokemon: number;
    totalPokemon: number;
    missingPokemon: number;
    missingCaughtPokemon: number;
}

export default function MenuHeader(){
    const {data: session} = useSession()  as any
    const [pokedexRegistries, setPokedexRegistries] = useState<PokedexRegistries>({} as PokedexRegistries)

    useEffect(() => {
        rotomGET(`/pokemon/pokedex/${getSmartRotomUser(session).uuid}`)
            .then((res: PokedexRegistries) => {
                setPokedexRegistries(res)
            })
            .catch((err) => {
                console.error(err)
            })
    }, [session?.user?.smartRotomUser?.uuid])

    console.log(pokedexRegistries)

    return(
        
        <header className="flex bg-slate-950  justify-evenly text-white h-12 z-10 p-2 text-xl 2xl:text-lg" >
            <div className="flex">
                <img src={`/smartrotom/img/apps/pokedex/avistado.webp`} />
                <span className="ml-2">Vistos</span>
                <span className="ml-2">{pokedexRegistries.seenPokemon}</span>
            </div>
            <div className="flex ml-2">
                <img src={`/smartrotom/img/apps/pokedex/capturado.webp`} />
                <span className="ml-2">Capturados</span>
                <span className="ml-2">{pokedexRegistries.caughtPokemon}</span>
            </div>
            <div className="flex ml-2">
                <img src={`/smartrotom/img/apps/pokedex/desconocido.webp`} />
                <span className="ml-2">Desconocidos</span>
                <span className="ml-2">{pokedexRegistries.missingPokemon}</span>
            </div>
        </header>
    )
}