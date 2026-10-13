import { describe, expect, it } from "vitest"
import { WEAVE_CLASSES, filterClasses, restoreClassPlan } from "./class-model"
import english from "../../../locales/en/tools/otros.json"
import spanish from "../../../locales/es/tools/otros.json"

describe("Fortune’s Weave reference integrity", () => {
  it("resolves every data-driven translation in both catalogs", () => {
    for (const catalog of [english, spanish]) {
      const messages = catalog.otros.fortunesWeave.classes
      for (const entry of WEAVE_CLASSES) {
        expect(messages.names).toHaveProperty(entry.id)
        for (const id of [...entry.skills, ...(entry.masterSkill ? [entry.masterSkill] : [])]) expect(messages.skillNames).toHaveProperty(id)
        for (const rank of [...entry.weapons, ...entry.requirements.ranks]) expect(messages.training).toHaveProperty(rank.type)
        if (entry.requirements.item) expect(messages.items).toHaveProperty(entry.requirements.item)
        for (const unlock of entry.requirements.routeUnlocks) expect(messages.routeUnlocks).toHaveProperty(unlock.textKey)
      }
    }
  })
  it("preserves all 60 source classes and distinct weapon/unlock ranks", () => {
    expect(WEAVE_CLASSES).toHaveLength(60)
    expect(new Set(WEAVE_CLASSES.map((entry) => entry.id)).size).toBe(60)
    const diviner = WEAVE_CLASSES.find((entry) => entry.id === "diviner")!
    expect(diviner.weapons.find((weapon) => weapon.type === "whiteMagic")?.rank).toBe("D")
    expect(diviner.requirements.ranks).toEqual([])
    const cavalier = WEAVE_CLASSES.find((entry) => entry.id === "the-cavalier")!
    expect(cavalier.weapons.every((weapon) => weapon.rank === null)).toBe(true)
    expect(cavalier.requirements.ranks).toContainEqual({ type: "riding", rank: "A" })
    expect(cavalier.unverified).toBe(true)
  })

  it("keeps source gaps and route-specific unlocks rather than inventing defaults", () => {
    expect(WEAVE_CLASSES.find((entry) => entry.id === "armored-knight")?.movement).toBeNull()
    expect(WEAVE_CLASSES.find((entry) => entry.id === "caladrius")?.movement?.spaces).toBeNull()
    expect(WEAVE_CLASSES.find((entry) => entry.id === "blacksmith")?.requirements.documented).toBe(false)
    expect(WEAVE_CLASSES.find((entry) => entry.id === "bow-knight")?.masterSkill).toBeNull()
    expect(WEAVE_CLASSES.find((entry) => entry.id === "dragoon")?.requirements.routeUnlocks.map((unlock) => unlock.route)).toEqual(["cai", "theodora"])
  })
})

describe("Class planning", () => {
  it("combines weapon, tier, movement and localized search filters", () => {
    const filters = { query: " knight ", tier: "master", weapon: "bow", movement: "mounted" }
    expect(filterClasses(WEAVE_CLASSES, filters, (entry) => entry.id).map((entry) => entry.id)).toEqual(["bow-knight"])
    expect(filterClasses(WEAVE_CLASSES, { ...filters, movement: "flying" }, (entry) => entry.id)).toEqual([])
  })

  it("restores independent route plans and rejects unknown/corrupt values", () => {
    const plan = restoreClassPlan({ cai: { cai: "shido", stranger: "shido", leda: 1 }, leda: { cai: "dancer", leda: "removed" }, theodora: ["shido"] }, ["cai", "leda"])
    expect(plan).toEqual({ cai: { cai: "shido" }, leda: { cai: "dancer" }, dietrich: {}, theodora: {} })
    expect(restoreClassPlan(null, ["cai"])).toEqual({ cai: {}, leda: {}, dietrich: {}, theodora: {} })
  })
})
