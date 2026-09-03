import { Pokemon } from "@pkmn/client";
import { Sprites } from "@pkmn/img";
import { battlesimAssetUrl } from '../asset';
import { useBattleScale } from '../lib/battle-layout';

type PokemonImageProps = {
    id: string;
    pokemon: Pokemon;
    side?: 'p1' | 'p2';
    className?: string;
    battle?: any;
};

export function PokemonImage({ id, pokemon, side = 'p2', className, battle }: PokemonImageProps) {
    const { scale } = useBattleScale();
    if (!pokemon) return <div></div>;
    let { url, w, h, pixelated } = Sprites.getPokemon(pokemon.speciesForme, { gen: 'ani', shiny: pokemon.shiny, side });

    const battleType = battle?.gameType || 'singles';

    // The near side is drawn bigger than the far one; raids blow the boss up.
    const multiplier = side === 'p2' && battleType === 'raid' ? 2.5 : side === 'p2' ? 0.65 : 1.3;

    w = w * multiplier * scale;
    h = h * multiplier * scale;

    if (url === "https://play.pokemonshowdown.com/sprites/gen5/0.png") {
        // Fallback to local static sprite
        url = battlesimAssetUrl(`sprites/gen5/${pokemon?.speciesForme}.png`);
        pixelated = true;
    }
    const protecting = !!pokemon.volatiles && Object.keys(pokemon.volatiles).includes("protect");
    return (
        <div className={`relative z-50 flex h-full w-full items-end justify-center ${className ?? ''}`} id={id}>
            {protecting && (
                <div aria-hidden className={`absolute bottom-8 h-[75px] w-[100px] self-center bg-signal opacity-30 [clip-path:circle(50%)] ${side === 'p1' ? 'z-0' : 'z-50'}`} />
            )}
            <div aria-hidden style={{
                position: 'absolute',
                bottom: '0px',
                filter: 'brightness(0) blur(5px)',
                transform: `scaleY(-.75) translateY(-${h * 1.1}px)`,
                opacity: .5,
            }}>
                <img
                    className={className} src={url} width={w} height={h}
                    style={{ imageRendering: pixelated ? 'pixelated' : 'auto' }}
                    alt=""
                />
            </div>
            <div className="pokemon-container" style={{ position: 'absolute' }}>
                <img
                    className={className} src={url} width={w} height={h}
                    style={{ imageRendering: 'pixelated' }}
                    alt={pokemon.speciesForme}
                />
            </div>
        </div>
    );
}
