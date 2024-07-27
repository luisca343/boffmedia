import { Battle } from "@pkmn/client";
import PokemonSprite from "../_components_old/PokemonSprite";
import PokemonElement from "./PokemonElement";

export function BattleCanvas({battle}: {battle: Battle}){
    const p1 = battle.p1;
    const p2 = battle.p2;

    const pokemon = {
        p1a: p1.active[0],
        p1b: p1.active[1],
        p1c: p1.active[2],
        p2a: p2.active[0],
        p2b: p2.active[1],
        p2c: p2.active[2]
    }
    
    return (
        <div id="game"  className="w-[440px] h-[360px] border border-red-500 relative">
            <div className="absolute top-1 left-1 bg-slate-800 py-1 px-2 rounded-md text-slate-200 border border-slate-200">Turn {battle.turn}</div>
        
            <PokemonElement pokemon={pokemon["p1a"]} id="p1a" className='bottom-[10%] left-[5%]'/>
            <PokemonElement pokemon={pokemon["p1b"]} id="p1b" className='bottom-[0%] left-[33%]'/>

            <PokemonElement pokemon={pokemon["p2a"]} id="p2a" className='top-[10%] right-[5%]'/>
            <PokemonElement pokemon={pokemon["p2b"]} id="p2b" className='top-0 right-[33%]'/>
        </div>
    )
}