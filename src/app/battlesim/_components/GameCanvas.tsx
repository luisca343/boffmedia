import PokemonSprite from "./PokemonSprite";
import { Battle, Pokemon, Side } from "@pkmn/client"

export default function GameCanvas({pokemon, battle}: {pokemon: {[key: string]: any}, battle: Battle}) {
  const team1 = Object.keys(pokemon).filter(key => key.startsWith('p1'))
  const team2 = Object.keys(pokemon).filter(key => key.startsWith('p2'))
  
    return(
        
    <div id="game" className="w-full flex flex-col relative">
      <div className="absolute top-1 right-1 bg-slate-800 py-1 px-2 rounded-md text-slate-200 border border-slate-200">Turn {battle.turn}</div>
      
      {team1.length === 3 ? <>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1a" className='bottom-[16%] left-[5%]'/>
          <PokemonSprite pokemon={pokemon["p1b"]} id="p1b" className='bottom-[8%] left-[33%]'/>
          <PokemonSprite pokemon={pokemon["p1c"]} id="p1c" className='bottom-[0%] left-[62%]'/>
        </> : <>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1a" className='bottom-[8%] left-[5%]'/>
          <PokemonSprite pokemon={pokemon["p1b"]} id="p1b" className='bottom-[0%] left-[33%]'/>
        </>
      }
 
    {team2.length === 3 ? <>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2a" className='top-[16%] right-[5%]'/>
          <PokemonSprite pokemon={pokemon["p2b"]} id="p2b" className='top-[8%] right-[33%]'/>
          <PokemonSprite pokemon={pokemon["p2c"]} id="p2c" className='top-0 right-[62%]'/>

        
        </> : <>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2a" className='top-[8%] right-[5%]'/>
          <PokemonSprite pokemon={pokemon["p2b"]} id="p2b" className='top-0 right-[33%]'/>
        </>
      }
    
    
  </div>
    )
}