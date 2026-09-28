import { tierListSettingsSchema, type TierListDocument, type TierListTemplate } from "./core/schema"

// Illustrative demo artwork already served by this site; never copied into the engine.
const starterArtwork = {
  exploration: "/boffmedia/img/events/hytale/icon.webp",
  strategy: "/boffmedia/img/games/tcgpocket/icon.webp",
  puzzles: "/boffmedia/img/games/pokemon/gear.png",
  building: "/boffmedia/img/games/minecraft/icon.webp",
  racing: "/boffmedia/img/games/mhwilds/wind.webp",
  adventure: "/boffmedia/img/games/pokemon/pmdsky.webp",
}

/** Enrich older system demo snapshots for display/export without rewriting saved
 * definitions, custom images, placements or history. User templates are untouched. */
export function withTierListStarterImages(doc: TierListDocument): TierListDocument {
  if (doc.template.ownership?.type !== "system" || !["standard", "planner"].includes(doc.template.id) || doc.template.source.type === "reference") return doc
  const decorate = (items: TierListDocument["items"]) => items.map((item) => {
    const image = starterArtwork[item.id as keyof typeof starterArtwork]
    return image && !item.image ? { ...item, image } : item
  })
  return { ...doc, items: decorate(doc.items), template: { ...doc.template, source: { ...doc.template.source, items: decorate(doc.template.source.items) } } }
}

type Translate = (key: string) => string
export function standardRows() {
  return [
    { id: "s", label: "S", color: "#f08080" }, { id: "a", label: "A", color: "#f6b878" },
    { id: "b", label: "B", color: "#f4d77c" }, { id: "c", label: "C", color: "#92c98f" },
  ]
}
export function createBlankTemplate(t: Translate, id: string): TierListTemplate {
  return { id, slug: id, title: t("untitled"), rows: standardRows(), source: { type: "custom", items: [] }, settings: tierListSettingsSchema.parse({}), ownership: { type: "user" }, visibility: "private" }
}
export function getTierListTemplates(t: Translate): TierListTemplate[] {
  const source: TierListTemplate["source"] = { type: "static", items: Object.entries(starterArtwork).map(([id, image]) => ({ id, name: t(`samples.${id}`), image })) }
  return [
    { id: "standard", slug: "standard", title: t("templates.standard.title"), description: t("templates.standard.description"), rows: standardRows(), source, settings: tierListSettingsSchema.parse({}), ownership: { type: "system" }, visibility: "public" },
    { id: "planner", slug: "planner", title: t("templates.planner.title"), description: t("templates.planner.description"), rows: [
      { id: "first", label: t("templates.planner.first"), color: "#88b8dd" },
      { id: "second", label: t("templates.planner.second"), color: "#b7a0d9" },
      { id: "third", label: t("templates.planner.third"), color: "#92c98f" },
    ], source, settings: tierListSettingsSchema.parse({ placementMode: "multi", keepSourceVisible: true }), ownership: { type: "system" }, visibility: "public" },
    { id: "site-games", slug: "site-games", title: t("templates.games.title"), description: t("templates.games.description"), rows: standardRows(), source: { type: "reference", key: "site-games" }, settings: tierListSettingsSchema.parse({}), ownership: { type: "system" }, visibility: "public" },
  ]
}
