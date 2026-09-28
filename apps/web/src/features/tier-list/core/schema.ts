import { z } from "zod"

export const LIMITS = { rows: 64, items: 2000, placements: 10000, jsonBytes: 5 * 1024 * 1024, history: 50 } as const
const id = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/).refine((value) => !["__proto__", "constructor", "prototype"].includes(value), "Reserved ID")
const text = z.string().trim().min(1).max(200)
const description = z.string().max(2000).optional()
export const imageReferenceSchema = z.string().max(2048).refine(
  (value) => /^https?:\/\/[^\s]+$/i.test(value) || /^\/(?!\/)[^\s\\]*$/.test(value),
  "Expected an HTTP(S) URL or root-relative image path",
)
const jsonValue: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string().max(2000), z.number().finite(), z.boolean(), z.null(),
  z.array(jsonValue).max(100), z.record(z.string().max(120), jsonValue),
]))

export const tierListItemSchema = z.object({
  id, name: text, image: imageReferenceSchema.optional(), description,
  metadata: z.record(z.string().max(120), jsonValue).optional(),
  entity: z.object({ source: id, id: z.string().min(1).max(120) }).strict().optional(),
}).strict()
export const tierListRowSchema = z.object({
  id, label: text, color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(), description,
  icon: imageReferenceSchema.optional(),
}).strict()
export const tierListSettingsSchema = z.object({
  placementMode: z.enum(["exclusive", "multi"]).default("exclusive"),
  keepSourceVisible: z.boolean().default(false),
  allowDuplicateWithinRow: z.boolean().default(false),
  allowRowEditing: z.boolean().default(true),
  allowRowReordering: z.boolean().default(true),
  allowRowCreation: z.boolean().default(true),
  allowRowDeletion: z.boolean().default(true),
  allowItemReordering: z.boolean().default(true),
}).strict()
const items = z.array(tierListItemSchema).max(LIMITS.items)
export const tierListSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("static"), items }).strict(),
  z.object({ type: z.literal("custom"), items }).strict(),
  // Resolver keys, never arbitrary endpoint URLs. The host owns API calls.
  z.object({ type: z.literal("reference"), key: id, params: z.record(z.string().max(120), z.union([z.string().max(200), z.number().finite(), z.boolean()])).optional() }).strict(),
])
export const tierListVisibilitySchema = z.enum(["private", "unlisted", "public"])
export const tierListTemplateSchema = z.object({
  id, slug: id, title: text, description,
  rows: z.array(tierListRowSchema).min(1).max(LIMITS.rows),
  source: tierListSourceSchema, settings: tierListSettingsSchema,
  ownership: z.object({ type: z.enum(["system", "user"]), userId: id.optional() }).strict().optional(),
  visibility: tierListVisibilitySchema.default("private"), sourceTemplateId: id.optional(),
  createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional(),
}).strict()
export const tierListPlacementSchema = z.object({ id, itemId: id }).strict()
export const tierListInstanceSchema = z.object({
  id, templateId: id,
  // List-owned heading; absent fields retain compatible template defaults.
  title: text.optional(), description,
  placements: z.record(id, z.array(tierListPlacementSchema).max(LIMITS.placements)),
  // Complete instance-only row override. Template definitions never mutate on board edits.
  rows: z.array(tierListRowSchema).min(1).max(LIMITS.rows).optional(),
  ownerId: id.optional(), visibility: tierListVisibilitySchema.default("private"),
  createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional(),
}).strict()
export const tierListDocumentSchema = z.object({
  schemaVersion: z.literal(1), template: tierListTemplateSchema, instance: tierListInstanceSchema,
  // A portable snapshot for reference sources; not a second site dataset.
  items,
}).strict().superRefine((doc, ctx) => {
  const invalid = (message: string) => ctx.addIssue({ code: "custom", message })
  const unique = (values: string[], label: string) => { if (new Set(values).size !== values.length) invalid(`Duplicate ${label}`) }
  unique(doc.template.rows.map((r) => r.id), "template row IDs")
  unique(doc.items.map((i) => i.id), "item IDs")
  if (doc.template.source.type !== "reference") {
    unique(doc.template.source.items.map((i) => i.id), "source item IDs")
    if (JSON.stringify(doc.template.source.items) !== JSON.stringify(doc.items)) invalid("Source items and snapshot disagree")
  }
  if (doc.instance.templateId !== doc.template.id) invalid("Template reference mismatch")
  const rows = doc.instance.rows ?? doc.template.rows
  unique(rows.map((r) => r.id), "instance row IDs")
  const rowIds = new Set(rows.map((r) => r.id))
  const itemIds = new Set(doc.items.map((i) => i.id))
  const occurrenceIds: string[] = []
  const assigned = new Map<string, string>()
  let count = 0
  for (const [rowId, placements] of Object.entries(doc.instance.placements)) {
    if (!rowIds.has(rowId)) invalid("Unknown row in placements")
    if (!doc.template.settings.allowDuplicateWithinRow) unique(placements.map((p) => p.itemId), "items within row")
    for (const placement of placements) {
      count++
      occurrenceIds.push(placement.id)
      if (!itemIds.has(placement.itemId)) invalid("Unknown item in placements")
      const previousRow = assigned.get(placement.itemId)
      if (doc.template.settings.placementMode === "exclusive" && previousRow && previousRow !== rowId) invalid("Exclusive item assigned to multiple rows")
      assigned.set(placement.itemId, rowId)
    }
  }
  unique(occurrenceIds, "placement IDs")
  if (count > LIMITS.placements) invalid("Too many placements")
})

// Local domain types, inferred from the serialization schema. No server DTOs are duplicated.
export type TierListItem = z.infer<typeof tierListItemSchema>
export type TierListRow = z.infer<typeof tierListRowSchema>
export type TierListSettings = z.infer<typeof tierListSettingsSchema>
export type TierListDataSource = z.infer<typeof tierListSourceSchema>
export type TierListTemplate = z.infer<typeof tierListTemplateSchema>
export type TierListPlacement = z.infer<typeof tierListPlacementSchema>
export type TierListInstance = z.infer<typeof tierListInstanceSchema>
export type TierListDocument = z.infer<typeof tierListDocumentSchema>
export type TierListVisibility = z.infer<typeof tierListVisibilitySchema>
