import PokemonSprite from "./PokemonSprite";
import { Battle, Pokemon, Side } from "@pkmn/client"

export default function GameCanvas({pokemon, battle}: {pokemon: {[key: string]: any}, battle: Battle}) {
  const team1 = Object.keys(pokemon).filter(key => key.startsWith('p1'))
  const team2 = Object.keys(pokemon).filter(key => key.startsWith('p2'))
  
    return(
        
    <div id="game" className="w-full flex flex-col relative">
      <div className="absolute top-1 left-1 bg-white py-1 px-2 rounded-md border-2 border-black">Turn {battle.turn}</div>
      
      {team1.length === 3 ? <>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1a" className='bottom-[18%] left-[5%]'/>
          <PokemonSprite pokemon={pokemon["p1b"]} id="p1b" className='bottom-[9%] left-[37.5%]'/>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1c" className='bottom-[2%] left-[65%]'/>
        </> : <>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1a" className='bottom-[9%] left-[5%]'/>
          <PokemonSprite pokemon={pokemon["p1b"]} id="p1b" className='bottom-[2%] left-[37.5%]'/>
        </>
      }
 
    {team2.length === 3 ? <>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2a" className='top-[18%] right-[5%]'/>
          <PokemonSprite pokemon={pokemon["p2b"]} id="p2b" className='top-[9%] right-[37.5%]'/>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2c" className='top-0 right-[65%]'/>

        
        </> : <>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2a" className='top-[9%] right-[5%]'/>
          <PokemonSprite pokemon={pokemon["p2b"]} id="p2b" className='top-0 right-[37.5%]'/>
        </>
      }
    
    
  </div>
    )
}