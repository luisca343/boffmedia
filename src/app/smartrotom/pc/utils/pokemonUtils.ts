import { PokemonW } from '@/generated/api'

export function createPokemonSpec(pokemon: PokemonW): string {
  const { species, form, palette, level } = pokemon
  const isShiny = palette === 'shiny'
  const formPart = form ? ` f:${form}` : ''
  const shinyPart = isShiny ? ' s' : ''
  
  return `${species}${formPart}${shinyPart} lvl:${level}`
}

export function createPokemonSpecFromTeam(pokemon: PokemonW): string {
  const isShiny = pokemon.palette === 'shiny'
  const formPart = pokemon.form ? ` f:${pokemon.form}` : ''
  const shinyPart = isShiny ? ' s' : ''
  
  return `${pokemon.species}${formPart}${shinyPart} lvl:${pokemon.level}`
}
