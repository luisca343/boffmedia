import { Battle } from "@pkmn/client";
import PokemonSprite from "../_components_old/PokemonSprite";
import PokemonElement from "./PokemonElement";
import { offsets } from "./Scene";

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
        <div id="game"  className="w-[440px] h-[360px] relative">
            <div className="absolute top-1 left-1 bg-slate-800 py-1 px-2 rounded-md text-slate-200 ">Turn {battle.turn}</div>
        
            <PokemonElement pokemon={pokemon["p1a"]} id="p1a" style={{top: offsets.p1a.top, left: offsets.p1a.left}}/>
            <PokemonElement pokemon={pokemon["p1b"]} id="p1b" style={{top: offsets.p1b.top, left: offsets.p1b.left}}/>

            <PokemonElement pokemon={pokemon["p2b"]} id="p2b" style={{top: offsets.p2b.top, left: offsets.p2b.left}}/>
            <PokemonElement pokemon={pokemon["p2a"]} id="p2a" style={{top: offsets.p2a.top, left: offsets.p2a.left}}/>
        </div>
    )
}