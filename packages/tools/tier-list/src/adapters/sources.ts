import { tierListItemSchema, LIMITS, type TierListDataSource, type TierListItem } from "../core/schema"

export type TierListSourceResolver = (params: Record<string, string | number | boolean>, signal?: AbortSignal) => Promise<TierListItem[]>
export type TierListSourceRegistry = Readonly<Record<string, TierListSourceResolver>>

export async function resolveTierListItems(source: TierListDataSource, resolvers: TierListSourceRegistry = {}, signal?: AbortSignal): Promise<TierListItem[]> {
  let items: TierListItem[]
  if (source.type === "reference") {
    const resolver = resolvers[source.key]
    if (!resolver) throw new Error(`Unregistered tier list source: ${source.key}`)
    items = await resolver(source.params ?? {}, signal)
  } else items = source.items
  const parsed = tierListItemSchema.array().max(LIMITS.items).parse(items)
  if (new Set(parsed.map((i) => i.id)).size !== parsed.length) throw new Error("Duplicate source item IDs")
  return parsed
}
