import { rotomGET } from "@/services/boffAPI";
import { useBoffSession } from "@/services/useBoffSession";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export interface WordlePokemon {
    name: string;
    transName?: string; // Added translated name field
    gen: number;
    type1: string;
    type2: string;
    weight: number;
    height: number;
}

const pickRandom = (list: WordlePokemon[]): WordlePokemon | null =>
    list.length === 0 ? null : list[Math.floor(Math.random() * list.length)];

export function useGetWordlePokemon() {
    const t = useTranslations('pokedex');
    const {getMinecraftUUID} = useBoffSession();
    const [pokemon, setPokemon] = useState<WordlePokemon[]>([]);
    const [targetPokemon, setTargetPokemon] = useState<WordlePokemon | null>(null);
    const types = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

    // Helper function to get translated name
    const getPokemonTranslatedName = (name: string): string => {
        let [pokemonName, formName] = name.split("_");
        if (pokemonName === "ho-oh") pokemonName = "ho_oh";
        if (pokemonName === "porygon-z") pokemonName = "porygon_z";

        const translatedName = t(`pixelmon_${pokemonName}`);
        if (formName === "base") return translatedName;
        return `${translatedName} (${t(`form_${formName}`)})`;
    };

    useEffect(() => {
        if(!getMinecraftUUID()) return;
        rotomGET<WordlePokemon[]>(`/pokemon/wordle`)
            .then((res) => {
                // A failed request resolves to `{ success: false }` with no `data`, so
                // `res.data.map` would throw inside the promise and go unhandled.
                if (!res.success || !Array.isArray(res.data)) {
                    console.error("Error fetching wordle pokemon:", res.message || res.error);
                    return;
                }

                const pokemonWithNames = res.data.map((p) => ({
                    ...p,
                    transName: getPokemonTranslatedName(p.name)
                }));

                setPokemon(pokemonWithNames);
                setTargetPokemon(pickRandom(pokemonWithNames));
            })
            .catch((e) => console.error("Error fetching wordle pokemon:", e));
    }, []);

    /** Re-rolls the hidden creature. The target has always been picked client-side. */
    const pickTarget = useCallback(() => {
        setTargetPokemon((current) => {
            if (pokemon.length < 2) return pickRandom(pokemon);
            let next = pickRandom(pokemon);
            while (next && current && next.name === current.name) next = pickRandom(pokemon);
            return next;
        });
    }, [pokemon]);

    return {
        pokemonData: pokemon,
        allTypes: types,
        targetPokemon,
        pickTarget,
    };
}
