import { describe, expect, it } from "vitest";
import { schematicAccept, schematicExtensions, schematicHint } from "./file-formats";
import { adapterForFile } from "./adapters";

describe("schematicExtensions", () => {
  it("lists every extension an adapter claims", () => {
    const exts = schematicExtensions();
    expect(exts).toContain(".schem");
    expect(exts).toContain(".litematic");
    expect(exts).toContain(".nbt");
    expect(exts).toContain(".mca");
    expect(exts).toContain(".prefab.json");
  });

  it("de-duplicates", () => {
    const exts = schematicExtensions();
    expect(new Set(exts).size).toBe(exts.length);
  });

  // The list is only useful if it agrees with the dispatcher it advertises.
  it("only offers extensions a registered loader dispatches on", () => {
    for (const ext of schematicExtensions()) {
      expect(adapterForFile(`build${ext}`).canParse(`build${ext}`)).toBe(true);
    }
  });

  it("excludes a format no adapter claims", () => {
    expect(schematicExtensions()).not.toContain(".zip");
  });
});

describe("schematicAccept", () => {
  it("is a comma-separated input accept list", () => {
    const accept = schematicAccept();
    expect(accept.split(",")).toEqual(schematicExtensions());
  });
});

describe("schematicHint", () => {
  it("folds away the aliases that would read as separate formats", () => {
    const hint = schematicHint();
    expect(hint).not.toContain(".schematic");
    expect(hint).not.toContain(".prefab.json");
    expect(hint).toContain(".schem");
    expect(hint).toContain(".prefab");
  });
});
