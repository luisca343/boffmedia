import React from "react"
import { getTranslations } from "next-intl/server"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { TreeRenderer } from "./TreeRenderer"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"

export async function EvoTree({ params }: { params: { id: string } }) {
  const { tree, depth } = (await PokemonService.getEvoTree(parseInt(params.id))).data!
  const t = await getTranslations("pokedex")

  let baseForm = null
  const firstKey = Object.keys(tree)[0]
  if (firstKey) {
    const node = tree[firstKey]
    baseForm = {
      key: firstKey,
      dex: node.dex,
      form: firstKey.split("_")[1] || "base",
      spriteUrl: node.spriteUrl,
    }
  }

  const hasEvolutions = depth > 1

  return (
    <div className="text-surface-50 overflow-x-auto pb-4">
      <div className="w-max mx-auto py-2">
        {hasEvolutions ? (
          <TreeRenderer tree={tree} t={t} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center rounded-xl m-2 bg-white/[0.02] p-6 border border-white/[0.05]">
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
            <div className="flex items-center justify-center gap-2 text-lg text-surface-300">
              <InformationCircleIcon className="h-5 w-5" />
              <span>{t("entry_no_evolutions" as any)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
