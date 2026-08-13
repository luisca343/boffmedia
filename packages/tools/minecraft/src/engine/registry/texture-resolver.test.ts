import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { resolveBlockTexture, type JarIndex } from "./texture-resolver";

/** 1×1 PNG, enough to prove the right file was found. */
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function jarWith(files: Record<string, string>): Promise<{ zip: JSZip; index: JarIndex }> {
  const zip = new JSZip();
  const index: JarIndex = new Map();
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith(".png")) zip.file(path, PNG_B64, { base64: true });
    else zip.file(path, content);
    index.set(path.toLowerCase(), path);
  }
  return { zip, index };
}

describe("mod JAR texture resolution", () => {
  it("finds a texture whose file casing differs from the model's ref", async () => {
    // Forge lowercases resource paths at build time while the JSON keeps its
    // original casing — Mekanism asks for `blocks/OsmiumOre` and ships
    // `blocks/osmiumore.png`. Exact lookup alone leaves the block untextured.
    const { zip, index } = await jarWith({
      "assets/mekanism/models/block/basic_cube.json": JSON.stringify({ parent: "block/cube_all" }),
      "assets/mekanism/textures/blocks/osmiumore.png": "",
    });
    const blockstate = {
      forge_marker: 1,
      defaults: { model: "mekanism:basic_cube" },
      variants: { type: { osmium: { textures: { all: "mekanism:blocks/OsmiumOre" } } } },
    };

    const exact = await resolveBlockTexture(zip, blockstate, new Map(), "1.12.2");
    expect(exact).toBeUndefined();

    const indexed = await resolveBlockTexture(zip, blockstate, new Map(), "1.12.2", index);
    expect(indexed?.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("falls back to the CDN when a mod model points at a vanilla texture", async () => {
    // A modded wall of a vanilla material: the PNG is in the client jar, which
    // is not something we can read from here.
    const { zip, index } = await jarWith({
      "assets/quark/models/block/stonebrick_wall_post.json": JSON.stringify({
        parent: "minecraft:block/wall_post",
        textures: { wall: "minecraft:blocks/stonebrick" },
      }),
    });
    const blockstate = {
      multipart: [{ apply: { model: "quark:stonebrick_wall_post" } }],
    };

    const url = await resolveBlockTexture(zip, blockstate, new Map(), "1.12.2", index);
    expect(url).toBe(
      "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.12.2" +
        "/assets/minecraft/textures/blocks/stonebrick.png",
    );
  });

  it("extracts a texture that really is in the JAR", async () => {
    const { zip, index } = await jarWith({
      "assets/quark/textures/blocks/stone_slate.png": "",
    });
    const blockstate = {
      forge_marker: 1,
      defaults: { model: "minecraft:cube_all" },
      variants: { "variant=stone_slate": [{ textures: { all: "quark:blocks/stone_slate" } }] },
    };

    const url = await resolveBlockTexture(zip, blockstate, new Map(), "1.12.2", index);
    expect(url?.startsWith("data:image/png;base64,")).toBe(true);
  });
});
