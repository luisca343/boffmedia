import { LIMITS, tierListRowSchema, tierListInstanceSchema, type TierListDocument, type TierListInstance, type TierListItem, type TierListRow, type TierListTemplate } from "./schema"

export const newTierListId = () => crypto.randomUUID()
export const getRows = (template: TierListTemplate, instance: TierListInstance) => instance.rows ?? template.rows
export const getTierListTitle = (template: TierListTemplate, instance: TierListInstance) => instance.title ?? template.title
// Starter explanations belong to the catalog/editor, rather than a user's finished board.
export const getTierListDescription = (template: TierListTemplate, instance: TierListInstance) => instance.description ?? (template.ownership?.type === "system" ? "" : template.description ?? "")
export const assignedItemIds = (instance: TierListInstance) => new Set(Object.values(instance.placements).flatMap((row) => row.map((p) => p.itemId)))
export function getSourceItems(items: TierListItem[], template: TierListTemplate, instance: TierListInstance) {
  const assigned = assignedItemIds(instance)
  return template.settings.keepSourceVisible ? items : items.filter((item) => !assigned.has(item.id))
}
export function createInstance(template: TierListTemplate, id = newTierListId()): TierListInstance {
  const placements = Object.fromEntries(Object.entries(template.initialPlacements ?? {}).map(([rowId, items]) =>
    [rowId, items.map((itemId) => ({ id: newTierListId(), itemId }))],
  ))
  return { id, templateId: template.id, placements, visibility: "private" }
}
export function createDocument(template: TierListTemplate, items: TierListItem[], instanceId?: string): TierListDocument {
  return { schemaVersion: 1, template, items, instance: createInstance(template, instanceId) }
}

export type TierListAction =
  | { type: "editHeading"; title: string; description: string }
  | { type: "assign"; itemId: string; rowId: string; index?: number; placementId?: string }
  | { type: "reorderItem"; rowId: string; from: number; to: number }
  | { type: "remove"; rowId: string; placementId?: string; itemId?: string }
  | { type: "unassign"; itemId: string }
  | { type: "clearRow"; rowId: string }
  | { type: "clear" }
  | { type: "reset" }
  | { type: "editRow"; rowId: string; patch: Pick<Partial<TierListRow>, "label" | "color" | "description" | "icon"> }
  | { type: "addRow"; row: TierListRow }
  | { type: "deleteRow"; rowId: string }
  | { type: "reorderRow"; from: number; to: number }

function move<T>(values: T[], from: number, to: number) {
  if (from < 0 || from >= values.length || to < 0 || to >= values.length || from === to) return values
  const next = [...values]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

/** All placement rules live here. No React, storage, DnD or feature schema. */
export function applyTierListAction(doc: TierListDocument, action: TierListAction): TierListDocument {
  const { template, instance, items } = doc
  const settings = template.settings
  const rows = getRows(template, instance)
  const hasRow = (id: string) => rows.some((r) => r.id === id)
  const placements = { ...instance.placements }
  let nextRows = instance.rows
  switch (action.type) {
    case "editHeading": {
      const parsed = tierListInstanceSchema.safeParse({ ...instance, title: action.title, description: action.description.trim() })
      if (!parsed.success || (parsed.data.title === instance.title && parsed.data.description === instance.description)) return doc
      return { ...doc, instance: { ...parsed.data, updatedAt: new Date().toISOString() } }
    }
    case "assign": {
      if (!hasRow(action.rowId) || !items.some((i) => i.id === action.itemId)) return doc
      const target = placements[action.rowId] ?? []
      if (!settings.allowDuplicateWithinRow && target.some((p) => p.itemId === action.itemId)) return doc
      const occurrenceId = action.placementId ?? newTierListId()
      if (Object.values(placements).some((row) => row.some((p) => p.id === occurrenceId))) return doc
      if (settings.placementMode === "exclusive") {
        for (const [rowId, row] of Object.entries(placements)) {
          if (rowId !== action.rowId) placements[rowId] = row.filter((p) => p.itemId !== action.itemId)
        }
      }
      const count = Object.values(placements).reduce((sum, row) => sum + row.length, 0)
      if (count >= LIMITS.placements) return doc
      const next = [...target]
      next.splice(Math.max(0, Math.min(action.index ?? next.length, next.length)), 0, { id: occurrenceId, itemId: action.itemId })
      placements[action.rowId] = next
      break
    }
    case "reorderItem": {
      if (!settings.allowItemReordering || !hasRow(action.rowId)) return doc
      const original = placements[action.rowId] ?? []
      const next = move(original, action.from, action.to)
      if (next === original) return doc
      placements[action.rowId] = next
      break
    }
    case "remove": {
      if (!hasRow(action.rowId)) return doc
      placements[action.rowId] = (placements[action.rowId] ?? []).filter((p) => action.placementId ? p.id !== action.placementId : p.itemId !== action.itemId)
      break
    }
    case "unassign":
      for (const [rowId, row] of Object.entries(placements)) placements[rowId] = row.filter((p) => p.itemId !== action.itemId)
      break
    case "clearRow":
      if (!hasRow(action.rowId)) return doc
      placements[action.rowId] = []
      break
    case "clear":
    case "reset":
      for (const rowId of Object.keys(placements)) delete placements[rowId]
      if (action.type === "reset") {
        nextRows = undefined
        Object.assign(placements, createInstance(template, instance.id).placements)
      }
      break
    case "editRow": {
      if (!settings.allowRowEditing || !hasRow(action.rowId)) return doc
      const candidate = rows.map((r) => r.id === action.rowId ? { ...r, ...action.patch } : r)
      if (candidate.some((r) => !tierListRowSchema.safeParse(r).success)) return doc
      nextRows = candidate
      break
    }
    case "addRow":
      if (!settings.allowRowCreation || rows.length >= LIMITS.rows || hasRow(action.row.id) || !tierListRowSchema.safeParse(action.row).success) return doc
      nextRows = [...rows, action.row]
      break
    case "deleteRow":
      if (!settings.allowRowDeletion || rows.length <= 1 || !hasRow(action.rowId)) return doc
      nextRows = rows.filter((r) => r.id !== action.rowId)
      delete placements[action.rowId]
      break
    case "reorderRow": {
      if (!settings.allowRowReordering) return doc
      const next = move(rows, action.from, action.to)
      if (next === rows) return doc
      nextRows = next
      break
    }
  }
  const nextInstance = { ...instance, placements, rows: nextRows }
  if (JSON.stringify(nextInstance) === JSON.stringify(instance)) return doc
  return { ...doc, instance: { ...nextInstance, updatedAt: new Date().toISOString() } }
}

/** Editing a definition reconciles only references that no longer exist or obey its new rules. */
export function reconcileTemplate(doc: TierListDocument, template: TierListTemplate, items: TierListItem[]): TierListDocument {
  const itemIds = new Set(items.map((i) => i.id))
  const globallyAssigned = new Set<string>()
  const placements: TierListInstance["placements"] = {}
  for (const row of template.rows) {
    const withinRow = new Set<string>()
    placements[row.id] = (doc.instance.placements[row.id] ?? []).filter((p) => {
      if (!itemIds.has(p.itemId)) return false
      if (!template.settings.allowDuplicateWithinRow && withinRow.has(p.itemId)) return false
      if (template.settings.placementMode === "exclusive" && globallyAssigned.has(p.itemId) && !withinRow.has(p.itemId)) return false
      withinRow.add(p.itemId)
      globallyAssigned.add(p.itemId)
      return true
    })
  }
  return { schemaVersion: 1, template, items, instance: { ...doc.instance, templateId: template.id, rows: undefined, placements, updatedAt: new Date().toISOString() } }
}

export function cloneTemplate(template: TierListTemplate, title = template.title): TierListTemplate {
  const id = newTierListId()
  return { ...structuredClone(template), id, slug: id, title, sourceTemplateId: template.id, ownership: { type: "user" }, visibility: "private", createdAt: new Date().toISOString(), updatedAt: undefined }
}
