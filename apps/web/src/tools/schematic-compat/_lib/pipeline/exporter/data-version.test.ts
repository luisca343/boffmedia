import { describe, expect, it } from "vitest";
import { gunzipSync } from "node:zlib";
import { writeSchem } from "./schem-writer";
import { writeLitematic } from "./litematic-writer";
import { writeNbtStruct } from "./nbt-writer";
import { parseNBT, asNumber, asCompound } from "@/lib/schematic/parsers/nbt";
import { parseBlockState } from "@/lib/schematic/normalizer";
import type { SchematicStructure } from "@/lib/schematic/types";

/** 2×1×1: one stone, one air. */
function structure(metadata: Record<string, unknown> = {}): SchematicStructure {
  return {
    format: "schem",
    formatVersion: 2,
    dimensions: { x: 2, y: 1, z: 1 },
    palette: [parseBlockState("minecraft:stone"), parseBlockState("minecraft:air")],
    blockData: Int32Array.of(0, 1),
    tileEntities: [],
    entities: [],
    metadata,
  };
}

const TARGET_DV = 3955; // 1.21.1
const SOURCE_DV = 2586; // 1.16.5

describe("export DataVersion", () => {
  it("writes the stamped DataVersion into a .schem v2", () => {
    const root = parseNBT(writeSchem(structure({ dataVersion: TARGET_DV }), 2));
    expect(asNumber(root.DataVersion, "DataVersion")).toBe(TARGET_DV);
  });

  it("writes the stamped DataVersion into a .schem v3", () => {
    const root = parseNBT(writeSchem(structure({ dataVersion: TARGET_DV }), 3));
    const schematic = asCompound(root.Schematic, "Schematic");
    expect(asNumber(schematic.DataVersion, "DataVersion")).toBe(TARGET_DV);
  });

  it("writes the stamped DataVersion into a .litematic", () => {
    const root = parseNBT(writeLitematic(structure({ dataVersion: TARGET_DV })));
    expect(asNumber(root.MinecraftDataVersion, "MinecraftDataVersion")).toBe(TARGET_DV);
  });

  it("writes the stamped DataVersion into a .nbt structure", () => {
    const root = parseNBT(writeNbtStruct(structure({ dataVersion: TARGET_DV })));
    expect(asNumber(root.DataVersion, "DataVersion")).toBe(TARGET_DV);
  });

  it("keeps the target's version when the source file carried an older one", () => {
    // The worker overwrites metadata.dataVersion with the TARGET registry's
    // before serialising; this is the regression that made a 1.16→1.21 export
    // declare 1.16 and trip the game's data fixers.
    const converted = { ...structure({ dataVersion: SOURCE_DV }), metadata: { dataVersion: TARGET_DV } };
    const root = parseNBT(writeSchem(converted, 2));
    expect(asNumber(root.DataVersion, "DataVersion")).toBe(TARGET_DV);
  });

  it("falls back to a modern default when no version is known", () => {
    const root = parseNBT(writeSchem(structure(), 2));
    expect(asNumber(root.DataVersion, "DataVersion")).toBeGreaterThan(0);
  });
});

/** Root-compound NAME of a gzip NBT buffer (byte 0 = tag id, then u16 length). */
function rootNameOf(bytes: Uint8Array): string {
  const raw = new Uint8Array(gunzipSync(bytes));
  const len = (raw[1] << 8) | raw[2];
  return new TextDecoder().decode(raw.subarray(3, 3 + len));
}

describe(".schem root compound naming", () => {
  // WorldEdit's format detection keys on these: v2 = root NAMED "Schematic",
  // v3 = unnamed root wrapping a "Schematic" child. An unnamed v2 root makes
  // WorldEdit fall through to the v3 reader, which dies on the missing child —
  // that regression shipped and broke every exported v2 file in-game.
  it("names the v2 root compound Schematic", () => {
    expect(rootNameOf(writeSchem(structure(), 2))).toBe("Schematic");
  });

  it("leaves the v3 root unnamed, wrapping the Schematic child", () => {
    expect(rootNameOf(writeSchem(structure(), 3))).toBe("");
    const root = parseNBT(writeSchem(structure(), 3));
    expect(root.Schematic).toBeDefined();
  });
});
