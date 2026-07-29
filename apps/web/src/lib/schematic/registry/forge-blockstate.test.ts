import { describe, expect, it } from "vitest";
import { forgeRepresentative, forgeStateValues, isForgeBlockstate } from "./forge-blockstate";
import { parseBlockstateJson } from "./blockstate-parser";

// Shapes taken from real 1.12.2 mod JARs (BetterRecords, EnderIO, BiomesOPlenty).
const FORGE_V1 = {
  forge_marker: 1,
  defaults: {
    model: "betterrecords:dummy",
    textures: { particle: "betterrecords:blocks/breaktexture" },
  },
  variants: {
    normal: [{}],
    inventory: [{}],
    facing: {
      north: { y: 0 },
      south: { y: 180 },
    },
  },
};

const VANILLA = {
  variants: {
    "facing=north,half=top": { model: "minecraft:block/oak_stairs" },
    "facing=south,half=bottom": { model: "minecraft:block/oak_stairs" },
  },
};

// Quark: a combination key whose value is a LIST of entries.
const FORGE_V1_COMBINATION_KEY = {
  forge_marker: 1,
  defaults: { model: "minecraft:cube_all", transform: "forge:default-block" },
  variants: {
    "variant=stone_slate": [{ textures: { all: "quark:blocks/stone_slate" } }],
    "variant=stone_slate_smooth": [{ textures: { all: "quark:blocks/stone_slate_smooth" } }],
  },
};

// Mekanism: a property-name key whose values map each state value to an entry.
const FORGE_V1_PROPERTY_MAP = {
  forge_marker: 1,
  defaults: { model: "mekanism:basic_cube" },
  variants: {
    type: {
      osmium: { textures: { all: "mekanism:blocks/OsmiumOre" } },
      copper: { textures: { all: "mekanism:blocks/CopperOre" } },
    },
    inventory: [{}],
  },
};

describe("forge blockstate v1", () => {
  it("recognises the marker and leaves vanilla files alone", () => {
    expect(isForgeBlockstate(FORGE_V1)).toBe(true);
    expect(isForgeBlockstate(VANILLA)).toBe(false);
  });

  it("reads properties from variant KEYS, skipping the render cases", () => {
    const states = forgeStateValues(FORGE_V1);
    expect([...states.keys()]).toEqual(["facing"]);
    expect(states.get("facing")).toEqual(["north", "south"]);
  });

  it("falls back to `defaults` for the model and textures", () => {
    const rep = forgeRepresentative(FORGE_V1);
    expect(rep.model).toBe("betterrecords:dummy");
    expect(rep.textures).toEqual({ particle: "betterrecords:blocks/breaktexture" });
  });

  it("lets a variant override the defaults", () => {
    const rep = forgeRepresentative({
      forge_marker: 1,
      defaults: { model: "base", textures: { all: "ns:blocks/base" } },
      variants: { normal: [{ model: "special", textures: { all: "ns:blocks/special" } }] },
    });
    expect(rep.model).toBe("special");
    expect(rep.textures).toEqual({ all: "ns:blocks/special" });
  });

  it("feeds the block definition, which vanilla parsing would leave empty", () => {
    const def = parseBlockstateJson("betterrecords:laser", FORGE_V1);
    expect(def.validStates).toEqual({ facing: ["north", "south"] });
    expect(def.defaultState).toEqual({ facing: "north" });
  });

  it("reads a combination key whose value is a list of entries", () => {
    // Regression: these render as untextured placeholders when the list form is
    // not walked — it is how Quark declares every one of its stone variants.
    const rep = forgeRepresentative(FORGE_V1_COMBINATION_KEY);
    expect(rep.textures).toEqual({ all: "quark:blocks/stone_slate" });
    expect(forgeStateValues(FORGE_V1_COMBINATION_KEY).get("variant")).toEqual([
      "stone_slate",
      "stone_slate_smooth",
    ]);
  });

  it("reads a property-name key whose values map to entries", () => {
    const rep = forgeRepresentative(FORGE_V1_PROPERTY_MAP);
    expect(rep.model).toBe("mekanism:basic_cube");
    expect(rep.textures).toEqual({ all: "mekanism:blocks/OsmiumOre" });
    expect(forgeStateValues(FORGE_V1_PROPERTY_MAP).get("type")).toEqual(["osmium", "copper"]);
  });

  it("still parses vanilla combination keys", () => {
    const def = parseBlockstateJson("minecraft:oak_stairs", VANILLA);
    expect(def.validStates.facing).toEqual(["north", "south"]);
    expect(def.validStates.half).toEqual(["top", "bottom"]);
  });
});
