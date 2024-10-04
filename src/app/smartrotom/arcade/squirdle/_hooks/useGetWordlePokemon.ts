import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";

interface WordlePokemon {
    name: string;
    gen: number;
    type1: string;
    type2: string;
    weight: number;
    height: number;
}

export function useGetWordlePokemon(){
    const [pokemon, setPokemon] = useState<WordlePokemon[]>([]);
    const [targetPokemon, setTargetPokemon] = useState<WordlePokemon | null>(null);
    const types = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

    useEffect(() => {
        rotomGET("/pokemon/wordle").then((res) => {
            setPokemon(res);
            const randomIndex = Math.floor(Math.random() * res.length);
            console.log(res[randomIndex]);
            setTargetPokemon(res[randomIndex]);
        });
    }, []);

    return {pokemonData: pokemon, allTypes: types, targetPokemon} as {pokemonData: WordlePokemon[], allTypes: string[], targetPokemon: WordlePokemon};
}