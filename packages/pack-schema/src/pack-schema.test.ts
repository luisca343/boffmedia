import { describe, expect, it } from "vitest"
import type { z } from "zod"

import { PackManifest, gameTypeOf, loaderOf } from "./index.js"

const sha512 = "a".repeat(128)

// Typed as the schema's *input* so tests can mutate fields to invalid values
// without TS narrowing the fixture to one exact shape.
const manifest = (): z.input<typeof PackManifest> => ({
  formatVersion: 1 as const,
  pack: {
    id: "pk_1",
    slug: "boff-smp",
    name: "Boff SMP",
    access: { kind: "allowlist" as const, uuids: ["069a79f4-44e9-4726-a5be-fca90e38aaf5"] },
  },
  version: {
    id: "v_1",
    name: "1.4.2",
    createdAt: "2026-07-30T12:00:00Z",
    dependencies: { minecraft: "1.21.4", "fabric-loader": "0.16.9" },
    files: [
      {
        path: "mods/sodium.jar",
        sha512,
        fileSize: 1234,
        source: { kind: "modrinth" as const, projectId: "AANobbMI", versionId: "xyz" },
      },
    ],
  },
})

const emulatorManifest = (): z.input<typeof PackManifest> => {
  const m = manifest()
  m.pack.gameType = "emulator"
  delete m.version.dependencies
  m.version.files = [
    {
      path: "roms/game.gba",
      sha512,
      fileSize: 4321,
      source: { kind: "user-provided" as const, hint: "Pokémon Emerald (USA) dump (.gba)" },
    },
  ]
  m.version.emulator = { kind: "mgba" as const, rom: "roms/game.gba" }
  return m
}

describe("PackManifest", () => {
  it("accepts a well-formed manifest and defaults env to required on both sides", () => {
    const parsed = PackManifest.parse(manifest())
    expect(parsed.version.files[0].env).toEqual({ client: "required", server: "required" })
  })

  it("rejects a path that escapes the instance directory", () => {
    const m = manifest()
    m.version.files[0].path = "../../../etc/passwd"
    expect(() => PackManifest.parse(m)).toThrow(/traverse/)
  })

  it("rejects an absolute path, including a Windows drive path", () => {
    for (const bad of ["/etc/passwd", "C:\\Windows\\System32\\evil.dll"]) {
      const m = manifest()
      m.version.files[0].path = bad
      expect(() => PackManifest.parse(m)).toThrow(/relative to the instance/)
    }
  })

  it("rejects two files whose paths collide only by case", () => {
    // Windows and macOS would silently overwrite; Linux would install both.
    const m = manifest()
    m.version.files.push({ ...m.version.files[0], path: "mods/Sodium.jar" })
    expect(() => PackManifest.parse(m)).toThrow(/duplicate target path/)
  })

  it("rejects a truncated sha512", () => {
    const m = manifest()
    m.version.files[0].sha512 = "abc"
    expect(() => PackManifest.parse(m)).toThrow(/128 lowercase hex/)
  })

  it("rejects an unknown file source kind", () => {
    const m = manifest()
    // @ts-expect-error deliberately invalid discriminator
    m.version.files[0].source = { kind: "ftp", url: "ftp://example.com/a.jar" }
    expect(() => PackManifest.parse(m)).toThrow()
  })

  it("rejects two bundled worlds whose folders collide only by case", () => {
    const m = manifest()
    const world = {
      folder: "world",
      sha512,
      sizeBytes: 10,
      source: { kind: "override" as const, blobSha512: "b".repeat(128) },
    }
    m.version.worlds = [world, { ...world, folder: "World" }]
    expect(() => PackManifest.parse(m)).toThrow(/duplicate world folder/)
  })

  it("rejects a bundled world folder that is a path segment", () => {
    const m = manifest()
    m.version.worlds = [
      {
        folder: "../evil",
        sha512,
        sizeBytes: 10,
        source: { kind: "override" as const, blobSha512: "b".repeat(128) },
      },
    ]
    expect(() => PackManifest.parse(m)).toThrow(/single path segment/)
  })

  it("accepts a vanilla pack with no loader", () => {
    const m = manifest()
    m.version.dependencies = { minecraft: "1.21.4" }
    expect(loaderOf(PackManifest.parse(m).version.dependencies!)).toBeNull()
  })

  it("treats a manifest without gameType as minecraft and requires dependencies", () => {
    const m = manifest()
    expect(gameTypeOf(PackManifest.parse(m).pack)).toBe("minecraft")
    delete m.version.dependencies
    expect(() => PackManifest.parse(m)).toThrow(/must declare dependencies/)
  })

  it("rejects an emulator block on a minecraft pack", () => {
    const m = manifest()
    m.version.emulator = { kind: "mgba", rom: "roms/game.gba" }
    expect(() => PackManifest.parse(m)).toThrow(/must not declare an emulator block/)
  })

  it("accepts a well-formed emulator manifest with a user-provided ROM", () => {
    const m = emulatorManifest()
    const parsed = PackManifest.parse(m)
    expect(gameTypeOf(parsed.pack)).toBe("emulator")
    expect(parsed.version.emulator?.kind).toBe("mgba")
  })

  it("rejects an emulator pack whose rom is not a files[] entry", () => {
    const m = emulatorManifest()
    m.version.emulator!.rom = "roms/other.gba"
    expect(() => PackManifest.parse(m)).toThrow(/emulator.rom must match/)
  })

  it("rejects minecraft dependencies, missing emulator block, and worlds on an emulator pack", () => {
    const deps = emulatorManifest()
    deps.version.dependencies = { minecraft: "1.21.4" }
    expect(() => PackManifest.parse(deps)).toThrow(/must not declare minecraft dependencies/)

    const noEmu = emulatorManifest()
    delete noEmu.version.emulator
    expect(() => PackManifest.parse(noEmu)).toThrow(/must declare an emulator block/)

    const worlds = emulatorManifest()
    worlds.version.worlds = [
      { folder: "w", sha512, sizeBytes: 1, source: { kind: "override" as const, blobSha512: "b".repeat(128) } },
    ]
    expect(() => PackManifest.parse(worlds)).toThrow(/minecraft-only/)
  })
})

describe("loaderOf", () => {
  it("picks the single declared loader", () => {
    expect(loaderOf({ minecraft: "1.21.4", neoforge: "21.4.30" })).toEqual({
      loader: "neoforge",
      version: "21.4.30",
    })
  })
})
