import { z } from "zod"

// The Modrinth `.mrpack` index (`modrinth.index.json`), modelled as-is.
// HANDOFF §7.1: "extend, don't invent" — interop means users can escape to
// Prism if this project is ever abandoned, which makes them more willing to
// adopt it. So this half stays a faithful .mrpack and everything Boffmedia
// adds is namespaced in `boffmedia.ts`.

/** client × server, each required/optional/unsupported. */
export const EnvSupport = z.enum(["required", "optional", "unsupported"])
export type EnvSupport = z.infer<typeof EnvSupport>

export const FileEnv = z.object({
  client: EnvSupport,
  server: EnvSupport,
})
export type FileEnv = z.infer<typeof FileEnv>

/** sha1 is what .mrpack has always carried; sha512 is what §7.1 requires for
 *  our own manifests. Both are optional here because a hand-authored .mrpack in
 *  the wild may carry only one — `PackManifest` tightens this. */
export const FileHashes = z.object({
  sha1: z.string().regex(/^[a-f0-9]{40}$/, "sha1 must be 40 lowercase hex chars").optional(),
  sha512: z.string().regex(/^[a-f0-9]{128}$/, "sha512 must be 128 lowercase hex chars").optional(),
})
export type FileHashes = z.infer<typeof FileHashes>

/** A path inside the instance directory. Rejects absolute paths and `..`
 *  traversal — this value is used to write to disk on the client, so a
 *  malicious manifest must not be able to escape the instance folder. */
export const InstancePath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith("/") && !/^[a-zA-Z]:/.test(p), "path must be relative to the instance")
  .refine((p) => !p.split(/[\\/]/).includes(".."), "path must not traverse outside the instance")
export type InstancePath = z.infer<typeof InstancePath>

export const MrpackFile = z.object({
  path: InstancePath,
  hashes: FileHashes,
  env: FileEnv.optional(),
  downloads: z.array(z.url()),
  fileSize: z.number().int().nonnegative().optional(),
})
export type MrpackFile = z.infer<typeof MrpackFile>

/** Loader keys .mrpack recognises. `minecraft` is always present; at most one
 *  loader should accompany it, which `PackManifest` enforces. */
export const MrpackDependencies = z.object({
  minecraft: z.string().min(1),
  forge: z.string().min(1).optional(),
  neoforge: z.string().min(1).optional(),
  "fabric-loader": z.string().min(1).optional(),
  "quilt-loader": z.string().min(1).optional(),
})
export type MrpackDependencies = z.infer<typeof MrpackDependencies>

export const LOADER_KEYS = ["forge", "neoforge", "fabric-loader", "quilt-loader"] as const
export type LoaderKey = (typeof LOADER_KEYS)[number]

/** Which loader a dependency set selects, if any. */
export function loaderOf(deps: MrpackDependencies): { loader: LoaderKey; version: string } | null {
  for (const loader of LOADER_KEYS) {
    const version = deps[loader]
    if (version) return { loader, version }
  }
  return null
}
