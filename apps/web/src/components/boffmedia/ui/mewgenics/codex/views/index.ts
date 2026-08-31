import type { ComponentType } from "react"
import type { ViewProps } from "./scaffold"
import { ItemView } from "./ItemView"
import { CharacterView } from "./CharacterView"
import { AbilityView } from "./AbilityView"
import { PassiveView } from "./PassiveView"
import { KeywordView } from "./KeywordView"
import { EventView } from "./EventView"
import { ClassView } from "./ClassView"
import { MapView } from "./MapView"
import { FurnitureView } from "./FurnitureView"
import { MutationView } from "./MutationView"
import { SetView } from "./SetView"
import { StoryCatView } from "./StoryCatView"
import { StatusView } from "./StatusView"

// Category → detail fiche. Open for extension (add a category + view here) without
// touching the codex shell, which just looks up MEW_DETAIL[cat].
export const MEW_DETAIL: Record<string, ComponentType<ViewProps>> = {
  items: ItemView,
  characters: CharacterView,
  abilities: AbilityView,
  passives: PassiveView,
  keywords: KeywordView,
  events: EventView,
  classes: ClassView,
  maps: MapView,
  furniture: FurnitureView,
  mutations: MutationView,
  sets: SetView,
  story_cats: StoryCatView,
  statuses: StatusView,
}
