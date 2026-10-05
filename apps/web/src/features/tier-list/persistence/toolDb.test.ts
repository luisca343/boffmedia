import { describe, expect, it } from "vitest"
import type { ToolDb, ToolDoc } from "@boffmedia/tool-kit"
import { ToolDbTierListAdapter } from "@boffmedia/tools-tier-list/persistence/toolDb"
import { createDocument } from "../core/engine"
import { fixture } from "../testing/fixtures"

function memoryDb(): ToolDb {
  const rows = new Map<string, unknown>()
  return {
    async get<T>(_collection: string, id: string): Promise<T | null> { return (rows.get(id) as T | undefined) ?? null },
    async put(_collection, id, value) { rows.set(id, value) },
    async remove(_collection, id) { rows.delete(id) },
    async list<T>(): Promise<Array<ToolDoc<T>>> { return [...rows].map(([id, value]) => ({ id, value: value as T, updatedAt: 0 })) },
    async clear() { rows.clear() },
  }
}

describe("desktop tier-list document storage", () => {
  it("round-trips distinct arrangements without losing the template snapshot", async () => {
    const adapter = new ToolDbTierListAdapter(memoryDb())
    const base = fixture("multi")
    const first = createDocument(base.template, base.items, "first")
    const second = createDocument(base.template, base.items, "second")
    await adapter.save(first)
    await adapter.save(second)
    expect((await adapter.list()).documents).toHaveLength(2)
    expect((await adapter.load({ templateId: base.template.id, instanceId: "first" }))?.instance.id).toBe("first")
    await adapter.delete({ templateId: base.template.id, instanceId: "first" })
    expect(await adapter.load({ templateId: base.template.id, instanceId: "first" })).toBeNull()
    expect(await adapter.load({ templateId: base.template.id, instanceId: "second" })).not.toBeNull()
  })

  it("reports a malformed row and refuses to load it as an empty board", async () => {
    const db = memoryDb()
    const adapter = new ToolDbTierListAdapter(db)
    await db.put("documents", "tier-list:v1:bad:default", { schemaVersion: 1 })
    expect((await adapter.list()).invalidCount).toBe(1)
    await expect(adapter.load({ templateId: "bad", instanceId: "default" })).rejects.toThrow()
  })
})
