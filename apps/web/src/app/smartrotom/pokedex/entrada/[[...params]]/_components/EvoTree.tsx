import { getTranslations } from "next-intl/server"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { InfoIcon } from "lucide-react"
import { TreeRenderer } from "./TreeRenderer"
import { PokemonSpriteLink } from "../../../_components/PokemonSprite"

export async function EvoTree({ params }: { params: { id: string } }) {
  const currentDex = parseInt(params.id)
  const t = await getTranslations("pokedex")

  // An HTTP error resolves to `{ success: false }`; destructuring `.data!` off it throws
  // and takes the whole entry route down with it.
  const res = await PokemonService.getEvoTree(currentDex)
  if (!res.success || !res.data) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.02] p-6 border border-white/[0.05] text-base text-pk-surface-300">
        <InfoIcon className="h-5 w-5" />
        <span>No se pudo cargar la línea evolutiva</span>
      </div>
    )
  }
  const { tree, depth } = res.data

  let baseForm = null
  const firstKey = Object.keys(tree)[0]
  if (firstKey) {
    const node = tree[firstKey]
    baseForm = { dex: node.dex, form: firstKey.split("_")[1] || "base", spriteUrl: node.spriteUrl }
  }

  const hasEvolutions = depth > 1

  if (!hasEvolutions) {
    return (
      <div className="flex flex-col items-center justify-center text-center rounded-xl bg-white/[0.02] p-6 border border-white/[0.05]">
        {baseForm && (
          <div className="flex justify-center mb-4">
            <PokemonSpriteLink id={baseForm.dex} form={baseForm.form} palette="none" width={120} height={120} hide={true} displayName={true} />
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-base text-pk-surface-300">
          <InfoIcon className="h-5 w-5" />
          <span>Este Pokémon no evoluciona</span>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto py-2 px-1">
      <TreeRenderer tree={tree} t={t} currentDex={currentDex} />
    </div>
  )
}
