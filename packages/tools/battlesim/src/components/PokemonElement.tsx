import { forwardRef } from "react";
import { Pokemon, Side } from "@pkmn/client";
import { getImageSize, getOffset } from "../engine/viewUtils";
import { PokemonImage } from "./PokemonImage";
import { useBattleScale } from "../lib/battle-layout";

type PokemonElementProps = {
    battle: any;
    pokemon: Pokemon;
    side: Side;
    position: string;
    showFullInfo?: boolean;
};

export type PokemonRefType = {
    bounce: () => void;
    moveTo: (xTo: number, yYo: number) => void;
}

/**
 * The sprite's box on the field, placed in 960-unit field space times the
 * canvas scale from context — the same number the engine uses to animate it.
 * Details live in the plate's popover now; the sprite is just the sprite.
 */
export const PokemonElement = forwardRef<HTMLDivElement, PokemonElementProps>(function PokemonElement({
    battle,
    pokemon,
    side,
    position,
}, ref) {
    const { scale } = useBattleScale();
    const sideId = side.n % 2 === 0 ? 'p1' : 'p2';
    const offset = getOffset(battle, position, scale);
    const size = getImageSize(scale);
    return (
        <div
            id={position}
            ref={ref}
            className="absolute"
            style={{ left: offset.left, top: offset.top, width: size, height: size }}
        >
            <div className="relative h-full w-full">
                <PokemonImage id={`${position}-pkm`} side={sideId} pokemon={pokemon} battle={battle} />
            </div>
        </div>
    );
});
