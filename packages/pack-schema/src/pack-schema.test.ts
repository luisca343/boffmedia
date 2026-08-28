import { describe, expect, it } from "vitest"
import type { z } from "zod"

import {
  PackManifest,
  SYNTHETIC_GROUP_ID,
  gameTypeOf,
  loaderOf,
  optionalModelOf,
  optionalWarnings,
  judgeJvmArg,
  sanitizeJvmArgs,
  selectOf,
} from "./index.js"

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

// Every case here has a twin in apps/desktop/src-tauri/src/pack.rs's test module.
// The two rule sets are written twice — JSON Schema drops refinements, so the
// Rust side re-implements them by hand — and these fixtures are what keeps the
// pair honest. Adding a rule means adding a test on BOTH sides.
describe("optional content", () => {
  const optionalFile = (path: string): z.input<typeof PackManifest>["version"]["files"][number] => ({
    path,
    sha512,
    fileSize: 10,
    env: { client: "optional", server: "unsupported" },
    source: { kind: "url" as const, url: "https://example.com/f" },
  })

  // A pack with three optional files, one authored group holding one feature.
  const withOptional = (): z.input<typeof PackManifest> => {
    const m = manifest()
    m.version.files.push(optionalFile("mods/iris.jar"))
    m.version.files.push(optionalFile("shaderpacks/bsl.zip"))
    m.version.files.push(optionalFile("mods/extra.jar"))
    m.version.optionalGroups = [
      {
        id: "rendimiento",
        name: "Rendimiento",
        select: "any" as const,
        features: [{ id: "iris", name: "Iris", paths: ["mods/iris.jar"], default: true }],
      },
    ]
    return m
  }

  it("accepts a well-formed group and defaults `select` to any through selectOf", () => {
    const m = withOptional()
    delete m.version.optionalGroups![0].select
    const parsed = PackManifest.parse(m)
    expect(selectOf(parsed.version.optionalGroups![0])).toBe("any")
  })

  // ---- rule 1 ----
  it("rejects a feature path that is not a files[] entry", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].paths = ["mods/ghost.jar"]
    expect(() => PackManifest.parse(m)).toThrow(/must match a files\[\] entry/)
  })

  // ---- rule 2 ----
  // The .mrpack view has to agree with ours: Prism and packwiz read env.client
  // and nothing else, so a switchable file marked "required" installs
  // differently depending on which launcher opened the pack.
  it("rejects a feature path whose file is not env.client optional", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].paths = ["mods/sodium.jar"]
    expect(() => PackManifest.parse(m)).toThrow(/must be env\.client "optional"/)
  })

  // ---- rule 3 ----
  it("rejects duplicate group ids", () => {
    const m = withOptional()
    m.version.optionalGroups!.push({
      ...m.version.optionalGroups![0],
      features: [{ id: "otra", name: "Otra", paths: ["mods/extra.jar"], default: false }],
    })
    expect(() => PackManifest.parse(m)).toThrow(/duplicate group id/)
  })

  it("rejects a feature id reused across two groups", () => {
    const m = withOptional()
    m.version.optionalGroups!.push({
      id: "visual",
      name: "Visual",
      features: [{ id: "iris", name: "Iris otra vez", paths: ["mods/extra.jar"], default: false }],
    })
    expect(() => PackManifest.parse(m)).toThrow(/duplicate feature id/)
  })

  it("reserves the synthesised group id", () => {
    const m = withOptional()
    m.version.optionalGroups![0].id = SYNTHETIC_GROUP_ID
    expect(() => PackManifest.parse(m)).toThrow(/reserved/)
  })

  // ---- rule 4 ----
  it("rejects one path owned by two features", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features.push({
      id: "iris-bis",
      name: "Iris bis",
      paths: ["mods/iris.jar"],
      default: false,
    })
    expect(() => PackManifest.parse(m)).toThrow(/already owned by feature/)
  })

  // ---- rule 5 ----
  it("rejects requires pointing at a feature that does not exist", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].requires = ["nope"]
    expect(() => PackManifest.parse(m)).toThrow(/must name an existing feature id/)
  })

  it("accepts requires pointing at a feature declared later in the document", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].requires = ["extra"]
    m.version.optionalGroups!.push({
      id: "extras",
      name: "Extras",
      features: [{ id: "extra", name: "Extra", paths: ["mods/extra.jar"], default: false }],
    })
    expect(() => PackManifest.parse(m)).not.toThrow()
  })

  it("rejects requires targeting a member of a radio group", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].requires = ["bsl"]
    m.version.optionalGroups!.push({
      id: "shaders",
      name: "Shaders",
      select: "one" as const,
      features: [{ id: "bsl", name: "BSL", paths: ["shaderpacks/bsl.zip"], default: true }],
    })
    expect(() => PackManifest.parse(m)).toThrow(/only target a feature in an "any" group/)
  })

  it("rejects a self-requirement", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].requires = ["iris"]
    expect(() => PackManifest.parse(m)).toThrow(/cannot require itself/)
  })

  it("rejects a requires cycle", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].requires = ["extra"]
    m.version.optionalGroups![0].features.push({
      id: "extra",
      name: "Extra",
      paths: ["mods/extra.jar"],
      default: false,
      requires: ["iris"],
    })
    expect(() => PackManifest.parse(m)).toThrow(/cycle/)
  })

  // ---- rule 6 ----
  it("requires exactly one default in a `one` group", () => {
    const m = withOptional()
    m.version.optionalGroups![0].select = "one"
    m.version.optionalGroups![0].features.push({
      id: "extra",
      name: "Extra",
      paths: ["mods/extra.jar"],
      default: true,
    })
    expect(() => PackManifest.parse(m)).toThrow(/exactly one default:true/)
  })

  it("rejects a `one` group with no default on", () => {
    const m = withOptional()
    m.version.optionalGroups![0].select = "one"
    m.version.optionalGroups![0].features[0].default = false
    expect(() => PackManifest.parse(m)).toThrow(/exactly one default:true/)
  })

  it("allows an `atMostOne` group with nothing on by default", () => {
    const m = withOptional()
    m.version.optionalGroups![0].select = "atMostOne"
    m.version.optionalGroups![0].features[0].default = false
    expect(() => PackManifest.parse(m)).not.toThrow()
  })

  // ---- rule 7 ----
  it("rejects activating a file the feature does not own", () => {
    const m = withOptional()
    m.version.optionalGroups![0].select = "one"
    m.version.optionalGroups![0].features[0].activate = {
      kind: "shaderpack" as const,
      file: "shaderpacks/bsl.zip",
    }
    expect(() => PackManifest.parse(m)).toThrow(/one of the feature's own paths/)
  })

  // ---- rule 8 ----
  it("rejects a shaderpack activation in an `any` group", () => {
    const m = withOptional()
    m.version.optionalGroups![0].features[0].paths = ["shaderpacks/bsl.zip"]
    m.version.optionalGroups![0].features[0].activate = {
      kind: "shaderpack" as const,
      file: "shaderpacks/bsl.zip",
    }
    expect(() => PackManifest.parse(m)).toThrow(/"one" or "atMostOne" group/)
  })

  it("accepts a shaderpack activation in a `one` group", () => {
    const m = withOptional()
    m.version.optionalGroups![0].select = "one"
    m.version.optionalGroups![0].features[0].paths = ["shaderpacks/bsl.zip"]
    m.version.optionalGroups![0].features[0].activate = {
      kind: "shaderpack" as const,
      file: "shaderpacks/bsl.zip",
    }
    expect(() => PackManifest.parse(m)).not.toThrow()
  })

  // ---- rule 9 (D1) ----
  it("rejects a datapack outside a global loader directory", () => {
    const m = manifest()
    m.version.files.push(optionalFile("saves/mundo/datapacks/tweaks.zip"))
    m.version.optionalGroups = [
      {
        id: "extras",
        name: "Extras",
        features: [
          {
            id: "tweaks",
            name: "Tweaks",
            paths: ["saves/mundo/datapacks/tweaks.zip"],
            default: true,
            activate: { kind: "datapack" as const, file: "saves/mundo/datapacks/tweaks.zip" },
          },
        ],
      },
    ]
    expect(() => PackManifest.parse(m)).toThrow(/global loader reads it/)
  })

  const withDatapack = (): z.input<typeof PackManifest> => {
    const m = manifest()
    m.version.files.push(optionalFile("config/openloader/datapacks/tweaks.zip"))
    m.version.optionalGroups = [
      {
        id: "extras",
        name: "Extras",
        features: [
          {
            id: "tweaks",
            name: "Tweaks",
            paths: ["config/openloader/datapacks/tweaks.zip"],
            default: true,
            activate: {
              kind: "datapack" as const,
              file: "config/openloader/datapacks/tweaks.zip",
            },
          },
        ],
      },
    ]
    return m
  }

  it("accepts a datapack under a global loader directory", () => {
    expect(() => PackManifest.parse(withDatapack())).not.toThrow()
  })

  // ---- warnings, which must never be errors ----
  it("warns — and does not fail — when a datapack ships with no global loader", () => {
    const parsed = PackManifest.parse(withDatapack())
    const warnings = optionalWarnings(parsed.version)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].code).toBe("datapack-loader-missing")
    expect(warnings[0].featureId).toBe("tweaks")
  })

  it("stays quiet once a loader jar is in files[]", () => {
    const m = withDatapack()
    m.version.files.push({
      path: "mods/openloader-1.21.jar",
      sha512,
      fileSize: 10,
      source: { kind: "url" as const, url: "https://example.com/ol" },
    })
    expect(optionalWarnings(PackManifest.parse(m).version)).toHaveLength(0)
  })
})

// D4: an optional file no feature claims is not an error — it is the pre-feature
// behaviour, folded into a synthesised group so the chooser can still show it.
describe("optionalModelOf", () => {
  it("folds unclaimed optional files into `otros`, on by default", () => {
    const m = manifest()
    m.version.files.push({
      path: "mods/journeymap.jar",
      sha512,
      fileSize: 10,
      env: { client: "optional", server: "unsupported" },
      source: { kind: "url" as const, url: "https://example.com/jm" },
    })
    const model = optionalModelOf(PackManifest.parse(m).version)
    expect(model).toHaveLength(1)
    expect(model[0].id).toBe(SYNTHETIC_GROUP_ID)
    expect(model[0].features[0].default).toBe(true)
    expect(model[0].features[0].name).toBe("journeymap.jar")
    expect(model[0].features[0].paths).toEqual(["mods/journeymap.jar"])
  })

  it("leaves a claimed optional file alone and returns no synthetic group", () => {
    const m = manifest()
    m.version.files.push({
      path: "mods/journeymap.jar",
      sha512,
      fileSize: 10,
      env: { client: "optional", server: "unsupported" },
      source: { kind: "url" as const, url: "https://example.com/jm" },
    })
    m.version.optionalGroups = [
      {
        id: "mapas",
        name: "Mapas",
        features: [
          { id: "journeymap", name: "JourneyMap", paths: ["mods/journeymap.jar"], default: false },
        ],
      },
    ]
    const model = optionalModelOf(PackManifest.parse(m).version)
    expect(model).toHaveLength(1)
    expect(model[0].id).toBe("mapas")
  })

  it("returns the authored groups unchanged when nothing is optional", () => {
    expect(optionalModelOf(PackManifest.parse(manifest()).version)).toEqual([])
  })
})

describe("runtime.jvmArgs", () => {
  const withArgs = (...jvmArgs: string[]) => {
    const m = manifest()
    m.version.runtime = { jvmArgs }
    return m
  }

  it("accepts the tuning flags a real modpack ships", () => {
    const args = [
      "-Xms2G",
      "-Xmn512M",
      "-Xss1M",
      "-XX:+UseG1GC",
      "-XX:-OmitStackTraceInFastThrow",
      "-XX:MaxGCPauseMillis=50",
      "-XX:G1NewSizePercent=20",
      "-Dmixin.debug=true",
      "-Dfml.ignorePatchDiscrepancies=true",
      "--add-opens=java.base/java.lang=ALL-UNNAMED",
    ]
    expect(sanitizeJvmArgs(args).dropped).toEqual([])
    expect(PackManifest.parse(withArgs(...args)).version.runtime?.jvmArgs).toEqual(args)
  })

  it("refuses -Xmx with a reason that names memoryMib", () => {
    // Not a security rule: game.rs appends the RESOLVED heap last so it beats
    // version metadata, which means a pack's own -Xmx could never take effect.
    // Silently ignoring it would be the worst outcome of the three.
    expect(judgeJvmArg("-Xmx8G")).toEqual({ ok: false, arg: "-Xmx8G", reason: "heap" })
    const parsed = PackManifest.safeParse(withArgs("-Xmx8G"))
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0].message).toContain("memoryMib")
    expect(parsed.error?.issues[0].path).toEqual(["version", "runtime", "jvmArgs", 0])
  })

  it("refuses every flag that runs a command or loads unhashed code", () => {
    // The two capabilities a mod jar does NOT already have: spawning an OS
    // process, and loading a jar that never went through files[]/sha512.
    for (const arg of [
      "-javaagent:C:\\Users\\x\\Downloads\\evil.jar",
      "-agentlib:jdwp=transport=dt_socket,server=y,address=5005",
      "-agentpath:/tmp/x.so",
      "-XX:OnError=cmd /c calc.exe",
      "-XX:OnOutOfMemoryError=kill -9 %p",
      "-XX:StartFlightRecording=filename=/tmp/x.jfr",
      "-XX:CompileCommand=print,*.*",
      "-Xbootclasspath/a:/tmp/x.jar",
      "-cp:/tmp/x.jar",
      "--patch-module=java.base=/tmp/x.jar",
      "--module-path=/tmp",
    ]) {
      expect(judgeJvmArg(arg), arg).toMatchObject({ ok: false, reason: "denied" })
    }
    // Case is not a bypass.
    expect(judgeJvmArg("-XX:onerror=calc")).toMatchObject({ ok: false, reason: "denied" })
    expect(judgeJvmArg("-JavaAgent:x.jar")).toMatchObject({ ok: false, reason: "denied" })
  })

  it("refuses platform -D keys but keeps mod-facing ones", () => {
    for (const arg of [
      "-Djava.library.path=C:\\evil",
      "-Djava.security.manager=allow",
      "-Djdk.attach.allowAttachSelf=true",
      "-Dsun.misc.x=1",
      "-Dboffmedia.session=stolen",
    ]) {
      expect(judgeJvmArg(arg), arg).toMatchObject({ ok: false, reason: "denied" })
    }
    expect(judgeJvmArg("-Dmixin.debug.verbose=true").ok).toBe(true)
  })

  it("admits no filesystem path through any accepted shape", () => {
    // The grammar, not the deny list, is what makes this true: every value
    // pattern excludes `/`, `\` and `:`. --add-opens is the one exception and
    // its `/` is a module separator with no drive letter and no `..`.
    for (const arg of [
      "-XX:HeapDumpPath=C:\\Users\\x",
      "-XX:LogFile=/tmp/x",
      "-Dfoo=/etc/passwd",
      "-Dfoo=C:\\x",
      "--add-opens=../../evil/x=ALL-UNNAMED",
    ]) {
      expect(judgeJvmArg(arg), arg).toMatchObject({ ok: false })
    }
  })

  it("drops junk, dedupes, and caps the list", () => {
    const { kept, dropped } = sanitizeJvmArgs([
      "-XX:+UseG1GC",
      "-XX:+UseG1GC",
      "  -Xms2G  ",
      "rm -rf /",
      "",
      "-XX:+UseZGC" + "x".repeat(300),
    ])
    expect(kept).toEqual(["-XX:+UseG1GC", "-Xms2G"])
    expect(dropped.map((d) => d.reason)).toEqual(["malformed", "malformed", "malformed"])
    expect(sanitizeJvmArgs(Array(50).fill("-XX:+UseG1GC")).kept).toHaveLength(1)
  })

  it("is minecraft-only", () => {
    const m = manifest()
    m.pack.gameType = "emulator"
    m.version.dependencies = undefined
    m.version.emulator = { kind: "mgba", rom: "roms/x.gba" }
    m.version.files = [
      {
        path: "roms/x.gba",
        sha512,
        fileSize: 10,
        env: { client: "required", server: "unsupported" },
        source: { kind: "user-provided", hint: "Your ROM" },
      },
    ]
    m.version.runtime = { memoryMib: 4096 }
    const parsed = PackManifest.safeParse(m)
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.some((i) => i.path.join(".") === "version.runtime")).toBe(true)
  })

  it("accepts a memory-only runtime block", () => {
    const m = manifest()
    m.version.runtime = { memoryMib: 8192 }
    expect(PackManifest.parse(m).version.runtime).toEqual({ memoryMib: 8192 })
    m.version.runtime = { memoryMib: 128 }
    expect(PackManifest.safeParse(m).success).toBe(false)
  })
})
