"use client"
import { rotomGET } from "@/services/boffAPI";
import { PokemonSprite } from "../../_components/PokemonSprite";
import { PossibleSpawns, PossibleSpawnsSection } from "../../_components/PossibleSpawns";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export default function Localizacion({params} : {params: {id: string}}){
    const { id } = params;

    //const pokemon = await rotomGET(`/pokemon/biome/${id}`) as {[key: string]: {dex: number, species: string, form: string, palette: string, rarity: number, percentage: number}[]}
    const [pokemon, setPokemon] = useState() as any;
    const [hideCaught, setHideCaught] = useState(false)
    const [hideSeen, setHideSeen] = useState(false)

    useEffect(() => {
        if(!id) return
        console.log(id)
        
        rotomGET(`/pokemon/biome/${id}`)
            .then((res) => {
                setPokemon(res.data)
            })
    }, [id])


    const spawnsTranslation  = useTranslations("");
    
    if(!pokemon) return <h1>404</h1>
    return(
        <div className="bg-surface-800  ">
            <div className="hidden 2xl:flex justify-center">
                <Label className="text-surface-50 text-2xl">Mostrar Avistados</Label>
                <Checkbox id="seen" onClick={() => setHideSeen(!hideSeen)} className="bg-surface-400 text-surface-50 p-2 rounded-xl m-2">Mostrar Avistados</Checkbox>
                <Label className="text-surface-50 text-2xl">Mostrar Atrapados</Label>
                <Checkbox id="caught" onClick={() => setHideCaught(!hideCaught)} className="bg-surface-400 text-surface-50 p-2 rounded-xl m-2">Mostrar Atrapados</Checkbox>
            </div>
            <div className="flex  flex-wrap justify-center items-start">
                {Object.entries(pokemon).map(([biome, spawn]) => (
                    <div key={1} className="flex flex-col  mb-4 rounded-xl p-2 w-[95%] m-auto">
                        <PossibleSpawnsSection pokemonSpawns={spawn} hideCaught={hideCaught} hideSeen={hideSeen} title={spawnsTranslation(biome.replace(":", "_").replace("%3A","_").replace("%20","_"))}/>
                    </div>
                ))}
            </div>
        </div>
    )
}