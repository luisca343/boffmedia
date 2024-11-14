import { Battle } from "@pkmn/client";
import PokemonSprite from "../_components_old/PokemonSprite";
import PokemonElement from "../_components_old/PokemonElement";
import { offsets } from "./Scene";
import Image from "next/image";
import { PlayerDataBar } from "./BattleSideBar";
import { Loading } from "@/components/smartrotom/Loading";

export function BattleCanvas({battle, pov}: {battle: Battle, pov: 'p1' | 'p2'}) {
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
    
    if(!battle.pokemonControlled) return <Loading/>
    return (
        <div className="flex h-[360px] w-fit overflow-hidden relative" style={{backgroundImage: 'url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-icecave.jpg)', backgroundSize: 'cover'}}>          

            <PlayerDataBar battle={battle} side="p1" pov={pov}/>
            <div id="game"  className="w-[440px] h-[360px] relative" >
                <div className="absolute top-1 left-1 bg-surface-2 py-1 px-2 rounded-md text-text-secondary z-50">Turn {battle.turn}</div>
            
                <PokemonElement pokemon={pokemon["p1a"]} id="p1a" style={{top: offsets.p1a.top, left: offsets.p1a.left}}/>
                <PokemonElement pokemon={pokemon["p1b"]} id="p1b" style={{top: offsets.p1b.top, left: offsets.p1b.left}}/>
                {Object.entries(battle.p1.sideConditions).map((entry) => {
                    return <Hazard key={entry[0]} hazard={entry} side="p1"/>
                })}

                <PokemonElement pokemon={pokemon["p2b"]} id="p2b" style={{top: offsets.p2b.top, left: offsets.p2b.left}}/>
                <PokemonElement pokemon={pokemon["p2a"]} id="p2a" style={{top: offsets.p2a.top, left: offsets.p2a.left}}/>

                {Object.entries(battle.p2.sideConditions).map((entry) => {
                        const [name, value] = entry;
                        return <Hazard key={entry[0]} hazard={entry} side="p2"/>
                    })
                }
            </div>
            <PlayerDataBar battle={battle} side="p2" pov={pov}/>
            <div className="absolute w-full h-full">
                <div className={`weather w-full h-full absolute top-0 left-0  ${battle.field.terrainState.id}`}></div>
            </div>
        </div>
    )
}

const hazardOffsets: {[key: string]: {[key: string]: {top: number; left: number, width: number}}} = {
    p1: {
        stickyweb1: {top: 230, left: 110, width: 100},
        default: {top: offsets.p1a.top, left: offsets.p1a.left, width: 50}
    },
    p2: {
        stickyweb1: {top: 100, left: 140, width: 100},
        toxicspikes1: {top: 160, left: 260, width: 30},
        toxicspikes2: {top: 140, left: 220, width: 30},
        spikes1: {top: 160, left: 260, width: 30},
        spikes2: {top: 140, left: 220, width: 30},
        spikes3: {top: 120, left: 180, width: 30},
        stealthrock1: {top: 160, left: 260, width: 30},
        default: {top: offsets.p2a.top, left: offsets.p2a.left, width: 50}
    }
}

function Hazard({hazard, side}: {hazard: [string, {name: string, level: number, minDuration: number, maxDuration: number, remove?: boolean}], side: string}) {
    const [name, value] = hazard;

    // Create an array of levels from the current level down to 1
    const levels = Array.from({ length: value.level }, (_, i) => value.level - i);

    return (
        <>
            {levels.map(level => {
                const hazardName = name + level;
                const offset = hazardOffsets[side][hazardName] || hazardOffsets[side].default;
                return (
                    <Image
                        key={level}
                        src={`/battlesim/fx/${name}.png`}
                        alt={name}
                        width={offset.width}
                        height={offset.width}
                        className="absolute z-[5] opacity-50"
                        style={{ top: offset.top, left: offset.left }}
                    />
                );
            })}
        </>
    );
}