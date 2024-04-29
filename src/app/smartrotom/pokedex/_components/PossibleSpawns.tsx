"use client"

import { mcefQuery } from "@/services/mcefHelper"
import { useEffect, useState } from "react"
import { PokemonSprite } from "./PokemonSprite"
import useTranslation from 'next-translate/useTranslation'
import Link from "next/link"

type PossibleSpawn = {
    dex: number;
    species: string;
    form: string;
    palette: string;
    rarity: number;
    percentage: number;
}

export function PossibleSpawns(){
    const [spawns, setSpawns] = useState<PossibleSpawn []>()
    const {t} = useTranslation("smartrotom/pokedex/forms")
    useEffect(() => {
        const fetchSpawns = () => {
            mcefQuery('getSpawns')
                .then((response) => {
                    const res = response as PossibleSpawn[];
                    res.sort((a, b) => b.rarity - a.rarity);
                    setSpawns(res);
                })
                .catch((error) => {
                    setSpawns([
                        {dex: 1, species: 'Bulbasaur', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 2, species: 'Ivysaur', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 3, species: 'Venusaur', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 4, species: 'Charmander', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 5, species: 'Charmeleon', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 6, species: 'Charizard', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 7, species: 'Squirtle', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 8, species: 'Wartortle', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 9, species: 'Blastoise', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 10, species: 'Caterpie', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 11, species: 'Metapod', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 12, species: 'Butterfree', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 13, species: 'Weedle', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 14, species: 'Kakuna', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 15, species: 'Beedrill', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 16, species: 'Pidgey', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 17, species: 'Pidgeotto', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 18, species: 'Pidgeot', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 19, species: 'Rattata', form: 'alolan', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 20, species: 'Raticate', form: 'alolan', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 21, species: 'Spearow', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 22, species: 'Fearow', form: 'base', palette: 'none', rarity: 0, percentage: 5},

                    ]);
                });
        };
    
        fetchSpawns(); 
        
        const intervalId = setInterval(fetchSpawns, 30000); 
    
        return () => clearInterval(intervalId);
    }, []);

    return(
        <div className="flex  flex-wrap justify-center">
            {spawns?.map((spawn) => (
                <Link key={spawn.species} className="flex flex-col items-center  hover:bg-gray-400  rounded-sm text-center w-24 2xl:w-20   text-white" href={`/smartrotom/pokedex/entrada/${spawn.dex}/${spawn.form}`}>
                    <PokemonSprite id={spawn.dex} form={spawn.form} palette={spawn.palette} width={80} />
                    <div className="text-xs hidden 2xl:block">{getDisplayName(spawn.species, spawn.form, spawn.palette)}</div>
                    <div className=' font-bold text-xl 2xl:text-base'>{spawn.percentage.toFixed(4)} %</div>
                </Link>
            ))    
            }
        </div>
    )

    function getDisplayName(species: string, form: string, palette: string) {
        //if (form.includes('segment')) form = 'base';
        const formDisplay = form !== 'base' ? t(`form_${form}`) : '';
        const paletteDisplay = palette !== 'none' ? t(`palette_${palette}`) : '';
        return `${species}${formDisplay ? ` ${formDisplay}` : ''}${paletteDisplay ? ` ${paletteDisplay}` : ''}`;
        return species
    }
}