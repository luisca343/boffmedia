import { LIMITS, tierListDocumentSchema, type TierListDocument } from "../core/schema"
import { getTierListDescription } from "../core/engine"

export class TierListFormatError extends Error {
  constructor(public readonly reason: "size" | "version" | "invalid") { super(`Tier list import: ${reason}`) }
}
export function assertTierListJsonSize(raw: string): void {
  if (new TextEncoder().encode(raw).length > LIMITS.jsonBytes) throw new TierListFormatError("size")
}
export function parseTierListDocument(raw: string): TierListDocument {
  assertTierListJsonSize(raw)
  try {
    const value: unknown = JSON.parse(raw)
    if (value && typeof value === "object" && "schemaVersion" in value && value.schemaVersion !== 1) throw new TierListFormatError("version")
    // Reject dangerous object keys and excessive depth before recursive schema traversal.
    const visit = (node: unknown, depth: number) => {
      if (depth > 12) throw new TierListFormatError("invalid")
      if (!node || typeof node !== "object") return
      for (const [key, child] of Object.entries(node)) {
        if (["__proto__", "prototype", "constructor"].includes(key)) throw new TierListFormatError("invalid")
        visit(child, depth + 1)
      }
    }
    visit(value, 0)
    return tierListDocumentSchema.parse(value)
  } catch (error) {
    if (error instanceof TierListFormatError) throw error
    throw new TierListFormatError("invalid")
  }
}

/** Whitelist the public document shape, dropping account IDs and timestamps on export. */
export function exportTierListDocument(doc: TierListDocument): string {
  const validated = tierListDocumentSchema.parse(doc)
  const { ownerId: _owner, createdAt: _created, updatedAt: _updated, ...instance } = validated.instance
  const { ownership: _ownership, createdAt: _templateCreated, updatedAt: _templateUpdated, ...template } = validated.template
  const items = validated.items.map(({ metadata: _metadata, entity: _entity, ...item }) => item)
  const portable = {
    schemaVersion: 1,
    template: { ...template, source: { type: "static", items }, ownership: { type: "user" }, visibility: "private" },
    // Import remixes become user-owned; preserve an intentionally absent starter caption.
    instance: { ...instance, description: getTierListDescription(validated.template, validated.instance), visibility: "private" }, items,
  }
  const raw = JSON.stringify(tierListDocumentSchema.parse(portable), null, 2)
  assertTierListJsonSize(raw)
  return raw
}

export async function importTierListFile(file: File): Promise<TierListDocument> {
  if (file.size > LIMITS.jsonBytes) throw new TierListFormatError("size")
  return parseTierListDocument(await file.text())
}
