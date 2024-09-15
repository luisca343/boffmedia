"use client"
import { strToDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { PokemonSprite } from "../../pokedex/_components/PokemonSprite";
import { getBattleConfig } from "../utils";
import useBattleReplays from "../_hooks/useGetBattleReplays";
import { BoffSession } from "@/types";
import { PokemonData } from "../_types/Pokemon";
import { InternalLink } from "@/components/nav/Link";

export default function CamaraLucha(){
    const {data: session} = useSession() as unknown as {data: BoffSession};
    const { replays, setReplays } = useBattleReplays(session);
    
    return(
        <div  className="text-black">
            <h1>Camara Lucha</h1>
            <div>
                {replays.map(async (replay: any) => {
                    const configCombate = await getBattleConfig(replay.side2)
                    
                    return <InternalLink href={`/liga/camaralucha/ver/${replay.id}`} key={replay.id} className="flex">
                        {replay.id}
                        {strToDate(replay.date)}
                        {replay.side1}
                        <TeamPreview team={JSON.parse(replay.team1)} />
                        vs
                        {replay.team2 &&<TeamPreview team={JSON.parse(replay.team2)} />}
                        {replay.side2}
                    </InternalLink>
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