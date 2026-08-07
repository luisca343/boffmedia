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
    const deps = PackManifest.parse(m).version.dependencies
    expect(deps).toBeDefined()
    expect(loaderOf(deps!)).toBeNull()
  })
})

describe("gameType", () => {
  it("defaults to minecraft when absent and parses byte-identically to a legacy manifest", () => {
    const parsed = PackManifest.parse(manifest())
    // A pre-multi-game manifest carries no gameType; the field stays absent and
    // nothing else in the shape changes.
    expect(parsed.pack.gameType).toBeUndefined()
    expect(gameTypeOf(parsed.pack)).toBe("minecraft")
  })

  it("requires dependencies for a minecraft pack", () => {
    const m = manifest()
    delete m.version.dependencies
    expect(() => PackManifest.parse(m)).toThrow(/require a `dependencies` block/)
  })

  it("forbids a minecraft pack from carrying a non-mc spec block", () => {
    const m = manifest()
    m.version.emulator = { kind: "mgba", rom: "roms/x.gba" }
    expect(() => PackManifest.parse(m)).toThrow(/only allowed when gameType is/)
  })

  it("accepts a non-mc pack: its own spec block, no dependencies, no worlds", () => {
    const m = manifest()
    m.pack.gameType = "emulator"
    delete m.version.dependencies
    m.version.emulator = { kind: "mgba", rom: "roms/x.gba" }
    m.version.files[0] = {
      path: "roms/x.gba",
      sha512,
      fileSize: 100,
      env: { client: "required", server: "unsupported" },
      source: { kind: "user-provided", hint: "Pokémon Esmeralda (EUR) — tu propio volcado .gba" },
    }
    const parsed = PackManifest.parse(m)
    expect(gameTypeOf(parsed.pack)).toBe("emulator")
    expect(parsed.version.dependencies).toBeUndefined()
  })

  it("rejects a non-mc pack that declares dependencies", () => {
    const m = manifest()
    m.pack.gameType = "emulator"
    m.version.emulator = { kind: "mgba", rom: "roms/x.gba" }
    expect(() => PackManifest.parse(m)).toThrow(/`dependencies` is minecraft-only/)
  })

  it("rejects a non-mc pack that declares worlds", () => {
    const m = manifest()
    m.pack.gameType = "emulator"
    delete m.version.dependencies
    m.version.emulator = { kind: "mgba", rom: "roms/x.gba" }
    m.version.worlds = [
      { folder: "world", sha512, sizeBytes: 10, source: { kind: "override", blobSha512: "b".repeat(128) } },
    ]
    expect(() => PackManifest.parse(m)).toThrow(/`worlds` is minecraft-only/)
  })

  it("rejects a non-mc pack missing its own spec block", () => {
    const m = manifest()
    m.pack.gameType = "emulator"
    delete m.version.dependencies
    expect(() => PackManifest.parse(m)).toThrow(/requires its `emulator` spec block/)
  })

  it("rejects an unknown gameType value", () => {
    const m = manifest()
    // @ts-expect-error deliberately invalid enum value
    m.pack.gameType = "playstation"
    expect(() => PackManifest.parse(m)).toThrow()
  })
})

describe("user-provided source", () => {
  it("accepts a user-provided file with a hint", () => {
    const m = manifest()
    m.version.files[0].source = { kind: "user-provided", hint: "your own dump" }
    expect(PackManifest.parse(m).version.files[0].source).toEqual({
      kind: "user-provided",
      hint: "your own dump",
    })
  })

  it("rejects a user-provided file with an empty hint", () => {
    const m = manifest()
    m.version.files[0].source = { kind: "user-provided", hint: "" }
    expect(() => PackManifest.parse(m)).toThrow()
  })
})

describe("emulator packs", () => {
  const rom = (over = {}) => ({
    path: "roms/emerald.gba",
    sha512,
    fileSize: 100,
    env: { client: "required" as const, server: "unsupported" as const },
    source: { kind: "user-provided" as const, hint: "Pokémon Esmeralda (EUR) — tu volcado .gba" },
    ...over,
  })
  const emu = (): z.input<typeof PackManifest> => {
    const m = manifest()
    m.pack.gameType = "emulator"
    delete m.version.dependencies
    m.version.emulator = { kind: "mgba", rom: "roms/emerald.gba" }
    m.version.files = [rom()]
    return m
  }

  it("accepts a well-formed mgba pack with a user-provided ROM", () => {
    const parsed = PackManifest.parse(emu())
    expect(parsed.version.emulator).toEqual({ kind: "mgba", rom: "roms/emerald.gba" })
  })

  it("rejects an unknown emulator kind", () => {
    const m = emu()
    // @ts-expect-error invalid kind
    m.version.emulator = { kind: "snes9x", rom: "roms/emerald.gba" }
    expect(() => PackManifest.parse(m)).toThrow()
  })

  it("rejects a rom that does not match any files[] entry", () => {
    const m = emu()
    m.version.emulator = { kind: "mgba", rom: "roms/missing.gba" }
    expect(() => PackManifest.parse(m)).toThrow(/must match a files\[\] entry/)
  })

  it("rejects a ROM entry with the wrong env", () => {
    const m = emu()
    m.version.files = [rom({ env: { client: "required", server: "required" } })]
    expect(() => PackManifest.parse(m)).toThrow(/must have env.client/)
  })

  it("rejects a blob-hosted ROM (the server never hosts ROM bytes)", () => {
    const m = emu()
    m.version.files = [rom({ source: { kind: "override", blobSha512: "a".repeat(128) } })]
    expect(() => PackManifest.parse(m)).toThrow(/user-provided or patched/)
  })

  it("accepts a patched (romhack) ROM referencing a user-provided base and a blob patch", () => {
    const m = emu()
    m.version.emulator = { kind: "mgba", rom: "roms/hack.gba" }
    m.version.files = [
      rom(), // the clean base (user-provided)
      {
        path: "roms/patch.bps",
        sha512,
        fileSize: 5,
        env: { client: "required", server: "unsupported" },
        source: { kind: "override", blobSha512: "b".repeat(128) },
      },
      {
        path: "roms/hack.gba",
        sha512: "c".repeat(128),
        fileSize: 100,
        env: { client: "required", server: "unsupported" },
        source: { kind: "patched", base: "roms/emerald.gba", patch: "roms/patch.bps", format: "bps" },
      },
    ]
    expect(() => PackManifest.parse(m)).not.toThrow()
  })

  it("rejects a patched ROM whose base is not user-provided", () => {
    const m = emu()
    m.version.emulator = { kind: "mgba", rom: "roms/hack.gba" }
    m.version.files = [
      {
        path: "roms/emerald.gba",
        sha512,
        fileSize: 100,
        env: { client: "required", server: "unsupported" },
        source: { kind: "override", blobSha512: "a".repeat(128) },
      },
      {
        path: "roms/patch.bps",
        sha512,
        fileSize: 5,
        env: { client: "required", server: "unsupported" },
        source: { kind: "override", blobSha512: "b".repeat(128) },
      },
      {
        path: "roms/hack.gba",
        sha512: "c".repeat(128),
        fileSize: 100,
        env: { client: "required", server: "unsupported" },
        source: { kind: "patched", base: "roms/emerald.gba", patch: "roms/patch.bps", format: "bps" },
      },
    ]
    expect(() => PackManifest.parse(m)).toThrow(/patched.base must reference a user-provided file/)
  })

  it("rejects a patched ROM whose patch is user-provided rather than distributable", () => {
    const m = emu()
    m.version.emulator = { kind: "mgba", rom: "roms/hack.gba" }
    m.version.files = [
      rom(),
      {
        path: "roms/patch.bps",
        sha512,
        fileSize: 5,
        env: { client: "required", server: "unsupported" },
        source: { kind: "user-provided", hint: "your patch" },
      },
      {
        path: "roms/hack.gba",
        sha512: "c".repeat(128),
        fileSize: 100,
        env: { client: "required", server: "unsupported" },
        source: { kind: "patched", base: "roms/emerald.gba", patch: "roms/patch.bps", format: "bps" },
      },
    ]
    expect(() => PackManifest.parse(m)).toThrow(/patched.patch must reference an override or url file/)
  })
})

describe("initialFiles", () => {
  const initial = (over = {}) => ({
    path: "roms/emerald.sav",
    sha512,
    fileSize: 10,
    source: { kind: "override" as const, blobSha512: "b".repeat(128) },
    ...over,
  })

  it("accepts an override-sourced initial file", () => {
    const m = manifest()
    m.version.initialFiles = [initial()]
    expect(PackManifest.parse(m).version.initialFiles).toHaveLength(1)
  })

  it("rejects a user-provided initial file", () => {
    const m = manifest()
    m.version.initialFiles = [initial({ source: { kind: "user-provided", hint: "x" } })]
    expect(() => PackManifest.parse(m)).toThrow(/initialFiles source must be/)
  })

  it("rejects an initial file whose path collides with files[]", () => {
    const m = manifest()
    m.version.initialFiles = [initial({ path: m.version.files[0].path })]
    expect(() => PackManifest.parse(m)).toThrow(/collides with a files\[\] entry/)
  })

  it("rejects two initial files whose paths collide by case", () => {
    const m = manifest()
    m.version.initialFiles = [initial(), initial({ path: "roms/Emerald.SAV" })]
    expect(() => PackManifest.parse(m)).toThrow(/duplicate initialFiles path/)
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
