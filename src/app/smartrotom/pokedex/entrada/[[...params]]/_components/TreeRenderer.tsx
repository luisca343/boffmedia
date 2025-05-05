import React from "react"
import { SubTree } from "@/types/pokedex"
import { Evolution } from "@/types/Pokemon"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"
import { getEvolutionMethod } from "./EvolutionConditions"

interface TreeRendererProps {
  tree: SubTree
  t: any
}

export function TreeRenderer({ tree, t }: TreeRendererProps) {
  return (
    <div className="h-full flex-col justify-center items-center rounded-lg m-2">
      {Object.keys(tree).map((key: string) => {
        const [pkmName, form] = key.split('_')
        const subTree = tree[key]
        const evos = subTree.evos
        
        if(Object.keys(subTree).length === 0 || !subTree.pkm) return null
        
        return (
          <div key={key} className='w-full flex flex-row items-center' style={{height: `${100/Object.keys(tree).length}%`}}>
            <PokemonSpriteLink 
              id={subTree.dex} 
              form={form} 
              palette='none' 
              width={100} 
              height={100} 
              hide={true} 
              displayName={true}
              className="transition-transform hover:scale-105"
                url={subTree.spriteUrl}
            />
            
            <div className="flex flex-col">
              {Object.keys(evos)?.length > 0 && Object.keys(evos).map((evo: any, index: number) => {
                const thisEvos = evos[evo]
                
                return (
                  <div key={`${evo}`} className="flex items-center justify-center p-2">
                    <div className="flex flex-col items-center">
                      {thisEvos.methods?.map(
                        (method: Evolution, methodIndex: number) => {
                          return (
                            <React.Fragment key={`method-${methodIndex}`}>
                              {getEvolutionMethod(method, t)}
                            </React.Fragment>
                          )
                        }
                      )}
                    </div>
                    <TreeRenderer tree={{[evo]: thisEvos}} t={t} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}