import { rotomGET } from "@/services/boffAPI";
import { useBoffSession } from "@/services/useBoffSession";
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
    const {getMinecraftUUID} = useBoffSession();
    const [pokemon, setPokemon] = useState<WordlePokemon[]>([]);
    const [targetPokemon, setTargetPokemon] = useState<WordlePokemon | null>(null);
    const types = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

    useEffect(() => {
        if(!getMinecraftUUID()) return;
        rotomGET(`/pokemon/wordle`).then((res:any) => {
            setPokemon(res.data);
            const randomIndex = Math.floor(Math.random() * res.data.length);
            console.log(res.data[randomIndex]);
            setTargetPokemon(res.data[randomIndex]);
        });
    }, []);

    return {pokemonData: pokemon, allTypes: types, targetPokemon} as {pokemonData: WordlePokemon[], allTypes: string[], targetPokemon: WordlePokemon};
}