/* eslint-disable @next/next/no-img-element */
import { Battle, Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { PokemonSprite } from "./PokemonSprite";





  export function PlayerDataBar({ battle, side, pov } : { battle: Battle, side: 'p1' | 'p2', pov: 'p1' | 'p2' }) {
    const player = battle[side];
  
    const avatarId = player?.avatar || 0;
    const avatar = Sprites.getAvatar(avatarId)
    
    //console.log(player.team)

    return (
      <div className="border border-black w-32">
        <div>{player.name}</div>
        {
            avatarId != 0 ? <img src={avatar} alt="avatar"/>
            : <img className="mx-auto" alt="avatar"
            style={{
                height:'100px', width:'45px', 
                transform: side === 'p1' ? 'scaleX(-1)' : undefined}
            } 
            src="https://crafatar.com/renders/body/67d9b543-5ac9-41e1-a8a5-20d7689e24a4"  
            />
        }
        <PokemonTeam team={player.team}/>
      </div>
    );
  }
  

function PokemonTeam({team}: {team: Pokemon[]}){
    const teamSize = team.length > 6 ? team.length : 6;
    const halfTeamSize = Math.ceil(teamSize / 2);


    return (
        <div>
          <div className="flex flex-row justify-around">
            {Array.from({ length: halfTeamSize }, (_, i) => team[i]).map(pokemon => (
              <PokemonSprite key={crypto.randomUUID()} pokemon={pokemon} />
            ))}
          </div>
          <div className="flex flex-row justify-around">
            {Array.from({ length: teamSize - halfTeamSize }, (_, i) => team[i + halfTeamSize]).map(pokemon => (
              <PokemonSprite key={crypto.randomUUID()} pokemon={pokemon} />
            ))}
          </div>
        </div>
      );
}