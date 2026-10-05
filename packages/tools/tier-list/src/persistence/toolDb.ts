import type { ToolDb } from "@boffmedia/tool-kit"
import { tierListDocumentSchema, type TierListDocument } from "../core/schema"
import { tierListStorageKey, type TierListPersistenceAdapter, type TierListStorageKey } from "./adapters"
import { assertTierListJsonSize } from "../serialization/document"

const COLLECTION = "documents"

/** Desktop SQLite (and browser IndexedDB in renderer mode) adapter. */
export class ToolDbTierListAdapter implements TierListPersistenceAdapter {
  constructor(private readonly db: ToolDb) {}

  async load(key: TierListStorageKey): Promise<TierListDocument | null> {
    const raw = await this.db.get(COLLECTION, tierListStorageKey(key))
    if (raw === null) return null
    const doc = tierListDocumentSchema.parse(raw)
    if (doc.template.id !== key.templateId || doc.instance.id !== key.instanceId) throw new Error("Storage key mismatch")
    return doc
  }

  async save(document: TierListDocument): Promise<void> {
    const doc = tierListDocumentSchema.parse(document)
    assertTierListJsonSize(JSON.stringify(doc))
    await this.db.put(COLLECTION, tierListStorageKey({ templateId: doc.template.id, instanceId: doc.instance.id }), doc)
  }

  async delete(key: TierListStorageKey): Promise<void> {
    await this.db.remove(COLLECTION, tierListStorageKey(key))
  }

  async list(): Promise<{ documents: TierListDocument[]; invalidCount: number }> {
    const rows = await this.db.list(COLLECTION)
    const documents: TierListDocument[] = []
    let invalidCount = 0
    for (const row of rows) {
      const result = tierListDocumentSchema.safeParse(row.value)
      if (!result.success || row.id !== tierListStorageKey({ templateId: result.data.template.id, instanceId: result.data.instance.id })) {
        invalidCount++
      } else documents.push(result.data)
    }
    return { documents, invalidCount }
  }
}
