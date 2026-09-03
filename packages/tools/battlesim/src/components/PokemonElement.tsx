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
    /**
     * Pointer entered or left this sprite, with the box it occupies so the
     * canvas can place a card against it. The sprite reports its own geometry
     * rather than being measured: it already computed it to position itself,
     * and a `getBoundingClientRect` here would be in viewport coordinates
     * while the card is drawn in the field's.
     */
    onHover?: (position: string, box: { left: number; top: number; size: number } | null) => void;
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
    onHover,
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
            onPointerEnter={onHover ? (e) => { if (e.pointerType !== 'touch') onHover(position, { left: offset.left, top: offset.top, size }); } : undefined}
            onPointerLeave={onHover ? () => onHover(position, null) : undefined}
        >
            <div className="relative h-full w-full">
                <PokemonImage id={`${position}-pkm`} side={sideId} pokemon={pokemon} battle={battle} />
            </div>
        </div>
    );
});
