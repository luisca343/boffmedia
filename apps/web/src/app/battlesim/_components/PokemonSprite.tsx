import { ASSET, staticAsset } from '@/lib/assets';
import { getPokemonSprite } from "@/app/smartrotom/pokedex/dexUtils";
import { Pokemon } from "@pkmn/client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getScaleMultiplier } from "../_utils/viewUtils";
import { usePokemonStore } from "@/stores/pokemonStore";

const FALLBACK_SPRITE = staticAsset(ASSET.boffmedia.tools.battlesim, 'img', 'pokeball.png');

export function PokemonSprite({ pokemon, className, scale = 1 }: { pokemon: Pokemon, className?: string, props?: any, scale?: number }) {
    const t = useTranslations("battlesim.sprite");
    const [url, setUrl] = useState<string>(FALLBACK_SPRITE);
    

    useEffect(() => {
        if(!pokemon) {
            setUrl(FALLBACK_SPRITE);
            return;
        }
        const speciesNum = pokemon?.species?.num;
        const form = getFormName(pokemon?.species?.forme);
        if (speciesNum) {
            getPokemonSprite(speciesNum, form, 'none', false).then((res) => {
                setUrl(res.url ?? FALLBACK_SPRITE);
            });
        } else {
            setUrl(FALLBACK_SPRITE);
        }
    }, [pokemon?.species?.num]);

    const size = url === FALLBACK_SPRITE ? 12 * scale : 24 * scale;

    return (
        <div className="flex justify-center items-center" style={{ 
            width: 24 * scale , height: 24 * scale, opacity: `${pokemon?.fainted ? 0.5 : 1}`, filter: `${pokemon?.fainted ? 'brightness(0.2)' : 'brightness(1)'}`
            }}>
            <img src={url} alt={pokemon?.species?.name || t("altFallback")} className={className} width={size * getScaleMultiplier()} height={size * getScaleMultiplier()} />
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