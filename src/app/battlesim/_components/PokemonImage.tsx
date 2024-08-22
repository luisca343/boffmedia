import { Pokemon } from "@pkmn/client";
import { Sprites } from "@pkmn/img";
import { TARGET_WIDTH, getScaleMultiplier } from "../_utils/viewUtils";


type PokemonImageProps = {
    id: string;
    pokemon: Pokemon;
    side?: 'p1' | 'p2';
    className?: string;
    viewportWidth: number;
    battle: any;
    
};


export function PokemonImage(
    {id, pokemon, side = 'p2', className, viewportWidth, battle}:  PokemonImageProps) {
    if (!pokemon) return <div></div>;
    let {url, w, h, pixelated} = Sprites.getPokemon(pokemon.speciesForme, {gen: 'ani', shiny: pokemon.shiny, side});




    //const battleType = battle.gameType;
    const battleType = 'horde'
    const z = side === 'p1' ? 150 : 125;

    let multiplier;
    if (side === 'p2' && battleType === 'raid') {
        multiplier = 2.5;
    } else {
        multiplier = side === 'p2' ? .6 : 1.3;
    }


    viewportWidth < TARGET_WIDTH ? w = w * viewportWidth / TARGET_WIDTH * multiplier : w = w * multiplier;
    viewportWidth < TARGET_WIDTH ? h = h * viewportWidth / TARGET_WIDTH * multiplier : h = h * multiplier;

    w = w * getScaleMultiplier();
    h = h * getScaleMultiplier();


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
                        scaleY(-.75)
                        translateY(-${h * .75}px)
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
                        zIndex: z
                    }}
                    alt={pokemon.speciesForme}
                />
            </div>
        </div>
    );
}