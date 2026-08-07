import { z } from "zod"

import { EnvSupport, FileEnv, InstancePath, MrpackDependencies, loaderOf } from "./mrpack.js"

// Boffmedia's additions to .mrpack, all under the `boffmedia:` namespace so a
// third-party tool (Prism, packwiz) ignores them and the pack still installs.
// HANDOFF §7.1: per file — source, SHA-512, target path, env.

/** Which game a pack targets. Absent on a pack means `minecraft` (back-compat:
 *  every pack authored before multi-game had no `gameType`). All four values
 *  are declared in Cycle 1 even though only `minecraft` is playable — the
 *  discriminator, filtering, and validation skeleton land once; each game cycle
 *  lights up its own spec block (§PackVersion) and its own launcher arm.
 *  `gameType` is immutable after pack creation (enforced in the API): a pack
 *  that changed games would break every installed instance. */
export const GameType = z.enum(["minecraft", "emulator", "zomboid", "stardew"])
export type GameType = z.infer<typeof GameType>

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
  /** A file the server NEVER stores: the player supplies it locally and the
   *  launcher verifies it against the entry's mandatory `sha512` + `fileSize`
   *  before placing it. Game-agnostic by design (ROMs, BIOS files, anything
   *  undistributable). `hint` is what the player sees when asked for the file —
   *  authors must write it precisely (region/revision matter). */
  z.object({
    kind: z.literal("user-provided"),
    hint: z.string().min(1).max(512),
  }),
  /** A romhack: the file materializes LOCALLY by applying `patch` to `base`,
   *  then is verified like any other file against the entry's own `sha512` +
   *  `fileSize` (which pin the PATCHED output). The pipeline stays uniform —
   *  every file has a way to materialize and a pinned hash. `base` must point at
   *  a `user-provided` files[] entry (the player's clean dump — the server never
   *  hosts ROM bytes, D3); `patch` at a distributable files[] entry
   *  (`override`/`url` — patches are freely redistributable). No `patched` entry
   *  may itself be the `base` of another (no chains in v1). Cross-field rules
   *  live in the superRefine and are mirrored in `pack.rs`. `.ips` is excluded:
   *  no embedded checksums. `.bps`/`.ups` both carry source/target CRC32s. */
  z.object({
    kind: z.literal("patched"),
    base: InstancePath,
    patch: InstancePath,
    format: z.enum(["bps", "ups"]),
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

/** The emulator systems supported in Cycle 2 (D2). Azahar/3DS is deferred
 *  (decrypted dumps + keys); no RetroArch. */
export const EmulatorKind = z.enum(["mgba", "melonds"])
export type EmulatorKind = z.infer<typeof EmulatorKind>

/** The per-game spec block for `gameType: "emulator"`. `rom` names the file
 *  handed to the emulator at launch — it MUST equal the `path` of a `files[]`
 *  entry whose source is `user-provided` or `patched` (the server never hosts
 *  ROM bytes, D3) and whose env is client:required / server:unsupported. `args`
 *  are extra CLI flags placed BEFORE the ROM path. Cross-field rules live in the
 *  PackManifest superRefine and are mirrored in `pack.rs`. */
export const EmulatorSpec = z.object({
  kind: EmulatorKind,
  rom: InstancePath,
  args: z.array(z.string().max(256)).max(32).optional(),
})
export type EmulatorSpec = z.infer<typeof EmulatorSpec>

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

/** A world bundled INTO the pack: a zipped save the launcher extracts into
 *  `saves/<folder>` on install. First-install-only — an update never overwrites
 *  a save that already exists on disk, so a player's progress is safe. That is
 *  why a world is NOT a plain PackFile: files re-verify and re-download on every
 *  update, which would clobber a played world. The zip is content-addressed
 *  through the same blob store as override files (`source`); `sha512` is the
 *  hash of the zip, verified before extraction. */
export const BundledWorld = z.object({
  /** A single save-directory name under `saves/`. One path segment, no
   *  separators and no traversal — this value names a directory we create. */
  folder: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[^/\\]+$/, "folder must be a single path segment")
    .refine((f) => f !== "." && f !== "..", "folder must not be '.' or '..'"),
  source: FileSource,
  sizeBytes: z.number().int().nonnegative(),
  sha512: z.string().regex(/^[a-f0-9]{128}$/, "sha512 must be 128 lowercase hex chars"),
})
export type BundledWorld = z.infer<typeof BundledWorld>

export const PackVersion = z.object({
  /** Opaque, server-assigned. Not semver — packs version on their own clock. */
  id: z.string().min(1),
  /** What users see: "1.4.2", "Season 3", whatever the owner types. */
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  /** Minecraft loader/version set. OPTIONAL as of multi-game: required iff the
   *  pack is `minecraft` (enforced in PackManifest.superRefine), forbidden
   *  otherwise. */
  dependencies: MrpackDependencies.optional(),
  files: z.array(PackFile),
  /** Worlds shipped with this version, installed first-time-only. Minecraft-only
   *  (forbidden on any other gameType — superRefine). */
  worlds: z.array(BundledWorld).optional(),
  /** Per-game spec blocks — exactly one is present, matching the pack's
   *  gameType (superRefine). `emulator` is tightened to its real shape as of
   *  Cycle 2; `zomboid`/`stardew` stay loose slots until their cycles ship. */
  emulator: EmulatorSpec.optional(),
  zomboid: z.unknown().optional(),
  stardew: z.unknown().optional(),
  /** First-install-only files (a starting `.sav`, a default options file):
   *  written only if the target path does not already exist, then owned by the
   *  player — never re-verified or overwritten on update/repair. Same shape as
   *  `files[]`, but `user-provided` sources are forbidden (we would prompt for a
   *  file only to never check it again) and paths must not collide with
   *  `files[]` (superRefine). Generalizes the bundled-worlds idea without
   *  touching the `worlds` mechanism. */
  initialFiles: z.array(PackFile).optional(),
})
export type PackVersion = z.infer<typeof PackVersion>

/** The resolved game type of a pack: the stored value, or `minecraft` when
 *  absent (a pack authored before multi-game). One place owns the default so no
 *  consumer re-implements it. */
export const gameTypeOf = (pack: Pack): GameType => pack.gameType ?? "minecraft"

/** Quick Play target for this pack (RF-01/RF-03). `port` is OPTIONAL: a bare
 *  host (e.g. `play.example.com` behind a Minecraft SRV record) declares no
 *  port, and both the join (Minecraft resolves SRV from --quickPlayMultiplayer)
 *  and the status ping (the launcher does its own SRV lookup) find the real
 *  port. When a port IS given it is used verbatim and SRV is skipped. */
export const PackServer = z.object({
  host: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, "host must not contain a scheme or a slash"),
  port: z.number().int().min(1).max(65535).optional(),
})
export type PackServer = z.infer<typeof PackServer>

/** A promotional gallery image shown before install (pack detail, browse). Not
 *  a game file — never installed — so it lives on the Pack, not in `files`. For
 *  managed packs `url` is a public upload URL; for local packs the gallery is
 *  kept out of the manifest entirely (a convention dir on disk), so this array
 *  is empty there. */
export const PackGalleryImage = z.object({
  url: z.url(),
  alt: z.string().max(256).optional(),
})
export type PackGalleryImage = z.infer<typeof PackGalleryImage>

export const Pack = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  /** Which game this pack targets. Absent = `minecraft` (back-compat). Use
   *  `gameTypeOf(pack)` to read it with the default applied. */
  gameType: GameType.optional(),
  name: z.string().min(1),
  summary: z.string().max(512).optional(),
  /** Long-form plain-text description shown on the pack's info panel. */
  description: z.string().max(2048).optional(),
  iconUrl: z.url().optional(),
  gallery: z.array(PackGalleryImage).optional(),
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
    const v = m.version
    const gameType = gameTypeOf(m.pack)

    // A normalized, case-insensitive view of a target path: Windows and macOS
    // would silently overwrite one file with the other while Linux installs
    // both, so collisions are judged case-insensitively with separators unified.
    const norm = (p: string) => p.toLowerCase().replace(/\\/g, "/")

    // ---- duplicate target paths within files[] ----
    const seen = new Set<string>()
    for (const [i, file] of v.files.entries()) {
      const key = norm(file.path)
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "path"],
          message: `duplicate target path: ${file.path}`,
        })
      }
      seen.add(key)
    }

    // ---- duplicate bundled-world folders ----
    // Two bundled worlds targeting the same save folder would race to write the
    // same directory — reject case-insensitively for the same per-platform reason.
    const worldFolders = new Set<string>()
    for (const [i, world] of (v.worlds ?? []).entries()) {
      const key = world.folder.toLowerCase()
      if (worldFolders.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "worlds", i, "folder"],
          message: `duplicate world folder: ${world.folder}`,
        })
      }
      worldFolders.add(key)
    }

    // ---- game-type exclusivity rule engine ----
    // Exactly one shape per gameType. Minecraft is the only arm that ships live
    // in Cycle 1 (its spec blocks are the loosely-typed slots above); each game
    // cycle tightens its own block and reuses this exclusivity check unchanged.
    const specSlots = { emulator: v.emulator, zomboid: v.zomboid, stardew: v.stardew } as const
    const forbidSpec = (kind: keyof typeof specSlots) => {
      if (specSlots[kind] !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", kind],
          message: `\`${kind}\` is only allowed when gameType is "${kind}"`,
        })
      }
    }

    if (gameType === "minecraft") {
      if (v.dependencies === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "dependencies"],
          message: "minecraft packs require a `dependencies` block",
        })
      }
      forbidSpec("emulator")
      forbidSpec("zomboid")
      forbidSpec("stardew")
    } else {
      // Non-Minecraft: exactly its own spec block, and nothing Minecraft-shaped.
      if (v.dependencies !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "dependencies"],
          message: `\`dependencies\` is minecraft-only (gameType is "${gameType}")`,
        })
      }
      if (v.worlds !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "worlds"],
          message: `\`worlds\` is minecraft-only (gameType is "${gameType}")`,
        })
      }
      if (specSlots[gameType] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", gameType],
          message: `gameType "${gameType}" requires its \`${gameType}\` spec block`,
        })
      }
      for (const kind of ["emulator", "zomboid", "stardew"] as const) {
        if (kind !== gameType) forbidSpec(kind)
      }
    }

    // ---- initialFiles rules ----
    // First-install-only files: distributable sources only (a `user-provided`
    // file would be prompted for then never checked again — nonsensical), and no
    // path collision with files[] (the two mechanisms would fight over the path).
    const initialSeen = new Set<string>()
    for (const [i, file] of (v.initialFiles ?? []).entries()) {
      if (file.source.kind !== "override" && file.source.kind !== "url") {
        ctx.addIssue({
          code: "custom",
          path: ["version", "initialFiles", i, "source"],
          message: `initialFiles source must be "override" or "url" (got "${file.source.kind}")`,
        })
      }
      const key = norm(file.path)
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "initialFiles", i, "path"],
          message: `initialFiles path collides with a files[] entry: ${file.path}`,
        })
      }
      if (initialSeen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "initialFiles", i, "path"],
          message: `duplicate initialFiles path: ${file.path}`,
        })
      }
      initialSeen.add(key)
    }

    // ---- `patched` (romhack) cross-field rules (game-agnostic, Cycle 2) ----
    // A patched file references two other files[] entries by path: its clean
    // `base` (must be user-provided — the server never hosts ROM bytes) and its
    // `patch` (must be distributable). Requiring the base to be user-provided
    // also forbids chains (a base can never itself be a patched entry).
    const fileByPath = new Map<string, (typeof v.files)[number]>()
    for (const file of v.files) fileByPath.set(norm(file.path), file)
    for (const [i, file] of v.files.entries()) {
      if (file.source.kind !== "patched") continue
      const base = fileByPath.get(norm(file.source.base))
      if (!base) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "base"],
          message: `patched.base must reference a files[] entry: ${file.source.base}`,
        })
      } else if (base.source.kind !== "user-provided") {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "base"],
          message: `patched.base must reference a user-provided file (no blob-hosted or chained ROMs)`,
        })
      }
      const patch = fileByPath.get(norm(file.source.patch))
      if (!patch) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "patch"],
          message: `patched.patch must reference a files[] entry: ${file.source.patch}`,
        })
      } else if (patch.source.kind !== "override" && patch.source.kind !== "url") {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "patch"],
          message: `patched.patch must reference an override or url file (patches are distributable)`,
        })
      }
    }

    // ---- emulator arm (Cycle 2) ----
    // The generic engine above already enforces block-presence/exclusivity; this
    // adds the emulator-internal rules. `emulator.rom` must name a real files[]
    // entry that is a player-supplied dump (user-provided) or a locally patched
    // ROM, client-required and server-unsupported.
    if (gameType === "emulator" && v.emulator) {
      const romFile = fileByPath.get(norm(v.emulator.rom))
      if (!romFile) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "emulator", "rom"],
          message: `emulator.rom must match a files[] entry path: ${v.emulator.rom}`,
        })
      } else {
        if (romFile.env.client !== "required" || romFile.env.server !== "unsupported") {
          ctx.addIssue({
            code: "custom",
            path: ["version", "emulator", "rom"],
            message: `the ROM entry must have env.client "required" and env.server "unsupported"`,
          })
        }
        if (romFile.source.kind !== "user-provided" && romFile.source.kind !== "patched") {
          ctx.addIssue({
            code: "custom",
            path: ["version", "emulator", "rom"],
            message: `the ROM must be user-provided or patched (the server never hosts ROM bytes)`,
          })
        }
      }
    }
  })
export type PackManifest = z.infer<typeof PackManifest>

export { EnvSupport, loaderOf }
