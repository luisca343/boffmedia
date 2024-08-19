import { Button } from "@/components/ui/button";
import PokemonDetail from "./PokemonDetail";
import { forwardRef, useImperativeHandle } from "react";
import { Pokemon, Side } from "@pkmn/client";
import { useSpring, animated, useTransition  } from "@react-spring/web";
import { getImageSize, getOffset, getScaleMultiplier } from "../_utils/viewUtils";
import { PokemonImage } from "./PokemonImage";

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

        const initialPosition = {
            left: getOffset(battle, position, getScaleMultiplier()).left,
            top: getOffset(battle, position, getScaleMultiplier()).top,
        };
        
        const [props, set] = useSpring(() => ({
            left: initialPosition.left,
            top: initialPosition.top,
            transform: 'translateY(0px)',
        }));

        
        const handleBounce = () => {
            set({ transform: 'translateY(-20px)' });
            setTimeout(() => set({ transform: 'translateY(0px)' }), 200);
        };

    
        useImperativeHandle(ref, () => ({
            bounce: handleBounce,
            moveTo: (xTo: number, yTo: number) => {
                console.log("Moving to", xTo, yTo);
                const peakX = (initialPosition.left + xTo) / 2;
                const peakY = initialPosition.top - 100; // Adjust the peak height as needed
        
                // Step 1: Jump to the peak of the parabola
                set({ left: peakX, top: peakY, transform: 'translateY(0px)' });
                setTimeout(() => {
                    // Step 2: Fall to the new position
                    set({ left: xTo, top: yTo, transform: 'translateY(0px)' });
                    setTimeout(() => {
                        // Step 3: Return to the initial position
                        set({ left: initialPosition.left, top: initialPosition.top });
                    }, 200);
                }, 200);
            }
        }));
    
        return (
            <animated.div
                id={position}
                className="absolute z-50"
                style={{
                    ...props,
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