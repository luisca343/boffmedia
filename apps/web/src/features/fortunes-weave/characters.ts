import { staticAssetUrl } from "@/lib/assets"
import {
  FORTUNES_WEAVE_CHARACTERS as sharedCharacters,
  FORTUNES_WEAVE_ROUTES,
  FORTUNES_WEAVE_SOURCE_URL,
} from "@boffmedia/tools-tier-list/fortunes-weave"

export { FORTUNES_WEAVE_ROUTES, FORTUNES_WEAVE_SOURCE_URL }
export const FORTUNES_WEAVE_CHARACTERS = sharedCharacters.map((character) => ({
  ...character,
  image: staticAssetUrl(character.image),
}))
export const CHARACTER_PORTRAITS: Readonly<Record<string, string>> = Object.fromEntries(
  FORTUNES_WEAVE_CHARACTERS.map(({ id, image }) => [id, image]),
)
