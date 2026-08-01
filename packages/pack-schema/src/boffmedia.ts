import { z } from "zod"

import { EnvSupport, FileEnv, InstancePath, MrpackDependencies, loaderOf } from "./mrpack.js"

// Boffmedia's additions to .mrpack, all under the `boffmedia:` namespace so a
// third-party tool (Prism, packwiz) ignores them and the pack still installs.
// HANDOFF §7.1: per file — source, SHA-512, target path, env.

/** Where a file comes from. §7.1 lists exactly three sources; §4.5 explains why
 *  CurseForge is proxied rather than fetched directly (an embedded CF key gets
 *  extracted, and an abused key is a revoked key). Modrinth is primary and goes
 *  client-direct at zero egress cost. */
export const FileSource = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("modrinth"),
    projectId: z.string().min(1),
    versionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("curseforge"),
    projectId: z.number().int().positive(),
    fileId: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("url"),
    url: z.url(),
  }),
  /** Configs, scripts, resource packs: content-addressed blobs we host.
   *  §7.2 — fetched with a short-TTL presigned URL, never a public one. */
  z.object({
    kind: z.literal("override"),
    blobSha512: z.string().regex(/^[a-f0-9]{128}$/, "blobSha512 must be 128 lowercase hex chars"),
  }),
])
export type FileSource = z.infer<typeof FileSource>

/** A file in a Boffmedia pack version. Unlike the raw .mrpack file, sha512 is
 *  mandatory — it is the integrity check on every download and, for overrides,
 *  the blob's own address. */
export const PackFile = z.object({
  path: InstancePath,
  sha512: z.string().regex(/^[a-f0-9]{128}$/, "sha512 must be 128 lowercase hex chars"),
  fileSize: z.number().int().nonnegative(),
  env: FileEnv.default({ client: "required", server: "required" }),
  source: FileSource,
})
export type PackFile = z.infer<typeof PackFile>

/** §7.3: a password gates composition and configs, not the mods themselves —
 *  those come from public CF/Modrinth URLs. §7.4: this is distribution control
 *  and revocation, never copy protection. */
export const PackAccess = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("public") }),
  z.object({ kind: z.literal("password") }),
  /** §7.2 — ACL keyed on the Minecraft UUID proved via `hasJoined`. */
  z.object({
    kind: z.literal("allowlist"),
    uuids: z.array(z.uuid()),
  }),
])
export type PackAccess = z.infer<typeof PackAccess>

export const PackVersion = z.object({
  /** Opaque, server-assigned. Not semver — packs version on their own clock. */
  id: z.string().min(1),
  /** What users see: "1.4.2", "Season 3", whatever the owner types. */
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  dependencies: MrpackDependencies,
  files: z.array(PackFile),
})
export type PackVersion = z.infer<typeof PackVersion>

/** Quick Play target for this pack (RF-01/RF-03). No SRV resolution here — the
 *  ping needs a real port to open a socket, and Minecraft itself resolves SRV
 *  when it connects with --quickPlayMultiplayer, so a host behind SRV just
 *  needs to declare its real port for the badge to be right (spec D1). */
export const PackServer = z.object({
  host: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, "host must not contain a scheme or a slash"),
  port: z.number().int().min(1).max(65535).default(25565),
})
export type PackServer = z.infer<typeof PackServer>

export const Pack = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  name: z.string().min(1),
  summary: z.string().max(512).optional(),
  iconUrl: z.url().optional(),
  access: PackAccess,
  latestVersionId: z.string().min(1).optional(),
  server: PackServer.optional(),
})
export type Pack = z.infer<typeof Pack>

/** The full document the dashboard publishes and the launcher consumes. This is
 *  the object the whole package exists for: one schema, both ends. */
export const PackManifest = z
  .object({
    formatVersion: z.literal(1),
    pack: Pack,
    version: PackVersion,
  })
  .superRefine((m, ctx) => {
    // Vanilla packs (no loader at all) are legal, so dependencies get no
    // further check here beyond MrpackDependencies' own.
    const seen = new Set<string>()
    for (const [i, file] of m.version.files.entries()) {
      const key = file.path.toLowerCase().replace(/\\/g, "/")
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "path"],
          // Case-insensitively, because Windows and macOS would silently
          // overwrite one file with the other while Linux installs both.
          message: `duplicate target path: ${file.path}`,
        })
      }
      seen.add(key)
    }
  })
export type PackManifest = z.infer<typeof PackManifest>

export { EnvSupport, loaderOf }
