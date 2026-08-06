import { z } from "zod"

import { EnvSupport, FileEnv, InstancePath, MrpackDependencies, loaderOf } from "./mrpack.js"

// Boffmedia's additions to .mrpack, all under the `boffmedia:` namespace so a
// third-party tool (Prism, packwiz) ignores them and the pack still installs.
// HANDOFF §7.1: per file — source, SHA-512, target path, env.

/** Which game a pack targets. Absent means `minecraft` — every manifest that
 *  existed before multi-game support is a Minecraft pack and must keep
 *  validating unchanged. */
export const GameType = z.enum(["minecraft", "emulator"])
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
  /** A file the server never distributes: the user supplies it locally (a ROM
   *  dump, a BIOS) and the launcher verifies it against the entry's mandatory
   *  sha512/fileSize before copying it into the instance. This is what keeps
   *  packs distributable when their content is not. */
  z.object({
    kind: z.literal("user-provided"),
    /** Shown to the user when prompting for the file, e.g. "Pokémon Emerald
     *  (USA) cartridge dump (.gba)". */
    hint: z.string().min(1).max(256),
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

/** Emulators the launcher knows how to configure in portable mode. */
export const EmulatorKind = z.enum(["mgba", "melonds"])
export type EmulatorKind = z.infer<typeof EmulatorKind>

/** How an emulator pack launches. The pack never ships the emulator itself —
 *  the launcher resolves the PLAYER'S OWN install (a settings override, then
 *  EmuDeck's conventional paths, then common install locations), so their
 *  controls, shaders and config apply untouched. The ROM is an ordinary
 *  `files` entry, typically `user-provided`. */
export const EmulatorSpec = z.object({
  kind: EmulatorKind,
  /** Instance-relative path of the ROM handed to the emulator. Must match a
   *  `files` entry (enforced by PackManifest). */
  rom: InstancePath,
  /** Extra CLI args inserted before the ROM path. */
  args: z.array(z.string().min(1)).optional(),
})
export type EmulatorSpec = z.infer<typeof EmulatorSpec>

export const PackVersion = z.object({
  /** Opaque, server-assigned. Not semver — packs version on their own clock. */
  id: z.string().min(1),
  /** What users see: "1.4.2", "Season 3", whatever the owner types. */
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  /** Minecraft + loader pins. Required for Minecraft packs, absent for every
   *  other game (enforced by PackManifest, which owns cross-field rules). */
  dependencies: MrpackDependencies.optional(),
  files: z.array(PackFile),
  /** Worlds shipped with this version, installed first-time-only. */
  worlds: z.array(BundledWorld).optional(),
  /** Present exactly when the pack's gameType is `emulator`. */
  emulator: EmulatorSpec.optional(),
})
export type PackVersion = z.infer<typeof PackVersion>

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
  name: z.string().min(1),
  summary: z.string().max(512).optional(),
  /** Long-form plain-text description shown on the pack's info panel. */
  description: z.string().max(2048).optional(),
  iconUrl: z.url().optional(),
  gallery: z.array(PackGalleryImage).optional(),
  access: PackAccess,
  latestVersionId: z.string().min(1).optional(),
  server: PackServer.optional(),
  /** Absent on every pre-multi-game manifest, so absent means `minecraft`. Use
   *  `gameTypeOf(pack)` instead of reading this field directly. */
  gameType: GameType.optional(),
})
export type Pack = z.infer<typeof Pack>

/** The one place the "absent means minecraft" rule is written down. */
export function gameTypeOf(pack: Pick<Pack, "gameType">): GameType {
  return pack.gameType ?? "minecraft"
}

/** The full document the dashboard publishes and the launcher consumes. This is
 *  the object the whole package exists for: one schema, both ends. */
export const PackManifest = z
  .object({
    formatVersion: z.literal(1),
    pack: Pack,
    version: PackVersion,
  })
  .superRefine((m, ctx) => {
    // Cross-field game-type rules live here, not in Pack/PackVersion, because
    // they span both halves of the document.
    const gameType = gameTypeOf(m.pack)
    if (gameType === "minecraft") {
      // Vanilla packs (no loader at all) are legal, so dependencies get no
      // further check here beyond MrpackDependencies' own.
      if (!m.version.dependencies) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "dependencies"],
          message: "a minecraft pack must declare dependencies",
        })
      }
      if (m.version.emulator) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "emulator"],
          message: "a minecraft pack must not declare an emulator block",
        })
      }
    } else if (gameType === "emulator") {
      if (m.version.dependencies) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "dependencies"],
          message: "an emulator pack must not declare minecraft dependencies",
        })
      }
      if (!m.version.emulator) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "emulator"],
          message: "an emulator pack must declare an emulator block",
        })
      }
      if (m.version.worlds?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "worlds"],
          message: "bundled worlds are minecraft-only; ship emulator saves as files",
        })
      }
      if (m.version.emulator) {
        // The ROM must be a real entry in `files` so it carries a sha512 —
        // that hash is what the launcher verifies the player's dump against.
        const filePaths = new Set(m.version.files.map((f) => f.path.toLowerCase().replace(/\\/g, "/")))
        const rom = m.version.emulator.rom.toLowerCase().replace(/\\/g, "/")
        if (!filePaths.has(rom)) {
          ctx.addIssue({
            code: "custom",
            path: ["version", "emulator", "rom"],
            message: "emulator.rom must match the path of a files[] entry",
          })
        }
      }
    }

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

    // Two bundled worlds targeting the same save folder would race to write the
    // same directory — reject case-insensitively for the same per-platform
    // reason the file check does.
    const worldFolders = new Set<string>()
    for (const [i, world] of (m.version.worlds ?? []).entries()) {
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
  })
export type PackManifest = z.infer<typeof PackManifest>

export { EnvSupport, loaderOf }
