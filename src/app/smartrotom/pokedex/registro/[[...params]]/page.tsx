"use client"
import { Loading } from "@/components/smartrotom/Loading";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"
import { PokemonSprite } from "../../_components/PokemonSprite";


export default function Registro({params}: {params: any}){
    const router = useRouter()
    let [pokemonIndex, formIndex] = params.params as [number, string]
    const [forceBlack, setForceBlack] = useState(true)

    useEffect(() => {
        // Wait 1 second
        setTimeout(() => {
            setForceBlack(false)
            setTimeout(() => {
                router.push(`/smartrotom/pokedex/entrada/${pokemonIndex}/${formIndex}`)
            }, 500)
        }, 500)
    }, [])

    return <div className="w-full h-full bg-surface-3 flex flex-col items-center justify-center">
        <div className="text-2xl text-text-primary">Registrando...</div>
        <PokemonSprite id={pokemonIndex} form={formIndex} palette="none" forceBlack={forceBlack}/>
    </div>
}