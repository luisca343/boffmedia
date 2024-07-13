"use client"
import { rotomGET } from "@/services/boffAPI";
import { PokemonSprite } from "../../_components/PokemonSprite";
import useTranslation from 'next-translate/useTranslation'
import { PossibleSpawns } from "../../_components/PossibleSpawns";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Localizacion({params} : {params: {id: string}}){
    const { id } = params;

    //const pokemon = await rotomGET(`/pokemon/biome/${id}`) as {[key: string]: {dex: number, species: string, form: string, palette: string, rarity: number, percentage: number}[]}
    const [pokemon, setPokemon] = useState() as any;
    const [hideCaught, setHideCaught] = useState(false)
    const [hideSeen, setHideSeen] = useState(false)

    useEffect(() => {
        if(!id) return
        rotomGET(`/pokemon/biome/${id}`)
            .then((res) => {
                setPokemon(res)
            })
    }, [id])


    const {t: spawnsTranslation} = useTranslation("smartrotom/pokedex/spawns")
    
    if(!pokemon) return <h1>404</h1>
    return(
        <div className="bg-main-800  ">
            <div className="hidden 2xl:flex justify-center">
                <Label className="text-white text-2xl">Mostrar Atrapados</Label>
                <Checkbox id="caught" onClick={() => setHideCaught(!hideCaught)} className="bg-main-400 text-white p-2 rounded-xl m-2">Mostrar Atrapados</Checkbox>
                <Label className="text-white text-2xl">Mostrar Avistados</Label>
                <Checkbox id="seen" onClick={() => setHideSeen(!hideSeen)} className="bg-main-400 text-white p-2 rounded-xl m-2">Mostrar Avistados</Checkbox>
            </div>
            <div className="flex  flex-wrap justify-center items-start">
                {Object.entries(pokemon).map(([biome, spawn]) => (
                    <div key={1} className="flex flex-col  mb-4 rounded-xl p-2 w-[95%] m-auto">
                        <h1 className="text-4xl text-center text-main-100 font-bold">{spawnsTranslation(biome.replace(":", "_").replace("%3A","_").replace("%20","_"))}</h1>
                        <PossibleSpawns pokemonSpawns={spawn} hideCaught={hideCaught} hideSeen={hideSeen}/>
                    </div>
                ))}
            </div>
        </div>
    )
}