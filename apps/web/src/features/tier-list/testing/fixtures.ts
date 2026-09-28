import { createDocument } from "../core/engine"
import { tierListSettingsSchema, type TierListDocument } from "../core/schema"

export function fixture(mode: "exclusive" | "multi" = "exclusive", overrides = {}): TierListDocument {
  const items = [{ id: "one", name: "One" }, { id: "two", name: "Two" }, { id: "three", name: "Three" }]
  return createDocument({ id: "test", slug: "test", title: "Test", rows: [
    { id: "s", label: "S", color: "#ff0000" }, { id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" },
  ], source: { type: "static", items }, settings: tierListSettingsSchema.parse({ placementMode: mode, ...overrides }), visibility: "private" }, items, "local")
}
