"use client"
import { Loading } from "@/components/smartrotom/Loading";
import { useRouter } from "next/navigation";
import { useEffect } from "react"


export default function Registro({params}: {params: any}){
    const router = useRouter()
    let [pokemonIndex, formIndex] = params.params as [number, number | string]

    useEffect(() => {
        // Wait 1 second
        setTimeout(() => {
            router.push(`/smartrotom/pokedex/entrada/${pokemonIndex}/${formIndex}`)
        }, 1000)
    }, [])

    return <div className="w-full h-full bg-primary-400 flex flex-col items-center justify-center">
        <div className="text-2xl text-white">Registrando...</div>
        <Loading color="white" width={100} height={100}/>
    </div>
}