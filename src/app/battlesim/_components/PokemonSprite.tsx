import { getPokemonSprite } from "@/app/smartrotom/pokedex/dexUtils";
import { Pokemon } from "@pkmn/client";
import { useEffect, useState } from "react";
import { getScaleMultiplier } from "../_utils/viewUtils";

export function PokemonSprite({ pokemon, className }: { pokemon: Pokemon, className?: string, props?: any }) {
    const [url, setUrl] = useState<string>('/battlesim/pokeball.png');

    useEffect(() => {
        const speciesNum = pokemon?.species.num;
        if (speciesNum) {
            getPokemonSprite(speciesNum, "base", 'none', 'admin', false).then((res) => {
                setUrl(res.url ?? '/battlesim/pokeball.png');
            });
        } else {
            setUrl('/battlesim/pokeball.png');
        }
    }, [pokemon?.species.num]);

    const size = url === '/battlesim/pokeball.png' ? 16 : 24;

    return (
        <div className="flex justify-center items-center" style={{ width: 24 * getScaleMultiplier(), height: 24 * getScaleMultiplier() }}>
            <img src={url} className={className} width={size * getScaleMultiplier()} height={size * getScaleMultiplier()} />
        </div>
    );
}