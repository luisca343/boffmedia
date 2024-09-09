"use client"
import { Game } from "@/app/battlesim/replay/_components/Game";
import { getSmartRotomUser, strToDate } from "@/lib/utils";
import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react"
import { PokemonSprite } from "../../pokedex/_components/PokemonSprite";
import { getBattleConfig } from "../utils";

export default function CamaraLucha(){
    const [combates, setCombates] = useState([])
    const {data: session} = useSession();

    useEffect(()=>{
        rotomGET(`/repeticiones/${getSmartRotomUser(session).uuid}`).then((res)=>{
            setCombates(res)
        })
    },[])

    return(
        <div  className="text-black">
            <h1>Camara Lucha</h1>
            <div>
                {combates.map(async (combate: any) => {
                    const configCombate = await getBattleConfig(combate.side2)
                    
                    return <div key={combate.id} className="flex">
                        {strToDate(combate.date)}
                        {combate.side1}
                        <TeamPreview team={JSON.parse(combate.team1)} />
                        vs
                        {combate.team2 &&<TeamPreview team={JSON.parse(combate.team2)} />}
                        {combate.side2}
                    </div>
                })}
            </div>
        </div>
    )
}


function TeamPreview({team}: {team: PokemonData[]}){
    console.log('team', team)
    return(
        <div className="flex flex-row justify-around items-center">
            {team.map((p, index) => <PokemonSprite 
                key={index} id={p.dex} form={p.form || 'base'} palette={p.palette || 'none'} 
                width={50} showStatus={false}/>)}
        </div>
    )
}


/*

                {combates.map((combate: any) => (
                    <Game key={combate.id} />
                ))}

                {team.map((p, index) => <PokemonSprite key={index} id={p.dex} form={p.form || 'base'} palette={p.palette || 'none'} />)}
*/


interface PokemonData {
    dex: number;
    nature: string;
    species: string;
    form: string;
    palette: string;
    name: string;
    level: number;
    item: string;
    ability: string;
    moves: string[];
    ivs: number[];
    evs: number[];
    stats: number[];
}

export interface LogroCombate {
    npc: string;
    victoria: boolean;
    logro: string;
    team1: PokemonData[];
    team2: PokemonData[];
    replay: string;
  }