import PokemonSprite from "./PokemonSprite";

export default function GameCanvas({pokemon}: {pokemon: {[key: string]: any}}){
    return(
        
    <div id="game" className="w-[60%] flex flex-col relative">
      
    <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[10%]" id="p1a">
      {pokemon['p1a'] && <PokemonSprite pokemon={pokemon['p1a']} />}
    </div>

    <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[30%]" id="p1b">
      {pokemon['p1b'] && <PokemonSprite pokemon={pokemon['p1b']} />}
    </div>
  
    <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[50%]" id="p1c">
      {pokemon['p1c'] && <PokemonSprite pokemon={pokemon['p1c']} />}
    </div>
 
    <div className="w-48 h-48 border border-blue-500 absolute top-0 right-[10%]" id="p2a">
      {pokemon['p2a'] && <PokemonSprite pokemon={pokemon['p2a']} />}
    </div>
    
    <div className="w-48 h-48 border border-blue-500 absolute top-0 right-[30%]" id="p2b">
      {pokemon['p2b'] && <PokemonSprite pokemon={pokemon['p2b']} />}
    </div>

    <div className="w-48 h-48 border border-blue-500 absolute top-0 right-[50%]" id="p2c">
      {pokemon['p2c'] && <PokemonSprite pokemon={pokemon['p2c']} />}
    </div>

    
    
  </div>
    )
}