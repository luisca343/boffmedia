"use client"
import MoveDataElement from "../_components/MoveData"
import {  PokemonSpriteLink } from "../../_components/PokemonSprite"
import { useGetPokemonByMove } from "@/hooks/pokemon/useGetPokemonByMove"

export default function Movimiento({params} : {params: {id: string}}){
  const { id } = params;
  const {pokemon} = useGetPokemonByMove(id)
  return (
    <div className="bg-surface-800 text-surface-50 min-h-screen flex items-center justify-center">
            <div className="flex flex-col w-full h-full mx-auto p-6 bg-surface-700 rounded-lg shadow-lg">
                <MoveDataElement id={id} />
                <span className="text-2xl font-semibold my-4 text-center">Pokémon que pueden aprender este movimiento ({pokemon?.length})</span>
                <div className="flex flex-wrap justify-center gap-2 items-start overflow-auto pb-8">
                    {pokemon?.map((poke) => (
                      <PokemonSpriteLink key={poke.speciesID + poke.form} id={poke.speciesID} form={poke.form} palette="none" width={50} height={50} hide={true}/>
                    ))}
                </div>
            </div> 
        </div>
    );

}