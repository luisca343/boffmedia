import { describe, expect, it } from "vitest";

import type { ArmorPiece, Weapon } from "../types";
import {
  buildLocalWeaponTree,
  flattenLocalCharmRanks,
  joinLocalArmorSetIdentities,
  mhwildsCatalogLocale,
  mhwildsCatalogPath,
} from "./local-data";

function weapon(
  id: number,
  previous?: number,
  branches: number[] = [],
  kind = "great-sword",
): Weapon {
  return {
    id,
    gameId: id,
    kind,
    name: `Weapon ${id}`,
    rarity: 1,
    damage: { raw: 100, display: 100 },
    affinity: 0,
    slots: [],
    crafting: {
      craftable: true,
      previous: previous == null ? null : { id: previous },
      branches: branches.map((branchId) => ({ id: branchId })),
      craftingMaterials: [],
      craftingZennyCost: 100,
      upgradeMaterials: [],
      upgradeZennyCost: 200,
    },
  };
}

describe("local MH Wilds catalog data", () => {
  it("normalizes catalog locales and paths", () => {
    expect(mhwildsCatalogLocale("es-MX")).toBe("es");
    expect(mhwildsCatalogLocale("en-US")).toBe("en");
    expect(mhwildsCatalogPath("es", "weapons.json")).toBe("es/weapons.json");
  });

  it("flattens grouped charm ranks while preserving group identity", () => {
    const charms = flattenLocalCharmRanks([
      {
        id: 7,
        gameId: -700,
        ranks: [
          {
            id: 71,
            name: "Test Charm I",
            charm: { id: 1 },
            level: 1,
          },
        ],
      },
    ]);

    expect(charms).toEqual([
      expect.objectContaining({
        id: 71,
        name: "Test Charm I",
        charm: { id: 7, gameId: -700 },
      }),
    ]);
  });

  it("joins armor pieces to stable extracted set ids", () => {
    const armor = [
      {
        id: 1,
        name: "Test Helm",
        kind: "head",
        rank: "high",
        rarity: 1,
        defense: { base: 1 },
        resistances: { fire: 0, water: 0, thunder: 0, ice: 0, dragon: 0 },
        slots: [],
        skills: [],
        armorSet: { id: 12, name: "Test Set" },
      },
    ] as ArmorPiece[];

    expect(joinLocalArmorSetIdentities(armor, [{ id: 12, gameId: -120 }])[0]).toEqual(
      expect.objectContaining({ armorSet: { id: 12, gameId: -120, name: "Test Set" } }),
    );
  });

  it("derives roots, branches, stable paths, and grouped trees from weapons", () => {
    const tree = buildLocalWeaponTree([
      weapon(1, undefined, [2, 4]),
      weapon(2, 1, [3]),
      weapon(3, 2),
      weapon(4, 1),
      weapon(1, undefined, [2], "bow"),
      weapon(2, 1, [], "bow"),
    ]);

    expect(tree.totalWeapons).toBe(6);
    expect(tree.weaponKinds).toEqual(["great-sword", "bow"]);
    expect(tree.tree).toHaveLength(2);
    expect(tree.tree[0]).toMatchObject({ id: 1, pathKey: "1", assetKey: "great-sword:1" });
    expect(tree.tree[0].children.map((child) => child.id)).toEqual([2, 4]);
    expect(tree.tree[0].children[0]).toMatchObject({ id: 2, pathKey: "1/2" });
    expect(tree.tree[0].children[0].children[0]).toMatchObject({
      id: 3,
      pathKey: "1/2/3",
    });
    expect(tree.treeByKind["great-sword"]).toHaveLength(1);
    expect(tree.treeByKind.bow[0].children[0]).toMatchObject({
      id: 2,
      pathKey: "1/2",
    });
  });

  it("keeps standalone game weapons as roots when the game has no series link", () => {
    const tree = buildLocalWeaponTree([
      { ...weapon(70, undefined, [], "hunting-horn"), series: null },
      { ...weapon(71, undefined, [], "hunting-horn"), series: null },
      { ...weapon(86, undefined, [], "hunting-horn"), series: null },
    ]);

    expect(tree.treeByKind["hunting-horn"]).toHaveLength(3);
    expect(tree.treeByKind["hunting-horn"].map((root) => root.id)).toEqual([
      70,
      71,
      86,
    ]);
    expect(
      tree.treeByKind["hunting-horn"].every(
        (root) => root.children.length === 0,
      ),
    ).toBe(true);
  });
});
