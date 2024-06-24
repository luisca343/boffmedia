import PokemonSprite from "./PokemonSprite";

export default function GameCanvas({pokemon}: {pokemon: {[key: string]: any}}){
  const team1 = Object.keys(pokemon).filter(key => key.startsWith('p1'))
  const team2 = Object.keys(pokemon).filter(key => key.startsWith('p2'))
  
    return(
        
    <div id="game" className="w-full flex flex-col relative border border-red-600">
      
      {team1.length === 3 ? <>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1a" className='bottom-[10%] left-[5%]'/>
          <PokemonSprite pokemon={pokemon["p1b"]} id="p1b" className='bottom-[5%] left-[25%]'/>
          <PokemonSprite pokemon={pokemon["p1c"]} id="p1c" className='bottom-0 left-[50%]'/>
        </> : <>
          <PokemonSprite pokemon={pokemon["p1a"]} id="p1a" className='bottom-[5%] left-[5%]'/>
          <PokemonSprite pokemon={pokemon["p1b"]} id="p1b" className='bottom-0 left-[50%]'/>
        </>
      }
 
    {team2.length === 3 ? <>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2a" className='top-[10%] right-[5%]'/>
          <PokemonSprite pokemon={pokemon["p2b"]} id="p2b" className='top-[5%] right-[25%]'/>
          <PokemonSprite pokemon={pokemon["p2c"]} id="p2c" className='top-0 right-[50%]'/>

        
        </> : <>
          <PokemonSprite pokemon={pokemon["p2a"]} id="p2a" className='top-[5%] right-[5%]'/>
          <PokemonSprite pokemon={pokemon["p2b"]} id="p2b" className='top-0 right-[50%]'/>
        </>
      }
    
    
  </div>
    )
}