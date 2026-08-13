import { describe, expect, it } from "vitest";
import { namespacesFromEntryNames, rewriteCompiledTextures } from "./modded-models";
import type { CompiledModel } from "../model/types";

describe("namespacesFromEntryNames", () => {
  it("derives namespaces from blockstate entries, ignoring everything else", () => {
    expect(
      namespacesFromEntryNames([
        "assets/mekanism/blockstates/osmium_ore.json",
        "assets/mekanism/blockstates/other.json",
        "assets/mekanism/models/block/osmium_ore.json",
        "assets/twilightforest/blockstates/nagastone.json",
        "META-INF/mods.toml",
        "data/mekanism/tags/blocks/ores.json",
      ]).sort(),
    ).toEqual(["mekanism", "twilightforest"]);
  });

  it("lowercases namespaces and skips minecraft overrides", () => {
    // A mod that re-declares a vanilla blockstate must not capture every vanilla
    // block in the schematic — those resolve far better through the CDN tree.
    expect(
      namespacesFromEntryNames([
        "assets/minecraft/blockstates/stone.json",
        "assets/DawnOfTimeBuilder/blockstates/roof.json",
      ]),
    ).toEqual(["dawnoftimebuilder"]);
  });

  it("returns nothing for a jar with no block assets", () => {
    expect(namespacesFromEntryNames(["assets/foo/lang/en_us.json"])).toEqual([]);
  });
});

function model(refs: (string | null)[]): CompiledModel {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
    groups: refs.map((textureRef, i) => ({
      textureRef,
      tint: null,
      doubleSided: false,
      start: i,
      count: 1,
    })),
    empty: false,
  };
}

describe("rewriteCompiledTextures", () => {
  it("replaces each group's ref with the resolved src", async () => {
    const out = await rewriteCompiledTextures(model(["mod:block/a", "mod:block/b"]), async (ref) =>
      `src(${ref})`,
    );
    expect(out.groups.map((g) => g.textureRef)).toEqual([
      "src(mod:block/a)",
      "src(mod:block/b)",
    ]);
  });

  it("keeps a null ref where the texture does not resolve, without dropping geometry", async () => {
    const source = model([null, "mod:block/missing"]);
    const out = await rewriteCompiledTextures(source, async () => null);
    expect(out.groups.map((g) => g.textureRef)).toEqual([null, null]);
    expect(out.groups).toHaveLength(2);
    expect(out.groups[1].count).toBe(1);
  });

  it("does not mutate the compiled model it was given", async () => {
    const source = model(["mod:block/a"]);
    await rewriteCompiledTextures(source, async () => "data:image/png;base64,AA");
    expect(source.groups[0].textureRef).toBe("mod:block/a");
  });
});
