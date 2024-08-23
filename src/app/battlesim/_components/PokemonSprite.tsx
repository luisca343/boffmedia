import { getPokemonSprite } from "@/app/smartrotom/pokedex/dexUtils";
import { Pokemon } from "@pkmn/client";
import { useEffect, useState } from "react";
import { getScaleMultiplier } from "../_utils/viewUtils";

export function PokemonSprite({ pokemon, className }: { pokemon: Pokemon, className?: string, props?: any }) {
    const [url, setUrl] = useState<string>('/battlesim/pokeball.png');

    useEffect(() => {
        const speciesNum = pokemon?.species.num;
        const form = getFormName(pokemon?.species.forme);

        console.log('speciesNum', speciesNum);
        console.log('forme', pokemon?.species.forme);
        console.log('form', form);
        
        if (speciesNum) {
            getPokemonSprite(speciesNum, form, 'none', 'admin', false).then((res) => {
                setUrl(res.url ?? '/battlesim/pokeball.png');
            });
        } else {
            setUrl('/battlesim/pokeball.png');
        }
    }, [pokemon?.species.num]);

    const size = url === '/battlesim/pokeball.png' ? 12 : 24;

    return (
        <div className="flex justify-center items-center" style={{ 
            width: 24 , height: 24, opacity: `${pokemon?.hp === 0 ? 0.5 : 1}`, filter: `${pokemon?.hp === 0 ? 'brightness(0.2)' : 'brightness(1)'}`
            }}>
            <img src={url} className={className} width={size * getScaleMultiplier()} height={size * getScaleMultiplier()} />
        </div>
    );
}


function getFormName(form: string) {
    if(!form) return 'base';

    switch (form.toLowerCase()) {
        case 'alola': return 'alolan';
        case 'galar': return 'galarian';
        case 'hisui': return 'hisuian';
        case 'mega': return 'mega';
        case 'gmax': return 'gmax';


        default: return "base";
    }
}