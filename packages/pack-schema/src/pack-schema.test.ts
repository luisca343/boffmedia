import { describe, expect, it } from "vitest"
import type { z } from "zod"

import { PackManifest, loaderOf } from "./index.js"

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

  it("accepts a vanilla pack with no loader", () => {
    const m = manifest()
    m.version.dependencies = { minecraft: "1.21.4" }
    expect(loaderOf(PackManifest.parse(m).version.dependencies)).toBeNull()
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
