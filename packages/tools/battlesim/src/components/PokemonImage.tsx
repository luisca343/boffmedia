import type * as React from "react";
import { Pokemon } from "@pkmn/client";
import { Sprites } from "@pkmn/img";
import { battleSpriteUrl, handleSpriteError, useSpriteSource } from "../sprites";
import { useBattleScale } from '../lib/battle-layout';

type PokemonImageProps = {
    id: string;
    pokemon: Pokemon;
    side?: 'p1' | 'p2';
    className?: string;
    battle?: any;
};

/**
 * One warning per URL, ever.
 *
 * A missing sprite errors once per `<img>`, and an animated GIF that fails on a
 * flaky connection can do it on every switch — logging each one buries the
 * console under the same line. Exported because the hazards need exactly the
 * same discipline.
 */
const warnedUrls = new Set<string>();
export function warnSpriteFallback(url: string): void {
    if (!url || warnedUrls.has(url)) return;
    warnedUrls.add(url);
    console.warn('[battlesim] sprite fallback', url);
}

function onSpriteError(event: React.SyntheticEvent<HTMLImageElement>): void {
    warnSpriteFallback(event.currentTarget.src);
    handleSpriteError(event);
}

/**
 * The Pokémon on the field.
 *
 * THE ELEMENT CONTRACT: this renders EXACTLY ONE `<img>` inside the slot
 * wrapper, because `Scene.getPokemonSpriteElement` finds the sprite with
 * `wrapper.querySelector('img')` — the first one wins. The drop shadow used to
 * be a second `<img>` placed BEFORE it, so every engine query that wanted the
 * sprite got the upside-down blurred copy instead. It is a background-image div
 * now; it is decorative, so losing the fallback chain on it costs nothing.
 *
 * The URL comes from `battleSpriteUrl`, never from a hand-built Showdown path:
 * that is what routes the animated set through the CDN when online and the
 * mirrored gen-5 stills out of the local pack when not (`useSpriteSource`), and
 * what keeps `gen5-back-shiny` composing in the one order that exists. The old
 * `Sprites.getPokemon(..., { gen: 'ani' })` call was hard-wired to the CDN and
 * had a dead `gen5/0.png` fallback that 404'd on the pack too.
 *
 * `speciesForme` is passed as-is and `transformedInto` is always `null`:
 * `|-transform|` has already rewritten `speciesForme` to the target by the time
 * this renders, so resolving it a second time would be a no-op at best.
 */
export function PokemonImage({ id, pokemon, side = 'p2', className, battle }: PokemonImageProps) {
    const { scale } = useBattleScale();
    const source = useSpriteSource();
    if (!pokemon) return <div></div>;

    const gender = (pokemon.gender || undefined) as 'M' | 'F' | 'N' | undefined;
    const url = battleSpriteUrl({
        speciesForme: pokemon.speciesForme,
        shiny: pokemon.shiny,
        gender,
        side,
        source,
        transformedInto: null,
    });

    // Metadata only — the natural box of the art this species resolves to. The
    // URL above is the authority on WHICH file; this is the authority on how
    // big it is, and the two agree because they resolve the same species.
    const meta = Sprites.getPokemon(pokemon.speciesForme, {
        gen: source === 'static' ? 5 : 'ani',
        shiny: pokemon.shiny,
        side,
        ...(gender ? { gender } : {}),
    } as any);

    const battleType = battle?.gameType || 'singles';
    // The near side is drawn bigger than the far one; raids blow the boss up.
    const multiplier = side === 'p2' && battleType === 'raid' ? 2.5 : side === 'p2' ? 0.65 : 1.3;
    const w = meta.w * multiplier * scale;
    const h = meta.h * multiplier * scale;

    const protecting = !!pokemon.volatiles && Object.keys(pokemon.volatiles).includes("protect");

    return (
        <div className={`relative z-50 flex h-full w-full items-end justify-center ${className ?? ''}`} id={id}>
            {protecting && (
                <div aria-hidden className={`absolute bottom-8 h-[4.6875rem] w-[6.25rem] self-center bg-signal opacity-30 [clip-path:circle(50%)] ${side === 'p1' ? 'z-0' : 'z-50'}`} />
            )}
            {/* Drop shadow. A div, NOT an img — see the element contract above. */}
            <div aria-hidden style={{
                position: 'absolute',
                bottom: '0px',
                width: w,
                height: h,
                backgroundImage: `url(${url})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                imageRendering: meta.pixelated ? 'pixelated' : 'auto',
                filter: 'brightness(0) blur(5px)',
                transform: `scaleY(-.75) translateY(-${h * 1.1}px)`,
                opacity: .5,
            }} />
            <div className="pokemon-container" style={{ position: 'absolute' }}>
                <img
                    className={className} src={url} width={w} height={h}
                    style={{ imageRendering: 'pixelated' }}
                    onError={onSpriteError}
                    alt={pokemon.speciesForme}
                />
            </div>
        </div>
    );
}
