"use client"
import { rotomGET } from "@/services/boffAPI";
import { PokedexSection } from "../_components/PokedexSection";
import { PossibleSpawns } from "../_components/PossibleSpawns";
import { useEffect, useState } from "react";
import { mcefQuery } from "@/services/mcefHelper";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type PossibleSpawn = {
    dex: number;
    species: string;
    form: string;
    palette: string;
    rarity: number;
    percentage: number;
}


export default function Spawns(){
    const [hideCaught, setHideCaught] = useState(false)
    const [hideSeen, setHideSeen] = useState(false)

    return(
        <div className="bg-main-800  ">
        <Label className="text-main-50 text-2xl">Mostrar Avistados</Label>
        <Checkbox id="seen" onClick={() => setHideSeen(!hideSeen)} className="bg-main-400 text-main-50 p-2 rounded-xl m-2">Mostrar Avistados</Checkbox>
            <div className="hidden 2xl:flex justify-center">
                <Label className="text-main-50 text-2xl">Mostrar Atrapados</Label>
                <Checkbox id="caught" onClick={() => setHideCaught(!hideCaught)} className="bg-main-400 text-main-50 p-2 rounded-xl m-2">Mostrar Atrapados</Checkbox>
            </div>
            <PossibleSpawns hideCaught={hideCaught} hideSeen={hideSeen}/>
        </div>
    )
}