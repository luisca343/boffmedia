import { Button } from "@/components/ui/button";
import PokemonDetail from "./PokemonDetail";
import { forwardRef, useImperativeHandle } from "react";
import { Pokemon, Side } from "@pkmn/client";
import { useSpring, animated, useTransition  } from "@react-spring/web";
import { getImageSize, getOffset, getScaleMultiplier } from "../_utils/viewUtils";
import { PokemonImage } from "./PokemonImage";
import useViewportWidth from "@/services/useViewPortWidth";

type PokemonElementProps = {
    battle: any;
    pokemon: Pokemon;
    side: Side;
    position: string;
};


export type PokemonRefType = {
    bounce: () => void;
    moveTo: (xTo: number, yYo: number) => void;
}

    
    export const PokemonElement = forwardRef(({ battle, pokemon, side, position }: PokemonElementProps, ref) => {
        const sideId = side.n % 2 === 0 ? 'p1' : 'p2';


        return (
            <animated.div
                id={position}
                className="absolute z-50"
                style={{
                    left:  getOffset(battle, position, getScaleMultiplier()).left,
                    top: getOffset(battle, position, getScaleMultiplier()).top,
                    width: getImageSize(),
                    height: getImageSize()
                }}
            >
                <PokemonDetail pokemon={pokemon} className="z-50" offset={-50}>
                    <div className="w-full h-full relative">
                        <PokemonImage id={`${position}-pkm`} side={sideId} pokemon={pokemon} />
                    </div>
                </PokemonDetail>
            </animated.div>
        );
    });
    
    PokemonElement.displayName = "PokemonElement";