import PokemonSprite from "./PokemonSprite";

export default function GameCanvas({pokemon}: {pokemon: {[key: string]: any}}){
  const team1 = Object.keys(pokemon).filter(key => key.startsWith('p1'))
  const team2 = Object.keys(pokemon).filter(key => key.startsWith('p2'))
  
    return(
        
    <div id="game" className="w-full flex flex-col relative">
      
      {team1.length === 3 ? <>
        <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[10%]" id="p1a">
          <PokemonSprite pokemon={pokemon["p1a"]} />
        </div>
      
        <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[30%]" id="p1b">
          <PokemonSprite pokemon={pokemon["p1b"]} />
        </div>
      
        <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[50%]" id="p1c">
          <PokemonSprite pokemon={pokemon["p1c"]} />
        </div>
        
        </> : <>
          <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[30%]" id="p1a">
          <PokemonSprite pokemon={pokemon["p1a"]} />
            </div>
        
          <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[50%]" id="p1b">
            <PokemonSprite pokemon={pokemon["p1b"]} />
          </div>
        </>
      }
 
    {team2.length === 3 ? <>
        <div className="w-48 h-48 border border-red-500 absolute top-0 left-[60%]" id="p2a">
          <PokemonSprite pokemon={pokemon["p2a"]} />
        </div>
      
        <div className="w-48 h-48 border border-red-500 absolute top-0 left-[40%]" id="p2b">
          <PokemonSprite pokemon={pokemon["p2b"]} />
        </div>
      
        <div className="w-48 h-48 border border-red-500 absolute top-0 left-[20%]" id="p2c">
          <PokemonSprite pokemon={pokemon["p2c"]} />
        </div>
        
        </> : <>
          <div className="w-48 h-48 border border-red-500 absolute top-0 left-[60%]" id="p2a">
          <PokemonSprite pokemon={pokemon["p2a"]} />
            </div>
        
          <div className="w-48 h-48 border border-red-500 absolute top-0 left-[40%]" id="p2b">
            <PokemonSprite pokemon={pokemon["p2b"]} />
          </div>
        </>
      }
    
    
  </div>
    )
}