"use client"

import { mcefQuery } from "@/services/mcefHelper"
import { useEffect, useState } from "react"
import { PokemonSprite, PokemonSpriteLink } from "./PokemonSprite"
import useTranslation from 'next-translate/useTranslation'
import Link from "next/link"
import { InternalLink } from "@/components/nav/Link"

type PossibleSpawn = {
    dex: number;
    species: string;
    form: string;
    palette: string;
    rarity: number;
    percentage: number;
}

export function PossibleSpawnsSection({pokemonSpawns, hideCaught= true, hideSeen = true, title}: {pokemonSpawns?: PossibleSpawn [], hideCaught?: boolean, hideSeen?: boolean, title: string}) {
    const [show, setShow] = useState(true)
    const [loaded, setLoaded] = useState(false) // Step 1: Initialize loaded state
    const [count, setCount] = useState(pokemonSpawns?.length)



    useEffect(() => {
        const titleEl = document.getElementById(title)
        
        if(titleEl) {
            const children = titleEl.getElementsByTagName('a') as HTMLCollectionOf<HTMLAnchorElement>
            setCount(children.length)
            setShow(children.length > 0) // Corrected logic to set 'show'
        }
        setLoaded(true) // Step 2: Set loaded to true after operations
    }, [hideSeen, hideCaught, title])
    
    if(!loaded) return null // Step 3: Use loaded state in rendering logic
    return <div className="flex flex-col  mb-4 rounded-xl p-2 w-[95%] m-auto" style={{display:  show ? 'block' : 'none'}}>
        <h1 className="text-4xl text-center text-main-100 font-bold">{title} - {count}</h1>
        <PossibleSpawns id={title} pokemonSpawns={pokemonSpawns} hideCaught={hideCaught} hideSeen={hideSeen}/>
    </div>
}

export function PossibleSpawns({pokemonSpawns, hideCaught= true, hideSeen = true, id}: {pokemonSpawns?: PossibleSpawn [], hideCaught?: boolean, hideSeen?: boolean, id?: string}) {
    const {t} = useTranslation("smartrotom/pokedex/forms")
    const [spawns, setSpawns] = useState<PossibleSpawn []>()
    useEffect(() => {
        if(pokemonSpawns && pokemonSpawns.length > 0) {
            setSpawns(pokemonSpawns)
            return
        }
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
                        {dex: 10012, species: 'Cococute', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 10013, species: 'Cocoareca', form: 'base', palette: 'none', rarity: 0, percentage: 5},
                        {dex: 10014, species: 'Cocolada', form: 'base', palette: 'none', rarity: 0, percentage: 5},

                    ]);
                });
        };
    
        fetchSpawns(); 
        
        const intervalId = setInterval(fetchSpawns, 30000); 
    
        return () => clearInterval(intervalId);
    }, []);


    return(
        <div className="flex  flex-wrap justify-center" id={id}>
            {spawns?.map((spawn) => (
                <PokemonSpriteLink hideCaught={hideCaught} hideSeen={hideSeen} key={spawn.species} id={spawn.dex} form={spawn.form} palette={spawn.palette} text={getDisplayName(spawn.species, spawn.form, spawn.palette)}>
                    <div className="text-xs hidden 2xl:block">{getDisplayName(spawn.species, spawn.form, spawn.palette)}</div>
                    <div className='font-bold text-xl 2xl:text-base'>{formatPercentage(spawn.percentage)} %</div>
                </PokemonSpriteLink>
            ))    
            }
        </div>
    )

    function formatPercentage(percentage: number) {
        if (percentage <= 0.0009) {
          return percentage.toFixed(4);
        } else if (percentage <= 0.009) {
          return percentage.toFixed(3);
        } else {
          return percentage.toFixed(2);
        }
      }

    function getDisplayName(species: string, form: string, palette: string) {
        //if (form.includes('segment')) form = 'base';
        const formDisplay = form !== 'base' ? t(`form_${form}`) : '';
        const paletteDisplay = palette !== 'none' ? t(`palette_${palette}`) : '';
        return `${species}${formDisplay ? ` ${formDisplay}` : ''}${paletteDisplay ? ` ${paletteDisplay}` : ''}`;
    }
}