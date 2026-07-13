import type { PokemonW } from "@boffmedia/shared"

// `form`/`palette` narrow the wire's optional fields to required — every capture this app
// reads off already carries both (even if empty), never absent.
export interface PokemonData extends Omit<PokemonW, "form" | "palette"> {
  form: string
  palette: string
}