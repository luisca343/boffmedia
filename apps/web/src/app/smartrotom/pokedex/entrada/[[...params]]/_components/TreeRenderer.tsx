import React from "react"
import { SubTree } from "@/types/pokedex"
import { Evolution } from "@/types/Pokemon"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"
import { getEvolutionMethod } from "./EvolutionConditions"

interface TreeRendererProps {
  tree: SubTree
  t: any
  isCurrent?: boolean
}

export function TreeRenderer({ tree, t, isCurrent = false }: TreeRendererProps) {
  return (
    <div className="flex flex-col justify-center items-start">
      {Object.keys(tree).map((key: string) => {
        const [, form] = key.split("_")
        const subTree = tree[key]
        const evos = subTree.evos

        if (Object.keys(subTree).length === 0 || !subTree.pkm) return null

        return (
          <div key={key} className="flex flex-row items-center">
            {/* Pokémon card */}
            <div
              className={`flex flex-col items-center gap-2 p-3.5 min-w-[120px] rounded-xl cursor-pointer transition-all ${
                isCurrent
                  ? "bg-primary-400/[0.08] border border-primary-400/50 shadow-[0_0_18px_rgba(249,115,22,0.15)]"
                  : "bg-white/[0.02] border border-white/[0.06] hover:border-primary-400/30 hover:bg-primary-400/[0.04]"
              }`}
            >
              <PokemonSpriteLink
                id={subTree.dex}
                form={form}
                palette="none"
                width={64}
                height={64}
                hide={true}
                displayName={true}
                url={subTree.spriteUrl}
              />
              <span className="font-jetbrains text-[10px] text-surface-400">
                #{String(subTree.dex).padStart(3, "0")}
              </span>
            </div>

            {/* Evolutions column — stacked vertically for branching trees */}
            {Object.keys(evos)?.length > 0 && (
              <div className="flex flex-col">
                {Object.keys(evos).map((evo: any) => {
                  const thisEvos = evos[evo]
                  return (
                    <div key={evo} className="flex items-center gap-1 p-2">
                      {/* Arrow + method */}
                      <div className="flex flex-col items-center gap-1 shrink-0 px-1">
                        {thisEvos.methods?.map((method: Evolution, methodIndex: number) => (
                          <div key={`method-${methodIndex}`} className="font-jetbrains text-[10px] text-surface-300 tracking-wider text-center">
                            {getEvolutionMethod(method, t)}
                          </div>
                        ))}
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-9 h-px bg-surface-600" />
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-surface-500">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </div>
                      {/* Recursive subtree */}
                      <TreeRenderer tree={{ [evo]: thisEvos }} t={t} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
