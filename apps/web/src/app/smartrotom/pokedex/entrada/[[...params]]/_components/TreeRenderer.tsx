import React from "react"
import { SubTree, PokemonEvo } from "@/types/pokedex"
import { Evolution } from "@/types/Pokemon"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"
import { getEvolutionMethod } from "./EvolutionConditions"

interface TreeRendererProps {
  tree: SubTree
  t: any
  isCurrent?: boolean
}

function PokemonCard({ node, formKey, isCurrent }: { node: PokemonEvo; formKey: string; isCurrent: boolean }) {
  const form = formKey.split("_")[1] || "base"
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 min-w-[100px] rounded-xl transition-all shrink-0 ${
        isCurrent
          ? "bg-primary-400/[0.08] border border-primary-400/50 shadow-[0_0_18px_rgba(249,115,22,0.15)]"
          : "bg-white/[0.02] border border-white/[0.06] hover:border-primary-400/30 hover:bg-primary-400/[0.04]"
      }`}
    >
      <PokemonSpriteLink
        id={node.dex}
        form={form}
        palette="none"
        width={64}
        height={64}
        hide={true}
        displayName={true}
        url={node.spriteUrl}
      />
      <span className="font-jetbrains text-[10px] text-surface-400">
        #{String(node.dex).padStart(3, "0")}
      </span>
    </div>
  )
}

export function TreeRenderer({ tree, t, isCurrent = false }: TreeRendererProps) {
  return (
    <div className="flex flex-col gap-4">
      {Object.keys(tree).map((key: string) => {
        const node = tree[key]
        const evoKeys = Object.keys(node.evos || {})
        if (!node.pkm) return null
        const branchCount = evoKeys.length

        return (
          <div key={key} className="flex flex-row items-center">
            {/* Base Pokémon card */}
            <PokemonCard node={node} formKey={key} isCurrent={isCurrent} />

            {branchCount > 0 && (
              <>
                {/*
                  Single horizontal stub from the card's center to the junction point.
                  items-center on the parent ensures this stub sits at the card's midline,
                  which for multiple branches is also the midpoint of the vertical junction bar.
                */}
                <div className="w-5 h-px bg-white/[0.2] shrink-0" />

                {/*
                  Branch column. left: 0 here is the junction point (end of stub).
                  The vertical bar is anchored here and spans from first-branch-center
                  to last-branch-center using the (50% / N) formula.
                */}
                <div className="relative flex flex-col">
                  {branchCount > 1 && (
                    <div
                      className="absolute w-px bg-white/[0.2] pointer-events-none"
                      style={{
                        left: 0,
                        top: `calc(50% / ${branchCount})`,
                        bottom: `calc(50% / ${branchCount})`,
                      }}
                    />
                  )}

                  {evoKeys.map((evoKey: string) => {
                    const evoNode = node.evos[evoKey]
                    const methods = evoNode.methods ?? []

                    return (
                      <div key={evoKey} className="flex flex-row items-center py-2">
                        {/* Short elbow from junction bar to method pill */}
                        <div className="w-4 h-px bg-white/[0.2] shrink-0" />

                        {/*
                          Method pill — fixed 170 px so every branch has identical
                          horizontal span regardless of method text length.
                          Multiple methods for the same target are stacked with "o" divider.
                        */}
                        <div className="w-[170px] bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-center shrink-0 overflow-hidden">
                          {methods.map((method: Evolution, i: number) => (
                            <React.Fragment key={i}>
                              {i > 0 && (
                                <div className="font-jetbrains text-[8px] uppercase tracking-widest text-surface-600 my-0.5">
                                  o
                                </div>
                              )}
                              {getEvolutionMethod(method, t)}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Arrow connector to the next card */}
                        <div className="w-3 h-px bg-white/[0.2] shrink-0" />
                        <svg
                          width="8"
                          height="12"
                          viewBox="0 0 8 12"
                          fill="none"
                          className="text-surface-500 shrink-0"
                        >
                          <path
                            d="M1 1.5 6.5 6 1 10.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {/* Recursive subtree for the evolution target */}
                        <div className="ml-1">
                          <TreeRenderer tree={{ [evoKey]: evoNode }} t={t} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
