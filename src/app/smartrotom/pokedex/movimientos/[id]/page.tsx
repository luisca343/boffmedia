"use client"
import { rotomGET } from "@/services/boffAPI"
import { use, useEffect, useState } from "react"
import TypeBadge from "../../entrada/[[...params]]/_components/TypeBadge"
import { Slider } from "@/components/ui/slider"
import { InternalLink } from "@/components/nav/Link"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { MoveData, MoveEffect } from "../_components/MoveEffect"
import MoveDataElement from "../_components/MoveData"

/*
{
  attackIndex: 54,
  attackName: 'Hone Claws',
  attackType: 'DARK',
  attackCategory: 'STATUS',
  basePower: 0,
  ppBase: 15,
  ppMax: 24,
  accuracy: -1,
  makesContact: false,
  effects: [
    {
      type: 'ATTACK',
      amount: 1,
      isUser: true,
      modifiers: [],
      persists: false,
      effectTypeID: 'StatsEffect'
    },
    {
      type: 'Accuracy',
      amount: 1,
      isUser: true,
      modifiers: [],
      persists: false,
      effectTypeID: 'StatsEffect'
    }
  ],
  animations: [ 'leapForward' ],
  targetingInfo: {
    hitsAll: false,
    hitsOppositeFoe: false,
    hitsAdjacentFoe: false,
    hitsExtendedFoe: false,
    hitsSelf: true,
    hitsAdjacentAlly: false,
    hitsExtendedAlly: false
  },
  z: [
    {
      crystal: 'darkinium_z',
      attackName: 'Z-Hone Claws',
      basePower: 0,
      effects: [Array],
      allowedPokemon: []
    }
  ]
}

*/
export default function Movimiento({params} : {params: {id: string}}){
    const [pokemon, setPokemon] = useState() as [{
        speciesID: number
        form:string
    }[], any]


    const { id } = params;

    useEffect(() => {
        if(!id) return
        rotomGET(`/pokemon/move/${id}/pokemon`)
        .then((res) => {
            setPokemon(res)
        })

    }, [id])


    return (
        <div className="bg-surface-3 text-text-primary min-h-screen flex items-center justify-center">
            <div className="flex flex-col w-full h-full mx-auto p-6 bg-surface-3 rounded-lg shadow-lg">
                <MoveDataElement id={id} />
                <span className="text-2xl font-semibold my-4 text-center">Pokémon que pueden aprender este movimiento ({pokemon?.length})</span>
                <div className="flex flex-wrap justify-center gap-2 items-start overflow-auto pb-8">
                    {pokemon?.map((poke) => (
                        <InternalLink key={poke.speciesID + poke.form} href={`/pokedex/entrada/${poke.speciesID}/${poke.form}`}>
                            <PokemonSprite key={poke.speciesID + poke.form} id={poke.speciesID} form={poke.form} palette="none" width={50} height={50} />
                        </InternalLink>
                    ))}
                </div>
            </div> 
        </div>
    );

}