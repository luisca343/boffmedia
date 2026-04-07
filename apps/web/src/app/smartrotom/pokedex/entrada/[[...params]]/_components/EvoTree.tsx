import React from "react"
import { getTranslations } from "next-intl/server"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { TreeRenderer } from "./TreeRenderer"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"

export async function EvoTree({params}: {params: {id: string}}) {
  const {tree, depth} = (await PokemonService.getEvoTree(parseInt(params.id))).data!
  const t = await getTranslations("");

  
  let baseForm = null;
  const firstKey = Object.keys(tree)[0];
  if (firstKey) {
    const node = tree[firstKey];
    baseForm = {
      key: firstKey,
      dex: node.dex,
      form: firstKey.split('_')[1] || 'base',
      spriteUrl: node.spriteUrl,
    };
  }
  
  const hasEvolutions = depth > 1;

  return (
    <div className="text-surface-50 flex justify-center overflow-x-auto pb-4">
      <div className="min-w-[700px]">
        {hasEvolutions ? (
          <TreeRenderer tree={tree} t={t} />
        ) : (
          <div className="h-full flex-col justify-center items-center text-center rounded-lg m-2 bg-surface-700/20 p-6 border border-surface-600/30">
            {baseForm && (
              <div className="flex justify-center mb-4">
                <PokemonSpriteLink
                  id={baseForm.dex}
                  form={baseForm.form}
                  palette="none"
                  width={120}
                  height={120}
                  hide={true}
                  displayName={true}
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-xl text-surface-300">
              <InformationCircleIcon className="h-6 w-6" />
              <span className="text-shadow-border1">Este Pokémon no tiene evoluciones</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}