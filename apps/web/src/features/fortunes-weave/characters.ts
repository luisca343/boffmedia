/** Shared identities and public artwork for the recruitment tracker and tier list. */
import { ASSET, staticAsset } from "@/lib/assets"

export const FORTUNES_WEAVE_SOURCE_URL = "https://www.polygon.com/fire-emblem-fortunes-weave-recruitable-characters-all-support-level/"
export const FORTUNES_WEAVE_ROUTES = ["cai", "dietrich", "theodora", "leda"] as const

const characters = [
  {
    "id": "cai",
    "name": "Cai"
  },
  {
    "id": "tialla",
    "name": "Tialla"
  },
  {
    "id": "peter",
    "name": "Peter"
  },
  {
    "id": "ultand",
    "name": "Ultand"
  },
  {
    "id": "gaitz",
    "name": "Gaitz"
  },
  {
    "id": "jester",
    "name": "Jester"
  },
  {
    "id": "goliath",
    "name": "Goliath"
  },
  {
    "id": "dante",
    "name": "Dante"
  },
  {
    "id": "dietrich",
    "name": "Dietrich"
  },
  {
    "id": "fabio",
    "name": "Fabio"
  },
  {
    "id": "esmeralda",
    "name": "Esmeralda"
  },
  {
    "id": "mikaela",
    "name": "Mikaela"
  },
  {
    "id": "diego",
    "name": "Diego"
  },
  {
    "id": "loretta",
    "name": "Loretta"
  },
  {
    "id": "seteth",
    "name": "Seteth"
  },
  {
    "id": "ninae",
    "name": "Ninae"
  },
  {
    "id": "theodora",
    "name": "Theodora"
  },
  {
    "id": "bonaventure",
    "name": "Bonaventure"
  },
  {
    "id": "tobias",
    "name": "Tobias"
  },
  {
    "id": "lilian",
    "name": "Lilian"
  },
  {
    "id": "lysander",
    "name": "Lysander"
  },
  {
    "id": "ursula",
    "name": "Ursula"
  },
  {
    "id": "ludia",
    "name": "Ludia"
  },
  {
    "id": "simon",
    "name": "Simon"
  },
  {
    "id": "fianna",
    "name": "Fianna"
  },
  {
    "id": "leda",
    "name": "Leda"
  },
  {
    "id": "buccar",
    "name": "Buccar"
  },
  {
    "id": "sirocco",
    "name": "Sirocco"
  },
  {
    "id": "olympia",
    "name": "Olympia"
  },
  {
    "id": "mu",
    "name": "Mu"
  },
  {
    "id": "nezha",
    "name": "Nezha"
  },
  {
    "id": "sha-lan",
    "name": "Sha Lan"
  },
  {
    "id": "dadao",
    "name": "Dadao"
  },
  {
    "id": "halvin",
    "name": "Halvin"
  },
  {
    "id": "guzran",
    "name": "Guzran"
  },
  {
    "id": "yang-jie",
    "name": "Yang Jie"
  },
  {
    "id": "io",
    "name": "Io"
  },
  {
    "id": "peppe",
    "name": "Peppe"
  },
  {
    "id": "noctula",
    "name": "Noctula"
  },
  {
    "id": "sofia",
    "name": "Sofia"
  },
  {
    "id": "catania",
    "name": "Catania"
  },
  {
    "id": "nydine",
    "name": "Nydine"
  },
  {
    "id": "zarcone",
    "name": "Zarcone"
  },
  {
    "id": "majide",
    "name": "Majide"
  },
  {
    "id": "benditz",
    "name": "Benditz"
  },
  {
    "id": "inyoni",
    "name": "Inyoni"
  },
  {
    "id": "jasmine",
    "name": "Jasmine"
  },
  {
    "id": "alexandra",
    "name": "Alexandra"
  },
  {
    "id": "nuzzuo",
    "name": "Nuzzuo"
  },
  {
    "id": "kiroc",
    "name": "Kiroc"
  }
] as const

export const FORTUNES_WEAVE_CHARACTERS = characters.map((character) => ({
  ...character,
  image: staticAsset(ASSET.boffmedia.img, "games/fortunes-weave/portraits", `${character.id}${FORTUNES_WEAVE_ROUTES.some((id) => id === character.id) ? "-pre-timeskip" : ""}.webp`),
}))

export const CHARACTER_PORTRAITS: Readonly<Record<string, string>> = Object.fromEntries(
  FORTUNES_WEAVE_CHARACTERS.map(({ id, image }) => [id, image]),
)
