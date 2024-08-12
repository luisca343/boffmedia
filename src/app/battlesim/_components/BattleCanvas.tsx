"use client"
import { Battle, Pokemon, Side } from "@pkmn/client";
import PokemonElement from "./PokemonElement";
import Image from "next/image";
import { PlayerDataBar } from "./BattleSideBar";
import { Loading } from "@/components/smartrotom/Loading";
import { useEffect, useState } from "react";
import { Sprites } from "@pkmn/img";
import { DetailedPokemon } from "@pkmn/protocol";
import { getImageSize, getOffset } from "../_utils/viewUtils";
import NpcSkin from "@/components/smartrotom/MinecraftSkin";
import { PokemonStatus } from "./PokemonStatus";
import { PokemonSprite } from "./PokemonSprite";
import PokemonDetail from "./PokemonDetail";



export function BattleCanvas({battle, pov,messageBar}: {battle: Battle, pov: 'p1' | 'p2', messageBar: string[]}) {
    const [viewportWidth, setViewportWidth] = useState(0);

    useEffect(() => {
        const updateViewportWidth = () => {
            setViewportWidth(window.innerWidth);
        };

        updateViewportWidth();
        window.addEventListener('resize', updateViewportWidth);

        return () => {
            window.removeEventListener('resize', updateViewportWidth);
        };
    }, []);



    const p1 = battle.p1;
    const p2 = battle.p2;

    const pokemon = {
        p1a: p1.active[0],
        p1b: p1.active[1],
        p1c: p1.active[2],
        p2a: p2.active[0],
        p2b: p2.active[1],
        p2c: p2.active[2]
    } as {[key: string]: Pokemon};
    
    const targetWidth = 960;
    const aspectRatio = 0.5625;
    const targetHeight = targetWidth * aspectRatio;

    const canvasWidth = viewportWidth > targetWidth ? targetWidth : viewportWidth;
    const canvasHeight = canvasWidth * aspectRatio;



    const hazardOffsets: {[key: string]: {[key: string]: {top: number; left: number, width: number}}} = {
        p1: {
            stickyweb1: {top: 230, left: 110, width: 100},
            default: {top: getOffset(battle, "p1a").top, left: getOffset(battle, "p1a").left, width: 50}
        },
        p2: {
            stickyweb1: {top: 100, left: 140, width: 100},
            toxicspikes1: {top: 160, left: 260, width: 30},
            toxicspikes2: {top: 140, left: 220, width: 30},
            spikes1: {top: 160, left: 260, width: 30},
            spikes2: {top: 140, left: 220, width: 30},
            spikes3: {top: 120, left: 180, width: 30},
            stealthrock1: {top: 160, left: 260, width: 30},
            default: {top: getOffset(battle, "p2a").top, left: getOffset(battle, "p2a").left, width: 50}
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


    function PokemonImage({id, pokemon, side = 'p2', className}: {id: string, pokemon: Pokemon, side?: 'p1' | 'p2', className?: string}) {
        if (!pokemon) return <div></div>;
        let {url, w, h, pixelated} = Sprites.getPokemon(pokemon.speciesForme, {gen: 'ani', shiny: pokemon.shiny, side});

        //const battleType = battle.gameType;
        const battleType = 'doubles'

        let multiplier;
        if (side === 'p2' && battleType === 'raid') {
            multiplier = 3;
        } else {
            multiplier = side === 'p2' ? .7 : 1.3;
        }


        viewportWidth < targetWidth ? w = w * viewportWidth / targetWidth * multiplier : w = w * multiplier;
        viewportWidth < targetWidth ? h = h * viewportWidth / targetWidth * multiplier : h = h * multiplier;


        if (url === "https://play.pokemonshowdown.com/sprites/gen5/0.png") {
            url = `http://boffmedia.es/smartrotom/img/sprites/Front/${pokemon?.speciesForme?.toUpperCase()}.png`;
            pixelated = true;
        }
        return (
            <div className={`w-full h-full flex items-end justify-center relative ${className}`} id={id}>
                {pokemon && Object.keys(pokemon.volatiles).includes("protect") &&
                    <div className={`h-[75px] w-[100px] bg-purple-400 opacity-30 self-center bottom-8 absolute ${side === 'p1' ? 'z-0' : 'z-50'}`} />
                }
                <div className="shadow-container" style={{
                    position: 'absolute',
                    bottom: '0px', // Position at the bottom
                    filter: 'brightness(0) blur(5px)', // Black color and blur for shadow effect
                    zIndex: 0,
                    transform: `
                            scaleY(-1) scaleX(-1)
                            ${side === 'p1' ? `translateY(-${(getImageSize() / 2.7)}px)` : `translateY(-${(getImageSize() / 4)}px)`}
                            `,
                    opacity: .5 
                }}>
                    <img
                        className={className} src={url} width={w} height={h}
                        style={{
                            imageRendering: pixelated ? 'pixelated' : 'auto',
                        }}
                        alt={`${pokemon.speciesForme} shadow`}
                    />
                </div>
                <div className="pokemon-container" style={{
                    position: 'absolute',
                    zIndex: 1
                }}>
                    <img
                        className={className} src={url} width={w} height={h}
                        style={{
                            imageRendering: 'pixelated',
                        }}
                        alt={pokemon.speciesForme}
                    />
                </div>
            </div>
        );
    }



    function Avatar({ battle, side, pov, style } : { battle: Battle, side: 'p1' | 'p2', pov: 'p1' | 'p2' , style?: React.CSSProperties}) {
        const player = battle[side];
        const avatarId = player?.avatar || 'unknown';
        const uuid = player.avatar.includes('-') ? player.avatar : null;
        const avatar = Sprites.getAvatar(avatarId);
        const avatarNumber = parseInt(avatarId);

        const scaleMultiplier = canvasWidth / targetWidth;
    
        const baseStyles: React.CSSProperties = {
            position: 'absolute',
            top: `${307 * scaleMultiplier}px`,
            left: `${172 * scaleMultiplier}px`,
            width: `${scaleMultiplier * 45}px`,
            height: `${scaleMultiplier * 100}px`,
            transform: `scaleX(${side === 'p2' ? -1 : 1.2}) scaleY(${side === 'p2' ? 1 : 1.2})`,
            imageRendering: 'pixelated',
            zIndex: side === 'p1' ? 100 : 0,
        };
        
        const npcStyles: React.CSSProperties = {
            position:'absolute',
            top: `${105 * scaleMultiplier}px`,
            left: `${645 * scaleMultiplier}px`,
            width: `${scaleMultiplier * 25}px`,
            height: `${scaleMultiplier * 50}px`,
            transform: `scaleX(${side === 'p2' ? -1 : 1}) scaleY(${side === 'p2' ? 1 : 1})`,
            margin: 'auto',
            imageRendering: 'pixelated',
            zIndex: side === 'p1' ? 100 : 0,
            
        };
    
        const avatarStyles: React.CSSProperties = {
            position:'absolute',
            top: `${side === 'p1' ? 230 * scaleMultiplier : 70 * scaleMultiplier}px`,
            left: `${side === 'p1' ? 90 * scaleMultiplier : 620 * scaleMultiplier}px`,
            width: `${scaleMultiplier * (side === 'p1' ? 175 : 75)}px`,
            height: `${scaleMultiplier * (side === 'p1' ? 175 : 75)}px`,
            transform: side === 'p1' ? 'scale(1) scaleX(-1)' : undefined,
            imageRendering: 'pixelated',
            zIndex: side === 'p1' ? 100 : 0,
        };
    
        return (
            <>
                {uuid !== null ? (
                    <img
                        className="mx-auto"
                        alt="avatar"
                        style={baseStyles}
                        src={`https://crafatar.com/renders/body/${uuid}`}
                    />
                ) : avatarNumber >= 0 ? (
                    <img
                        className="mx-auto"
                        style={avatarStyles}
                        src={avatar}
                        alt="avatar"
                    />
                ) : (
                    <NpcSkin
                        npcName={avatarId}
                        height={50}
                        width={50}
                        style={npcStyles}
                    />
                )}
            </>
        );
    }

    function PokemonTeam({side}: {side: Side}) {
        const total = side.totalPokemon;
        
        console.log(battle.p2.team[0])

        return <div className="flex flex-wrap  justify-center items-center text-center w-16 bg-slate-800 bg-opacity-80 r rounded-md">
            {Array.from({length: total}, (_, i) => side.team[i]).map((pokemon, index) => {
                return <PokemonDetail pokemon={pokemon} 
                        className={`w-6 flex justify-center z-40`} 
                        key={crypto.randomUUID()}>
                    <PokemonSprite className="w-6 -ml-1"  pokemon={pokemon} />
                </PokemonDetail>
            })}
        </div>
    }
    

    
    function PokemonElement({side, position}: {position: string,  side: Side}) {
        const sideId = side.n % 2 === 0 ? 'p1' : 'p2';
        const active = side.active.length
        const pkm = pokemon[position];
        return(
        <div id={position} className="absolute " style={{top: getOffset(battle,position).top, left: getOffset(battle,position).left, width:getImageSize(), height:getImageSize()}}>
            <PokemonDetail pokemon={pkm} className="z-50" offset={-50}>
                <div className="w-full h-full relative">
                    <PokemonImage id={`${position}-pkm`} side={sideId} pokemon={pkm}/>
                </div>
            </PokemonDetail>
        </div>
        )
    }

    if(!battle.pokemonControlled) return <Loading/>
    return (
        <div  id="game" className="flex overflow-hidden relative" style={{
            backgroundImage: 'url(/battlesim/fx/bg/tulipan.gif)', 
            backgroundSize: `100% 100%`,
            width: canvasWidth, height: canvasHeight,
        
        }}
            >          

                <div className="h-[15%] w-full absolute top-0 flex justify-between">
                    <div className="m-1 w-fit h-fit bg-slate-800  bg-opacity-90 py-1 px-2 rounded-md text-slate-200 z-50">Turn {battle.turn}</div>
                    <div className="m-1 w-2/3 flex flex-row-reverse">
                        <PokemonTeam side={battle.p2}/>
                        <PokemonStatus pokemon={pokemon["p2a"]} className="w-44"/>
                        <PokemonStatus pokemon={pokemon["p2b"]} className="w-44"/>
                        <PokemonStatus pokemon={pokemon["p2c"]} className="w-44"/>
                    </div>
                </div>

                
                <div className="h-[15%] w-full absolute bottom-0 flex">
                    <div className="m-1 max-w-2/3 flex flex-row">
                        <PokemonTeam side={battle.p1}/>
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
                <Avatar battle={battle} side="p1" pov={pov}/>
                <Avatar battle={battle} side="p2" pov={pov}/>
            
                {positionsP1.map(position => (
                    pokemon[position] && <PokemonElement key={position} side={battle.p1} position={position} />
                ))}

                {positionsP2.map(position => (
                    pokemon[position] && <PokemonElement key={position} side={battle.p2} position={position} />
                ))}

            <div className="absolute w-full h-full">
                <div className={`weather w-full h-full absolute top-0 left-0 ${battle.field.terrainState.id}`}></div>
            </div>
        </div>
    )
}

const positionsP1 = ["p1a", "p1b", "p1c", "p1d", "p1e"];
const positionsP2 = ["p2a", "p2b", "p2c", "p2d", "p2e"];


/*
            <PlayerDataBar battle={battle} side="p1" pov={pov}/>
            <PlayerDataBar battle={battle} side="p2" pov={pov}/>

            
*/