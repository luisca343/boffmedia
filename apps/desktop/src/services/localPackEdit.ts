import type { PackManifest } from "@boffmedia/pack-schema"

import { localPackGet, localPackSave } from "../runtime"

// Every edit a local pack's detail page can make, funnelled through one
// read-modify-write. Doing it here rather than in each component keeps two
// invariants that are easy to lose: the manifest is always written back WHOLE
// (a partial write silently drops the pack's configs), and `env` is always
// present on every entry (the schema defaults it, but the Rust side validates
// what it is actually given).

type ManifestFile = {
  path: string
  sha512: string
  fileSize: number
  env: { client: string; server: string }
  source: unknown
}

const DEFAULT_ENV = { client: "required", server: "required" } as const

function normalise(path: string): string {
  return path.toLowerCase().replace(/\\/g, "/")
}

/** A new opaque version id, minted on every edit.
 *
 *  This is what makes an edit VISIBLE to the installer. `instance_scan`
 *  compares the install marker's version id against the manifest's and reports
 *  `outdated` when they differ — so without a bump, adding, removing or
 *  updating a mod left the pack reading "instalado" while the files on disk
 *  were the previous set, and the only way to sync was a manual repair.
 *
 *  Timestamp-based rather than a counter: it has to be unique against every id
 *  this pack has ever had (the install history is keyed on it), and there is no
 *  monotonic source here that survives a reinstall. */
function nextVersionId(slug: string): string {
  return `local-${Date.now()}-${slug}`
}

async function mutate(
  slug: string,
  change: (files: ManifestFile[]) => ManifestFile[],
): Promise<PackManifest> {
  const current = await localPackGet(slug)
  if (!current) throw new Error("No se encontró el pack.")
  const files = ((current.version?.files ?? []) as ManifestFile[]).map((file) => ({
    ...file,
    env: file.env ?? DEFAULT_ENV,
  }))
  const next = change(files)
  return localPackSave({
    ...current,
    version: {
      ...current.version,
      id: nextVersionId(slug),
      files: next,
    },
  })
}

export function removeFile(slug: string, path: string) {
  return mutate(slug, (files) => files.filter((f) => normalise(f.path) !== normalise(path)))
}

/** Point an existing entry at a different file — a version swap, or an update.
 *  Matched on the OLD path because the new file's name almost always differs;
 *  matching on the new one would append a duplicate instead of replacing. */
export function replaceFile(
  slug: string,
  oldPath: string,
  next: { path: string; sha512: string; fileSize: number; source: unknown },
) {
  return mutate(slug, (files) =>
    files.map((f) =>
      normalise(f.path) === normalise(oldPath) ? { ...f, ...next, env: f.env ?? DEFAULT_ENV } : f,
    ),
  )
}

/** Append entries, skipping any whose path is already taken. The manifest
 *  rejects duplicate paths case-insensitively, so a silent overwrite here would
 *  become a save failure the player cannot explain. */
export function addFiles(
  slug: string,
  entries: Array<{ path: string; sha512: string; fileSize: number; source: unknown }>,
) {
  return mutate(slug, (files) => {
    const taken = new Set(files.map((f) => normalise(f.path)))
    const fresh = entries
      .filter((e) => !taken.has(normalise(e.path)))
      .map((e) => ({ ...e, env: DEFAULT_ENV }))
    return [...files, ...fresh]
  })
}
