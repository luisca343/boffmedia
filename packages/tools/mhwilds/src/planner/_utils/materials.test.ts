import { describe, expect, it } from "vitest";
import { aggregateLoadoutRequirements, aggregateRequirements } from "./materials";
import { findWeaponPaths, pathStepMaterials } from "./weapon-paths";

const item = (id: number, name: string) => ({ id, name, rarity: 4 });
const material = (id: number, name: string, quantity: number): any => ({
  item: item(id, name),
  quantity,
  id,
});

describe("Monster Hunter Wilds material aggregation", () => {
  it("keeps every route when branches converge on the same target", () => {
    const roots = [
      {
        id: 1,
        pathKey: "1",
        craftingMaterials: [material(10, "Ore", 1)],
        craftingZennyCost: 100,
        children: [{
          id: 9,
          pathKey: "1/9",
          upgradeMaterials: [material(11, "Claw", 1)],
          upgradeZennyCost: 200,
          children: [],
        }],
      },
      {
        id: 2,
        pathKey: "2",
        craftingMaterials: [material(10, "Ore", 3)],
        craftingZennyCost: 400,
        children: [{
          id: 9,
          pathKey: "2/9",
          upgradeMaterials: [material(11, "Claw", 2)],
          upgradeZennyCost: 500,
          children: [],
        }],
      },
    ] as any;

    const paths = findWeaponPaths(roots, "9");

    expect(paths).toHaveLength(2);
    expect(new Set(paths.map((path) => path.key)).size).toBe(2);
    expect(pathStepMaterials(paths[0])).toMatchObject({ zenny: 300, steps: 2 });
    expect(pathStepMaterials(paths[1])).toMatchObject({ zenny: 900, steps: 2 });
  });

  it("sums each selected weapon independently, including shared ancestors", () => {
    const roots = [
      {
        id: 1,
        name: "Base",
        craftingMaterials: [material(10, "Ore", 2)],
        craftingZennyCost: 100,
        upgradeMaterials: [],
        upgradeZennyCost: 0,
        children: [
          {
            id: 2,
            name: "Branch A",
            craftingMaterials: [],
            craftingZennyCost: 0,
            upgradeMaterials: [material(11, "Claw", 1)],
            upgradeZennyCost: 200,
            children: [],
          },
          {
            id: 3,
            name: "Branch B",
            craftingMaterials: [],
            craftingZennyCost: 0,
            upgradeMaterials: [material(11, "Claw", 2)],
            upgradeZennyCost: 300,
            children: [],
          },
        ],
      },
    ] as any;

    const pathA = findWeaponPaths(roots, "2")[0];
    const pathB = findWeaponPaths(roots, "3")[0];
    const result = aggregateLoadoutRequirements({
      weapons: [
        { id: 2, name: "Branch A", kind: "bow", rarity: 1, damage: { raw: 1, display: 1 }, affinity: 0, slots: [] },
        { id: 3, name: "Branch B", kind: "bow", rarity: 1, damage: { raw: 1, display: 1 }, affinity: 0, slots: [] },
      ],
      weaponPaths: [pathA, pathB],
    });

    expect(result.zenny).toBe(700);
    expect(result.materials.find((m) => m.item.id === 10)?.quantity).toBe(4);
    expect(result.materials.find((m) => m.item.id === 11)?.quantity).toBe(3);
  });

  it("includes armor and charms and reports decorations without recipes", () => {
    const result = aggregateLoadoutRequirements({
      armor: [{
        id: 1,
        name: "Conga Helm",
        kind: "head",
        rank: "high",
        rarity: 5,
        defense: { base: 1 },
        resistances: { fire: 0, water: 0, thunder: 0, ice: 0, dragon: 0 },
        slots: [],
        skills: [],
        crafting: { materials: [material(10, "Ore", 2)], zennyCost: 3000 },
      }],
      charm: {
        id: 2,
        charm: { id: 1, gameId: 1 },
        name: "Wind Charm I",
        description: "",
        level: 1,
        rarity: 4,
        skills: [],
        slots: [],
        crafting: { charmRank: { id: 1 }, craftable: true, materials: [material(11, "Claw", 1)], zennyCost: 1500, id: 1 },
      },
      decorations: [{ id: 3, name: "Poison Jewel", slot: 1, rarity: 3, skills: [] }],
    });

    expect(result.zenny).toBe(4500);
    expect(result.materials).toHaveLength(2);
    expect(result.untracked).toEqual([{ label: "Poison Jewel", kind: "decoration", reason: "no-direct-crafting-recipe" }]);
  });

  it("aggregates multiple wishlist charms and decorations", () => {
    const charm = (id: number, name: string, materialId: number, zennyCost: number) => ({
      id,
      charm: { id, gameId: 1 },
      name,
      description: "",
      level: 1,
      rarity: 4,
      skills: [],
      slots: [],
      crafting: {
        charmRank: { id },
        craftable: true,
        materials: [material(materialId, "Ore", 1)],
        zennyCost,
        id,
      },
    });
    const result = aggregateLoadoutRequirements({
      charms: [charm(1, "Charm I", 10, 100), charm(2, "Charm II", 11, 200)],
      decorations: [{
        id: 3,
        name: "Attack Jewel",
        slot: 1,
        rarity: 3,
        skills: [],
        crafting: { materials: [material(12, "Gem", 2)], zennyCost: 50 },
      }],
    });

    expect(result.zenny).toBe(350);
    expect(result.materials).toHaveLength(3);
    expect(result.materials.find((entry) => entry.item.id === 12)?.quantity).toBe(2);
    expect(result.untracked).toHaveLength(0);
  });

  it("keeps source quantities when multiple rows share an item", () => {
    const result = aggregateRequirements([
      { label: "A", kind: "armor", materials: [material(1, "Scale", 2)] },
      { label: "B", kind: "armor", materials: [material(1, "Scale", 3)] },
    ]);

    expect(result.materials[0]).toMatchObject({ item: { id: 1 }, quantity: 5, sources: ["A", "B"] });
  });

  it("preserves stable item identity and icon metadata for asset joins", () => {
    const result = aggregateRequirements([{
      label: "Conga Helm",
      kind: "armor",
      materials: [{
        item: {
          id: 7,
          gameId: 407,
          name: "Conga Pelt",
          rarity: 3,
          icon: { kind: "pelt", color: "white" },
        },
        quantity: 2,
      }],
    }]);

    expect(result.materials[0]).toMatchObject({
      item: {
        id: 7,
        gameId: 407,
        icon: { kind: "pelt", color: "white" },
      },
    });
  });
});
