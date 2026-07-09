// Demo data for the Catálogo chapter — the backlog/library API isn't wired to the
// v3 design system, so specimens are fed from here. [deferred]
import { CtStore, type CtGame } from "@/components/boffmedia/ui/catalog"

export const CT_GAMES: CtGame[] = [
  { id: "ct-elden", title: "Elden Ring", year: 2022, developer: "FromSoftware", genres: ["RPG", "Mundo abierto"], platforms: ["ps5", "xbox", "pc"], rating: 4.6, ratingCountK: 92 },
  { id: "ct-hades", title: "Hades", year: 2020, developer: "Supergiant Games", genres: ["Roguelike", "Acción"], platforms: ["pc", "switch", "ps5", "xbox"], rating: 4.5, ratingCountK: 61 },
  { id: "ct-stardew", title: "Stardew Valley", year: 2016, developer: "ConcernedApe", genres: ["Simulación", "Indie"], platforms: ["pc", "switch", "mobile"], rating: 4.4, ratingCountK: 48 },
  { id: "ct-celeste", title: "Celeste", year: 2018, developer: "Extremely OK Games", genres: ["Plataformas", "Indie"], platforms: ["pc", "switch", "ps5", "xbox"], rating: 4.5, ratingCountK: 35 },
  { id: "ct-outerwilds", title: "Outer Wilds", year: 2019, developer: "Mobius Digital", genres: ["Aventura", "Indie"], platforms: ["pc", "ps5", "xbox"], rating: 4.6, ratingCountK: 22 },
  { id: "ct-disco", title: "Disco Elysium", year: 2019, developer: "ZA/UM", genres: ["RPG"], platforms: ["pc", "ps5", "xbox", "switch"], rating: 4.5, ratingCountK: 30 },
]

export const CT_BY_ID: Record<string, CtGame> = Object.fromEntries(CT_GAMES.map((g) => [g.id, g]))

export const CT_DEMO_LIST = {
  title: "Esenciales modernos",
  desc: "Diez juegos con los que ponerse al día de la última década.",
  system: true,
  ids: ["ct-elden", "ct-hades", "ct-outerwilds", "ct-celeste", "ct-disco"],
}

// Seed a couple of tracked games so the cards show a corner status / your rating.
CtStore.seed({ "ct-elden": "played", "ct-hades": "playing", "ct-celeste": "backlog" }, { "ct-elden": 5, "ct-hades": 4.5 })
