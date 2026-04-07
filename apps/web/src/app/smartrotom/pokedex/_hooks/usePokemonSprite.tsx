import { useState, useEffect } from "react"
import { usePokedexData } from "@/hooks/usePokedexData"
import { getPokemonSprite, getPokemonImage, type PokedexStatus } from "../dexUtils"

export function usePokemonSprite(id: number, form: string, palette: string, hide: boolean, pixelated: boolean) {
  const [spriteData, setSpriteData] = useState<{ url: string; type: string; status: PokedexStatus } | undefined>(
    undefined,
  )
  const { pokedexData } = usePokedexData()

  useEffect(() => {
    const fetchData = async () => {
      if (!pokedexData) return
      try {
        const res = pixelated
          ? await getPokemonSprite(id, form, palette, hide, pokedexData)
          : await getPokemonImage(id, form, palette, hide, pokedexData)
        setSpriteData(res)
      } catch (error) {
        console.error("Error fetching sprite:", error)
      }
    }
    fetchData()
  }, [id, form, palette, hide, pixelated, pokedexData])

  return spriteData
}

