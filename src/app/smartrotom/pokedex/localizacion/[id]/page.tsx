"use client"
import { PossibleSpawnsSection } from "../../_components/PossibleSpawns";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useGetPokemonByBiome } from "@/hooks/pokemon/useGetPokemonByBiome";

export default function Localizacion({params} : {params: {id: string}}){
    const { id } = params;
    const { pokemon } = useGetPokemonByBiome(id)
    const [hideCaught, setHideCaught] = useState(true)
    const [hideSeen, setHideSeen] = useState(true)

    const t  = useTranslations("pokedex");
    
    if(!pokemon) return <h1>404</h1>
    return(
        <div className="bg-surface-800 overflow-auto ">
            <div className="hidden 2xl:flex justify-center">
                <Label className="text-surface-50 text-2xl">Mostrar Avistados</Label>
                <Checkbox checked={hideSeen} id="seen" onClick={() => setHideSeen(!hideSeen)} className="bg-surface-400 text-surface-50 p-2 rounded-xl m-2">Mostrar Avistados</Checkbox>
                <Label className="text-surface-50 text-2xl">Mostrar Atrapados</Label>
                <Checkbox checked={hideCaught} id="caught" onClick={() => setHideCaught(!hideCaught)} className="bg-surface-400 text-surface-50 p-2 rounded-xl m-2">Mostrar Atrapados</Checkbox>
            </div>
            <div className="flex  flex-wrap justify-center items-start">
                {Object.entries(pokemon).map(([biome, spawn]) => (
                    <div key={1} className="flex flex-col  mb-4 rounded-xl p-2 w-[95%] m-auto">
                        <PossibleSpawnsSection pokemonSpawns={spawn} hideCaught={hideCaught} hideSeen={hideSeen} title={t(biome.replace(":", "_").replace("%3A","_").replace("%20","_"))}/>
                    </div>
                ))}
            </div>
        </div>
    )
}