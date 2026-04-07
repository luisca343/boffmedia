import { rotomGET } from "@/services/boffAPI";
import { useBoffSession } from "@/services/useBoffSession";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";

interface WordlePokemon {
    name: string;
    transName?: string; // Added translated name field
    gen: number;
    type1: string;
    type2: string;
    weight: number;
    height: number;
}

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
        rotomGET(`/pokemon/wordle`).then((res:any) => {
            // Add translated name to each Pokemon
            const pokemonWithNames = res.data.map((p: WordlePokemon) => ({
                ...p,
                transName: getPokemonTranslatedName(p.name)
            }));
            
            setPokemon(pokemonWithNames);
            const randomIndex = Math.floor(Math.random() * pokemonWithNames.length);
            setTargetPokemon(pokemonWithNames[randomIndex]);
        });
    }, []);

    return {
        pokemonData: pokemon, 
        allTypes: types, 
        targetPokemon
    } as {
        pokemonData: WordlePokemon[], 
        allTypes: string[], 
        targetPokemon: WordlePokemon
    };
}