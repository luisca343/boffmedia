/* eslint-disable @next/next/no-img-element */
import { Battle, Pokemon } from "@pkmn/client";
import {
    GraphicsGen, Icons, Sprites
  } from '@pkmn/img';
import { PokemonSprite } from "./PokemonSprite";





  export function PlayerDataBar({ battle, side, pov } : { battle: Battle, side: 'p1' | 'p2', pov: 'p1' | 'p2' }) {
    const player = battle[side];
  
    const avatarId = player?.avatar || 'unknown';
    const avatar = Sprites.getAvatar(avatarId)
    
    //console.log(player.team)
    console.log(player)
    console.log('avatarId', avatarId)
    console.log('avatar', avatar)
    
    return (
      <div className="border border-black w-32">
        <div>{player.name}</div>
        {
            avatarId != 'unknown' ? <img src={avatar} alt="avatar"/>
            : <img className="mx-auto" alt="avatar"
            style={{
                height:'100px', width:'45px', 
                transform: side === 'p2' ? 'scaleX(-1)' : undefined}
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

    console.log(team)
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