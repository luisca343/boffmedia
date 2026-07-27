import React from "react"
import { SubTree, PokemonEvo } from "@/types/pokedex"
import { Evolution } from "@/types/Pokemon"
import { ChevronRightIcon } from "lucide-react"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"
import { getEvolutionMethod } from "./EvolutionConditions"

// Horizontal evolution chain (entry-evo). Branches (e.g. Eevee) stack vertically
// after the shared node; a linear chain renders as a single horizontal row.
export function TreeRenderer({ tree, t, currentDex }: { tree: SubTree; t: any; currentDex: number }) {
  return (
    <div className="flex flex-col gap-6 w-max">
      {Object.keys(tree).map((key) => (
        <EvoNodeRow key={key} node={tree[key]} formKey={key} t={t} currentDex={currentDex} />
      ))}
    </div>
  )
}

function EvoNode({ node, form, current }: { node: PokemonEvo; form: string; current: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-[14px_12px] rounded-xl min-w-[130px] shrink-0 transition-all ${
        current
          ? "border border-pk-primary-400/50 bg-pk-primary-400/[0.08] shadow-[0_0_18px_rgba(249,115,22,0.15)]"
          : "border border-white/[0.06] bg-white/[0.02] hover:border-pk-primary-400/30 hover:bg-pk-primary-400/[0.04]"
      }`}
    >
      <PokemonSpriteLink id={node.dex} form={form} palette="none" width={64} height={64} hide={true} displayName={true} url={node.spriteUrl} />
      <span className="font-pk-mono text-[10px] text-pk-surface-500">#{String(node.dex).padStart(3, "0")}</span>
    </div>
  )
}

function EvoArrow({ methods, t }: { methods: Evolution[]; t: any }) {
  return (
    <div className="flex flex-col items-center gap-1 text-pk-surface-500 text-[10.5px] font-pk-mono uppercase tracking-[0.08em] shrink-0">
      <div className="text-center max-w-[160px]">
        {methods.length ? (
          methods.map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="text-[8px] text-pk-surface-600 my-0.5">{t("evoTree.or")}</div>}
              {getEvolutionMethod(m, t)}
            </React.Fragment>
          ))
        ) : (
          <span>{t("evoTree.evolves")}</span>
        )}
      </div>
      <ChevronRightIcon className="w-3.5 h-3.5" />
      <div className="w-9 h-px bg-pk-surface-600" />
    </div>
  )
}

function EvoNodeRow({ node, formKey, t, currentDex }: { node: PokemonEvo; formKey: string; t: any; currentDex: number }) {
  const form = formKey.split("_")[1] || "base"
  const evoKeys = Object.keys(node.evos || {})
  if (!node.pkm) return null

  return (
    <div className="flex items-center gap-3.5">
      <EvoNode node={node} form={form} current={node.dex === currentDex} />
      {evoKeys.length > 0 && (
        <div className="flex flex-col gap-4">
          {evoKeys.map((ek) => {
            const evoNode = node.evos[ek]
            return (
              <div key={ek} className="flex items-center gap-3.5">
                <EvoArrow methods={evoNode.methods ?? []} t={t} />
                <EvoNodeRow node={evoNode} formKey={ek} t={t} currentDex={currentDex} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
