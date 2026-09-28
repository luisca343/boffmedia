import { describe, expect, it, vi } from "vitest"
import { fixture } from "../testing/fixtures"
import { AccountTierListAdapter, LocalStorageTierListAdapter, tierListStorageKey } from "./adapters"
import { resolveTierListItems } from "../adapters/sources"
import { validateTierListImageFile } from "../adapters/images"

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return { get length() { return data.size }, key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) }, clear: () => data.clear(),
  }
}
describe("local persistence", () => {
  it("saves, reloads and deletes separate versioned documents", async () => {
    const storage = memoryStorage(), adapter = new LocalStorageTierListAdapter(storage)
    const doc = fixture(), key = { templateId: doc.template.id, instanceId: doc.instance.id }
    expect(await adapter.load(key)).toBeNull()
    await adapter.save(doc)
    await adapter.save({ ...doc, instance: { ...doc.instance, id: "another" } })
    expect(await new LocalStorageTierListAdapter(storage).load(key)).toEqual(doc)
    expect((await adapter.list()).documents).toHaveLength(2)
    expect(tierListStorageKey(key)).toBe("tier-list:v1:test:local")
    await adapter.delete(key)
    expect(await adapter.load(key)).toBeNull()
    expect((await adapter.list()).documents).toHaveLength(1)
  })
  it("preserves unreadable documents and rejects mismatched keys", async () => {
    const storage = memoryStorage(), adapter = new LocalStorageTierListAdapter(storage)
    storage.setItem("tier-list:v1:test:local", "broken")
    await expect(adapter.load({ templateId: "test", instanceId: "local" })).rejects.toThrow()
    expect(await adapter.list()).toEqual({ documents: [], invalidCount: 1 })
    expect(storage.getItem("tier-list:v1:test:local")).toBe("broken")
    storage.setItem("tier-list:v1:test:other", JSON.stringify(fixture()))
    await expect(adapter.load({ templateId: "test", instanceId: "other" })).rejects.toThrow("key mismatch")
  })
  it("reports quota failures instead of claiming a save", async () => {
    const storage = memoryStorage(); storage.setItem = () => { throw new Error("quota") }
    await expect(new LocalStorageTierListAdapter(storage).save(fixture())).rejects.toThrow("quota")
  })
  it("uses an injected account boundary without fabricating endpoints or login migration", async () => {
    const driver = { load: vi.fn(async () => fixture()), save: vi.fn(async () => {}), delete: vi.fn(async () => {}) }
    const adapter = new AccountTierListAdapter(driver), key = { templateId: "test", instanceId: "local" }
    expect(await adapter.load(key)).toEqual(fixture())
    await adapter.save(fixture()); await adapter.delete(key)
    expect(driver.save).toHaveBeenCalledOnce(); expect(driver.delete).toHaveBeenCalledWith(key)
  })
})
describe("source and image boundaries", () => {
  it("resolves developer collections by stable key and validates adapter output", async () => {
    const load = vi.fn(async () => fixture().items)
    expect(await resolveTierListItems({ type: "reference", key: "collection", params: { category: "all" } }, { collection: load })).toEqual(fixture().items)
    expect(load).toHaveBeenCalledWith({ category: "all" }, undefined)
    await expect(resolveTierListItems({ type: "reference", key: "missing" })).rejects.toThrow("Unregistered")
    await expect(resolveTierListItems({ type: "static", items: [fixture().items[0], fixture().items[0]] })).rejects.toThrow("Duplicate")
  })
  it("rejects unsupported and oversized images", () => {
    expect(() => validateTierListImageFile({ type: "image/png", size: 1000 })).not.toThrow()
    expect(() => validateTierListImageFile({ type: "image/svg+xml", size: 1000 })).toThrow()
    expect(() => validateTierListImageFile({ type: "image/png", size: 6 * 1024 * 1024 })).toThrow()
  })
})
