import { assertTierListJsonSize, parseTierListDocument } from "../serialization/document"
import { tierListDocumentSchema, type TierListDocument } from "../core/schema"

export interface TierListStorageKey { templateId: string; instanceId: string }
export interface TierListPersistenceAdapter {
  load(key: TierListStorageKey): Promise<TierListDocument | null>
  save(document: TierListDocument): Promise<void>
  delete(key: TierListStorageKey): Promise<void>
}
const PREFIX = "tier-list:v1:"
export const tierListStorageKey = ({ templateId, instanceId }: TierListStorageKey) => `${PREFIX}${templateId}:${instanceId}`

/** Fail loudly on quota/security/corruption; a failed read must never become an empty save. */
export class LocalStorageTierListAdapter implements TierListPersistenceAdapter {
  constructor(private readonly storage: Storage) {}
  async load(key: TierListStorageKey) {
    const raw = this.storage.getItem(tierListStorageKey(key))
    if (raw === null) return null
    const doc = parseTierListDocument(raw)
    if (doc.template.id !== key.templateId || doc.instance.id !== key.instanceId) throw new Error("Storage key mismatch")
    return doc
  }
  async save(doc: TierListDocument) {
    const validated = tierListDocumentSchema.parse(doc)
    const raw = JSON.stringify(validated)
    assertTierListJsonSize(raw)
    this.storage.setItem(tierListStorageKey({ templateId: doc.template.id, instanceId: doc.instance.id }), raw)
  }
  async delete(key: TierListStorageKey) { this.storage.removeItem(tierListStorageKey(key)) }
  async list(): Promise<{ documents: TierListDocument[]; invalidCount: number }> {
    const documents: TierListDocument[] = []
    let invalidCount = 0
    for (let index = 0; index < this.storage.length; index++) {
      const key = this.storage.key(index)
      if (!key?.startsWith(PREFIX)) continue
      try {
        const doc = parseTierListDocument(this.storage.getItem(key) ?? "")
        if (key !== tierListStorageKey({ templateId: doc.template.id, instanceId: doc.instance.id })) throw new Error("Storage key mismatch")
        documents.push(doc)
      } catch { invalidCount++ }
    }
    return { documents, invalidCount }
  }
}

/** Inject a real services/api driver when account DTOs and authorization exist.
 * No fabricated routes, automatic login migration, retries or ownership claims. */
export class AccountTierListAdapter implements TierListPersistenceAdapter {
  constructor(private readonly driver: TierListPersistenceAdapter) {}
  async load(key: TierListStorageKey) {
    const doc = await this.driver.load(key)
    if (!doc) return null
    const parsed = tierListDocumentSchema.parse(doc)
    if (parsed.template.id !== key.templateId || parsed.instance.id !== key.instanceId) throw new Error("Account key mismatch")
    return parsed
  }
  async save(doc: TierListDocument) { await this.driver.save(tierListDocumentSchema.parse(doc)) }
  async delete(key: TierListStorageKey) { await this.driver.delete(key) }
}
