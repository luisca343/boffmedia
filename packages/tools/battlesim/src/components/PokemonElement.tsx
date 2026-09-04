import { forwardRef, useState } from "react";
import { Pokemon } from "@pkmn/client";
import { getImageSize, getOffset } from "../engine/viewUtils";
import { PokemonImage } from "./PokemonImage";
import { useBattleScale } from "../lib/battle-layout";

type PokemonElementProps = {
    battle: any;
    pokemon: Pokemon;
    position: string;
    showFullInfo?: boolean;
    /**
     * Start invisible, because a summon is about to fade this Pokémon in.
     *
     * THE RULE (and why it is not simply "always"): `switch` / `drag` /
     * `replace` are the only events that end in `Scene.playSummon`, and the
     * canvas raises this flag exactly when the slot's IDENT changed — which is
     * true of a switch, of a drag, of an Illusion `replace`, and of the opening
     * lead switch-ins (the engine summons those too, so their sprites must be
     * hidden as well or they pop in at full size before growing out of the
     * ball). It is false for `detailschange` / `-formechange` / `-transform`:
     * those remount the node too (the identity key folds in `speciesForme`),
     * but their handler only commits and waits — nothing would ever fade the
     * sprite back in, and a Mega Evolution would simply disappear.
     *
     * Frozen per mounted instance below, so a later re-render cannot rewrite
     * the opacity the engine's summon is in the middle of animating.
     */
    mountHidden?: boolean;
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
 *
 * THE DOM CONTRACT THE ENGINE RELIES ON, all three levels load-bearing:
 *   `<div id={slotCode}>`          ← `Scene.getPokemonElement`; the engine writes
 *                                    left/top/opacity/transform/zIndex here
 *     `<div class="relative …">`   ← `Scene.getPokemonInnerElement` (first child);
 *                                    the crit shake lives here so it does not
 *                                    fight the move animation's transform
 *       … exactly one `<img>`      ← `Scene.getPokemonSpriteElement`
 * Do not add a wrapper between them, and do not add a second `<img>`.
 */
export const PokemonElement = forwardRef<HTMLDivElement, PokemonElementProps>(function PokemonElement({
    battle,
    pokemon,
    position,
    mountHidden = false,
    onHover,
}, ref) {
    const { scale } = useBattleScale();
    // Frozen at mount. The element is keyed by identity, so "this instance" and
    // "this Pokémon in this slot" are the same thing: a new identity is a new
    // instance and gets a fresh answer, while every re-render of the SAME one
    // keeps the value React first wrote. That is what stops React from
    // resetting `opacity` half way through the engine's summon — the style prop
    // never changes, so React never touches the property again and the
    // imperative writes win.
    const [hiddenAtMount] = useState(mountHidden);

    // `p1` is the near side (back sprite), `p2` the far one. Read off the SLOT
    // rather than off a `Side` object: the slot code is what decides where the
    // sprite is drawn, so it is also what decides which way it faces. The old
    // `side` prop was passed `battle.p1` for the near slots and `battle.p2` for
    // the far ones regardless of pov, which happened to give the right answer
    // and was one refactor away from not.
    const sideId = position.startsWith('p2') ? 'p2' : 'p1';

    const offset = getOffset(battle, position, scale);
    // `getOffset` answers null for a slot this gametype has no box for; it used
    // to answer { top: 2000 }, which parked the sprite below the field instead.
    if (!offset) return null;
    const size = getImageSize(scale);
    return (
        <div
            id={position}
            ref={ref}
            className="absolute"
            style={{
                left: offset.left, top: offset.top, width: size, height: size,
                ...(hiddenAtMount ? { opacity: 0 } : null),
            }}
            onPointerEnter={onHover ? (e) => { if (e.pointerType !== 'touch') onHover(position, { left: offset.left, top: offset.top, size }); } : undefined}
            onPointerLeave={onHover ? () => onHover(position, null) : undefined}
        >
            <div className="relative h-full w-full">
                <PokemonImage id={`${position}-pkm`} side={sideId} pokemon={pokemon} battle={battle} />
            </div>
        </div>
    );
});
