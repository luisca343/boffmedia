import type { PokedexData } from "@/types/pokedex"
import type { Palette, Pokemon } from "@/types/Pokemon"
import { usePokemonStore } from "@/stores/pokemonStore"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import type { Pokemon as PokemonType } from "@/types/Pokemon"

const SPRITES_BASE_URL = "/smartrotom/packs"
const IMAGES_BASE_URL = "/smartrotom/img/sprites"

const indexedImages = {} as { [key: string]: string }
const indexedSprites = {} as { [key: string]: string }

export async function getPokemonImage(
  id: number,
  form: string,
  palette = "none",
  hide: boolean,
  pokedexData: PokedexData,
) {
  const status = getPokedexStatus(id, form, hide, pokedexData)
  const key = `${id}_${form}_${palette}`
  if (indexedImages[key]) {
    return {
      url: indexedImages[key],
      type: "image",
      status
    }
  }

  const { getPokemonByDex } = await usePokemonStore.getState()
  const pokemon = await getPokemonByDex(id)
  const pokemonName = pokemon?.name.toUpperCase()

  const imageFolder = palette === "shiny" ? "Front Shiny" : palette === "none" ? "Front" : ""
  const pokemonImageName = form == "base" ? pokemonName : `${pokemonName}_${form.toUpperCase()}`

  const image = `${IMAGES_BASE_URL}/${imageFolder}/${pokemonImageName}.png`

  try {
    const response = await fetch(image, { method: "HEAD" })
    if (response.ok) {
      indexedImages[key] = image
      return {
        url: image,
        type: "image",
        status,
      }
    } else {
      // If image doesn't exist, fall back to sprite
      const spriteData = await getPokemonSprite(id, form, palette, hide, pokedexData)
      return {
        ...spriteData,
        status
      }
    }
  } catch (error) {
    console.error(`Error checking image existence: ${error}`)
    // If there's an error, fall back to sprite
    const spriteData = await getPokemonSprite(id, form, palette, hide, pokedexData)
    return {
      ...spriteData,
      status
    }
  }
}

function getSpriteURL(palette: Palette, pokemonId?: number) {
  if (pokemonId == 774) return "pixelmon:pokemon/774_minior/all/meteor/none/sprite.png"
  return typeof palette.sprite === "string" ? palette.sprite : palette.sprite.resource
}

export async function getPokemonSprite(
  id: number,
  form: string,
  palette = "none",
  hide: boolean,
  pokedexData?: PokedexData,
) {
  const pokedexStatus = pokedexData ? getPokedexStatus(id, form, hide, pokedexData) : 0
  const key = `${id}_${form}_${palette}`
  if (indexedSprites[key]) {
    return {
      url: indexedSprites[key],
      type: "sprite",
      status: pokedexStatus,
    }
  }
  const { getPokemonByDex } = await usePokemonStore.getState()
  const pokemon = (await getPokemonByDex(id))!

  const formData = pokemon.forms.find((f) => f.name === form) || pokemon.forms[0]
  let paletteData
  formData.genderProperties &&
    Object.values(formData.genderProperties).forEach((genderProperty) => {
      genderProperty.palettes.forEach((p) => {
        if (p.name === palette) paletteData = p
        return
      })
    })

  if (!palette) {
    if (formData.genderProperties) {
      paletteData = formData.genderProperties[0].palettes[0]
    }
  }

  if (!paletteData) {
    throw new Error(`Palette data not found for palette: ${palette}`)
  }
  const sprite = getSpriteURL(paletteData, id).split(":")[1]

  const defaultUrl = `${SPRITES_BASE_URL}/default_resourcepack/assets/pixelmon/textures/${sprite}`
  const fallbackUrl = `${SPRITES_BASE_URL}/resourcepack/assets/pixelmon/textures/${sprite}`

  try {
    const response = await fetch(defaultUrl, { method: "HEAD" })
    if (response.ok) {
      indexedSprites[key] = defaultUrl
      return {
        url: defaultUrl,
        type: "sprite",
        status: pokedexStatus,
      }
    } else {
      indexedSprites[key] = fallbackUrl
      return {
        url: fallbackUrl,
        type: "sprite",
        status: pokedexStatus,
      }
    }
  } catch (error) {
    console.error(`Error checking sprite existence: ${error}`)
    indexedSprites[key] = fallbackUrl
    return {
      url: fallbackUrl,
      type: "sprite",
      status: pokedexStatus,
    }
  }
}

export function getDisplayStatus(pokemonId: number, form: string, hide: boolean): boolean {
  if (!hide && pokemonId < 2000) return true
  const pokedexData = usePokemonStore.getState().pokedexData;
  const seen = pokedexData?.seenPokemon || []
  const key = `${pokemonId}:${form}`
  return seen.includes(key)
}
export enum PokedexStatus {
  UNSEEN = 0,
  SEEN = 1,
  CAUGHT = 2,
  SHINY = 3,
}

export function getPokedexStatus(
  pokemonId: number,
  form: string,
  hide: boolean,
  pokedexData: PokedexData,
): PokedexStatus {
  const seen = pokedexData?.seenPokemon
  const caught = pokedexData?.caughtPokemon
  const key = `${pokemonId}:${form}`
  if (caught.includes(key)) return PokedexStatus.CAUGHT
  if (seen.includes(key)) return PokedexStatus.SEEN
  return PokedexStatus.UNSEEN
}

export async function getItemSprite(name: string) {
  const img = (await PokemonService.getItemSprite(name)).data
  return await img
}

export function getPokemonName(name: string, t: any) {
  return t(`pixelmon_${name.toLocaleLowerCase().replace(" ", "_")}`)
}

export function getPokemonId(name: string, form: string) {
  if (typeof name !== "string" || typeof form !== "string") {
    throw new Error("Both name and form must be strings")
  }

  return `${name.toLowerCase()}_${form.toLowerCase()}`
}

export function getPokemonNameAndForm(name: string, form: string, t: any) {
  return t(`form`, { pokemon: getPokemonName(name, t), form: `${t(`form_${form}`)}` })
}

export function getForm(form: string, t: any) {
  return t(`form_${form || "base"}`)
}

export function getFormIndex(pokemon: Pokemon, formName: string) {
  return pokemon.forms.findIndex((form) => form.name == formName)
}

// Damage dealt by a move of a certain type to a pokemon of a certain type
export const typeChart = {
  normal: { ghost: 0, rock: 0.5, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, rock: 2, bug: 0.5, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5, fire: 0.5 },
} as { [key: string]: { [key: string]: number } }

export function getEffectifity(moveType: string, targetType: string) {
  return typeChart[moveType.toLowerCase()][targetType] || 1
}

export function getPokemonDefense(type1: string, type2 = "") {
  const result = {} as { [key: string]: number }

  for (const type in typeChart) {
    const type1Effectiveness = typeChart[type][type1.toLowerCase()] ?? 1
    const type2Effectiveness = typeChart[type][type2.toLowerCase()] ?? 1

    result[type] = type1Effectiveness * type2Effectiveness
  }
  return result
}

export function getPokemonCoverage(type1: string, type2 = "") {
  const result = {} as { [key: string]: number }

  for (const type in typeChart) {
    const type1Effectiveness = getEffectifity(type1, type) || 1
    const type2Effectiveness = type2 != "" ? (getEffectifity(type2, type) ?? 1) : 0
    result[type] = type1Effectiveness > type2Effectiveness ? type1Effectiveness : type2Effectiveness
  }

  return result
}

export function getFormName(pokemon: Pokemon, formIndex: number) {
  return pokemon.forms[formIndex].name || "base"
}

export function getPokemonNameFromIdAndForm(id: number, form: string, pokemon: PokemonType) {
  return pokemon?.name || ""
}

export function getDisplayName(
  name: string,
  id: number,
  form: string,
  palette: string,
  hide: boolean,
  t: any,
) {
  if (!getDisplayStatus(id, form, hide)) return "???"

  //if (form.includes('segment')) form = 'base';
  const formDisplay = form !== "base" ? t(`form_${form}`) : ""
  const paletteDisplay = palette !== "none" ? t(`palette_${palette}`) : ""
  return `${name}${formDisplay ? ` ${formDisplay}` : ""}${paletteDisplay ? ` ${paletteDisplay}` : ""}`
}

export function getVisibility(status: PokedexStatus, hideCaught: boolean, hideSeen: boolean) {
  if (hideCaught && status === PokedexStatus.CAUGHT) return false
  if (hideSeen && status === PokedexStatus.SEEN) return false
  return true
}

