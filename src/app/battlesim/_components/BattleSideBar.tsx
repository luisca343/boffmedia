/* eslint-disable @next/next/no-img-element */
import { Battle, Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { PokemonSprite } from "./PokemonSprite";
import React from "react";
import NpcSkin from "@/components/smartrotom/MinecraftSkin";





  export function PlayerDataBar({ battle, side, pov } : { battle: Battle, side: 'p1' | 'p2', pov: 'p1' | 'p2' }) {
    const player = battle[side];
  
    const avatarId = player?.avatar || 'unknown';
    const uuid = player.avatar.includes('-') ? player.avatar : null;
    const avatar = Sprites.getAvatar(avatarId)
    
    const avatarNmber = parseInt(avatarId)

    
    if(!avatarId) return <></>
    return (
      <div className={` ${side === 'p1' ? 'content-end' : 'content-start'} bg-main-900 h-full bg-opacity-30 z-10`}>
        <div className="text-center font-bold text-main-50">{player.name.charAt(0).toUpperCase() + player.name.slice(1)}</div>
        <div className="h-fit">
          {
            uuid !== null ? (
              <img className="mx-auto" alt="avatar"
                style={{
                  height: '100px', width: '45px',
                  transform: side === 'p2' ? 'scaleX(-1)' : undefined
                }}
                src={`https://crafatar.com/renders/body/${uuid}`}
              />
            ) : (
              avatarNmber >= 0 ? (
                <img className="mx-auto" src={avatar} alt="avatar" />
              ) : (
                <NpcSkin npcName={avatarId} height={75} width={75} style={{transform: 'scaleX(-1)', margin:'auto', marginTop:'-1.5em'}}/>
              )
            )
          }
        </div>
        <PokemonTeam team={player.team} />
      </div>
    );
  }
  

function PokemonTeam({team}: {team: Pokemon[]}){
    const teamSize = team.length > 6 ? team.length : 6;
    const halfTeamSize = Math.ceil(teamSize / 2);

    // Remove duplicates, don't know why they are there.
    const team1 = team.filter((pokemon, index, self) =>
        index === self.findIndex((t) => (
            t.searchid === pokemon.searchid
        ))
    )


    return (
        <div>
          <div className="flex flex-row justify-around">
            {Array.from({ length: halfTeamSize }, (_, i) => team1[i]).map(pokemon => (
              <PokemonSprite key={crypto.randomUUID()} pokemon={pokemon} />
            ))}
          </div>
          <div className="flex flex-row justify-around">
            {Array.from({ length: teamSize - halfTeamSize }, (_, i) => team1[i + halfTeamSize]).map(pokemon => (
              <PokemonSprite key={crypto.randomUUID()} pokemon={pokemon} />
            ))}
          </div>
        </div>
      );
}