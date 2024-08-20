"use client"
import { Battle, Pokemon, Side } from "@pkmn/client";
import { Loading } from "@/components/smartrotom/Loading";
import { forwardRef,  useImperativeHandle, useRef } from "react";
import { getCanvasWidth, getCanvasHeight, positionsP1, positionsP2 } from "../_utils/viewUtils";
import { PokemonStatus } from "./PokemonStatus";
import { PokemonElement, PokemonRefType } from "./PokemonElement";
import { Avatar } from "./Avatar";
import { PokemonTeam } from "./PokemonTeam";
import { Hazard } from "./Hazard";
import { PokemonIdent } from "@pkmn/protocol";

export type BattleCanvasRefProps = {
  bounceAll: () => void;
  animateMove: (
    attacker: PokemonIdent,
    moveName: string,
    defender: PokemonIdent
  ) => void;
};

export const BattleCanvas = forwardRef(({ battle, pov, messageBar }: { battle: Battle, pov: 0 | 1, messageBar: string[] }, ref) => {
    const pokemonRefs = useRef<{ [key: string]: PokemonRefType }>({});

    
    useImperativeHandle(ref, () => ({
        bounceAll() {
            Object.values(pokemonRefs.current).forEach(element => {
                element?.bounce()
            })
        },
        animateMove(attackerIdent: PokemonIdent, moveName: string, defenderIdent: PokemonIdent) { 
            const attacker = attackerIdent.split(":")[0];
            const defender = defenderIdent.split(":")[0];

            console.log("ANIMATING MOVE", attacker, moveName, defender);

            const move = battle.get("moves", moveName);
            const attackerRef = pokemonRefs.current[attacker];
            const defenderRef = pokemonRefs.current[defender];}
    }));


    const p1 = pov === 0 ? battle.p1 : battle.p2;
    const p2 = pov === 0 ? battle.p2 : battle.p1;

    const pokemon = {
        p1a: p1.active[0], p1b: p1.active[1], p1c: p1.active[2], p1d: p1.active[3], p1e: p1.active[4],
        p2a: p2.active[0], p2b: p2.active[1], p2c: p2.active[2], p2d: p2.active[3], p2e: p2.active[4]
    } as {[key: string]: Pokemon};
    

    if(!battle.pokemonControlled) return <Loading/>
    return (
        <div  id="game" className="flex overflow-hidden relative" style={{
            backgroundImage: 'url(/battlesim/fx/bg/hagane.png)', 
            backgroundSize: `100% 100%`, width: getCanvasWidth(), height: getCanvasHeight()}}>          
            <div className="h-[15%] w-full absolute top-0 flex justify-between">
                <div className="m-1 w-fit h-fit bg-slate-800  bg-opacity-90 py-1 px-2 rounded-md text-slate-200 z-50">Turn {battle.turn}</div>
                <div className="m-1 w-2/3 flex flex-row-reverse">
                    <PokemonTeam side={p2}/>
                    <PokemonStatus pokemon={pokemon["p2a"]} className="w-44"/>
                    <PokemonStatus pokemon={pokemon["p2b"]} className="w-44"/>
                    <PokemonStatus pokemon={pokemon["p2c"]} className="w-44"/>
                </div>
            </div>

                
            <div className="h-[15%] w-full absolute bottom-0 flex">
                <div className="m-1 max-w-2/3 flex flex-row">
                    <PokemonTeam side={p1}/>
                    <PokemonStatus pokemon={pokemon["p1a"]} className="w-44"/>
                    <PokemonStatus pokemon={pokemon["p1b"]} className="w-44"/> 
                    <PokemonStatus pokemon={pokemon["p1c"]} className="w-44"/>
                </div>
                {
                    messageBar.length > 0 && <div className="w-1/3 h-fit m-1 flex-1 bg-slate-800 bg-opacity-90 py-1 px-2 rounded-md text-slate-200 z-50 absolute right-0 bottom-0">
                        {messageBar.map((message, index) => (
                            <div key={index} dangerouslySetInnerHTML={{ __html: message }}></div>
                        ))}
                    </div>
                }
            </div>
            <Avatar battle={battle} side={p1} pov={pov}/>
            <Avatar battle={battle} side={p2} pov={pov}/>
            
            {positionsP1.map((position, index) => (
            <PokemonElement
                key={position}
                battle={battle}
                pokemon={pokemon[position]}
                ref={el => pokemonRefs.current[position] = el as PokemonRefType}
                side={battle.p1}
                position={position}
                />
            ))}

            {Object.entries(battle.p1.sideConditions).map((entry) => {
                return <Hazard key={entry[0]} hazard={entry} side="p1" />
            })}

            {positionsP2.map((position, index) => (
                <PokemonElement
                    key={position}
                    battle={battle}
                    pokemon={pokemon[position]}
                    ref={el => pokemonRefs.current[position] = el as PokemonRefType}
                    side={battle.p2}
                    position={position}
                />
            ))}
            <div id='overlay' className="absolute w-full h-full pointer-events-none">
                <div className={`weather w-full h-full absolute top-0 left-0 ${battle.field.terrainState.id}`}></div>

                <div className={`weather w-full h-full absolute top-0 left-0 `} style={{
                    backgroundImage: 'url(/battlesim/fx/trickroom.png)',
                    backgroundSize: '100% 100%',
                    opacity: 0.6,
                }}>
                </div>
                <div className={`weather w-full h-full absolute top-0 left-0 `} style={{
                    backgroundImage: 'url(/battlesim/fx/bg/hagane_overlay.png)',
                    backgroundSize: '100% 100%',
                    zIndex: 1,
                }}>
                </div>
            </div>
        </div>
    )
})

BattleCanvas.displayName = "BattleCanvas";