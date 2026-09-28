import { newTierListId } from "./core/engine"
import { tierListSettingsSchema, type TierListDocument, type TierListItem, type TierListTemplate } from "./core/schema"
import { FORTUNES_WEAVE_CHARACTERS, FORTUNES_WEAVE_ROUTES } from "@/features/fortunes-weave/characters"

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
 * state or custom artwork. Also refresh obsolete site-owned lord image URLs in
 * any saved list. Raw saves, placements and history are untouched. */
export function withTierListStarterImages(doc: TierListDocument): TierListDocument {
  const corrected = doc.items.map((item) => {
    if (!FORTUNES_WEAVE_ROUTES.some((id) => id === item.id)) return item
    const canonical = FORTUNES_WEAVE_CHARACTERS.find((character) => character.id === item.id)!
    const previous = canonical.image.replace("-pre-timeskip.webp", ".webp")
    const previousPath = new URL(previous, "https://tier-list.invalid").pathname
    // Exact site-owned legacy URLs only, including private remixes; custom art stays intact.
    return item.image === previous || item.image === previousPath ? { ...item, image: canonical.image } : item
  })
  if (corrected.some((item, index) => item !== doc.items[index])) {
    doc = { ...doc, items: corrected, template: doc.template.source.type === "reference" ? doc.template : { ...doc.template, source: { ...doc.template.source, items: corrected } } }
  }
  if (doc.template.ownership?.type !== "system" || !["standard", "planner"].includes(doc.template.id) || doc.template.source.type === "reference") return doc
  const decorate = (items: TierListDocument["items"]) => items.map((item) => {
    const image = starterArtwork[item.id as keyof typeof starterArtwork]
    return image && !item.image ? { ...item, image } : item
  })
  return { ...doc, items: decorate(doc.items), template: { ...doc.template, source: { ...doc.template.source, items: decorate(doc.template.source.items) } } }
}

/** Upgrade older saved boards when a system preset adds or changes fixed-row item rules. */
export function withTierListPresetRules(doc: TierListDocument, preset: TierListTemplate | null): TierListDocument {
  const isCurrentPreset = !!preset && doc.template.id === preset.id
  const isPresetRemix = !!preset && doc.template.sourceTemplateId === preset.id
  if (!preset || (!isCurrentPreset && !isPresetRemix) || preset.source.type === "reference" || doc.template.source.type === "reference") return doc
  const policy = new Map(preset.source.items.map(({ id, fixedRowId }) => [id, fixedRowId]))
  if (![...policy.values()].some(Boolean) && !doc.items.some((item) => item.fixedRowId)) return doc

  const items: TierListItem[] = doc.items.map((item) => {
    if (!policy.has(item.id)) return item
    const fixedRowId = policy.get(item.id)
    if (item.fixedRowId === fixedRowId) return item
    const { fixedRowId: _previous, ...rest } = item
    return fixedRowId ? { ...rest, fixedRowId } : rest
  })
  const rows = [...doc.template.rows]
  for (const row of preset.rows) {
    if (items.some((item) => item.fixedRowId === row.id) && !rows.some((existing) => existing.id === row.id)) rows.push(row)
  }
  const initialPlacements: Record<string, string[]> = {}
  const seededItems = new Set<string>()
  for (const [rowId, itemIds] of Object.entries(doc.template.initialPlacements ?? {})) {
    initialPlacements[rowId] = itemIds.filter((itemId) => {
      const fixedRowId = policy.get(itemId)
      if (!fixedRowId) return true
      if (fixedRowId !== rowId || seededItems.has(itemId)) return false
      seededItems.add(itemId)
      return true
    })
  }
  for (const item of items) {
    if (item.fixedRowId && !seededItems.has(item.id)) {
      initialPlacements[item.fixedRowId] = [...(initialPlacements[item.fixedRowId] ?? []), item.id]
    }
  }
  const source = { ...doc.template.source, items }
  const template = { ...doc.template, rows, source, initialPlacements }
  const rowById = new Map((doc.instance.rows ?? rows).map((row) => [row.id, row]))
  for (const fixedRow of preset.rows) {
    if (items.some((item) => item.fixedRowId === fixedRow.id) && !rowById.has(fixedRow.id)) rowById.set(fixedRow.id, fixedRow)
  }
  const nextRows = doc.instance.rows ? [...rowById.values()] : undefined
  const placements: TierListDocument["instance"]["placements"] = {}
  for (const row of rowById.values()) {
    const seenFixed = new Set<string>()
    placements[row.id] = (doc.instance.placements[row.id] ?? []).filter((placement) => {
      const fixedRowId = items.find((item) => item.id === placement.itemId)?.fixedRowId
      if (!fixedRowId) return true
      if (fixedRowId !== row.id || seenFixed.has(placement.itemId)) return false
      seenFixed.add(placement.itemId)
      return true
    })
  }
  for (const item of items) {
    if (item.fixedRowId && !placements[item.fixedRowId]?.some((placement) => placement.itemId === item.id)) {
      placements[item.fixedRowId].push({ id: newTierListId(), itemId: item.id })
    }
  }
  const unchanged = JSON.stringify([doc.template, doc.items, doc.instance.rows, doc.instance.placements]) ===
    JSON.stringify([template, items, nextRows, placements])
  if (unchanged) return doc
  return { ...doc, template, items, instance: { ...doc.instance, rows: nextRows, placements, updatedAt: new Date().toISOString() } }
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
    { id: "fire-emblem-fortunes-weave", slug: "fire-emblem-fortunes-weave", title: t("templates.fortunesWeave.title"), description: t("templates.fortunesWeave.description"), rows: FORTUNES_WEAVE_ROUTES.map((id, index) => ({ id, label: FORTUNES_WEAVE_CHARACTERS.find((character) => character.id === id)!.name, color: standardRows()[index].color })), initialPlacements: Object.fromEntries(FORTUNES_WEAVE_ROUTES.map((id) => [id, [id]])), source: { type: "static", items: FORTUNES_WEAVE_CHARACTERS }, settings: tierListSettingsSchema.parse({ placementMode: "multi", keepSourceVisible: true }), ownership: { type: "system" }, visibility: "public" },
  ]
}
