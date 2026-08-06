import { useCallback, useEffect, useState } from "react"

import { catalogLoaderOf } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  type ContentFile,
  catalogProjectSummaries,
  catalogVersions,
  catalogVersionsByIds,
  instanceContent,
  localPackGet,
} from "../../runtime"

// Assembling one Content-tab row takes three sources, and the awkward one is
// the middle:
//
//   1. what this INSTANCE has        -> instance_content (the marker)
//   2. what the PACK declares        -> the local manifest, for files not
//                                       installed yet (a local pack that has
//                                       never been installed has no marker at
//                                       all, so this is the only source)
//   3. what the mod IS               -> Modrinth (name, icon, author)
//
// (3) needs a project id. A local manifest carries one. The marker does NOT —
// `ManagedSource::Modrinth` records only a version id — so an installed managed
// pack has to go version ids -> projects first. That extra hop is why this is a
// hook and not three inline effects.

export type ContentRow = {
  path: string
  fileName: string
  size: number
  isMod: boolean
  optional: boolean
  enabled: boolean
  installed: boolean
  kind: "modrinth" | "curseforge" | "url" | "override"
  projectId?: string
  versionId?: string
  /** Display name: the project's title when we know it, else the filename. */
  name: string
  iconUrl?: string
  author?: string
  versionLabel?: string
  /** Set when a newer version exists for this pack's Minecraft/loader pair.
   *  `fromLabel` is absent when the pinned version is not in the project's
   *  current list for this pair (withdrawn, or built for another loader) —
   *  the review list falls back to the filename it has. */
  update?: { versionId: string; label: string; fileName: string; fromLabel?: string }
}

export type ContentCategory = "all" | "mod" | "shader" | "resourcepack" | "update"

export function categoryOf(row: ContentRow): Exclude<ContentCategory, "all" | "update"> | "other" {
  const path = row.path.toLowerCase()
  if (path.startsWith("shaderpacks/")) return "shader"
  if (path.startsWith("resourcepacks/")) return "resourcepack"
  if (row.isMod || path.startsWith("mods/")) return "mod"
  return "other"
}

function fileNameOf(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path
}

/** Modrinth's CDN encodes the file's identity in its download URL. Packs
 *  imported before the importer learned to keep that identity (mrpack.rs
 *  `source_of`) still carry plain `url` sources; deriving the ids here is what
 *  gives those EXISTING packs names, icons and update checks without asking
 *  the player to re-import anything. */
const MODRINTH_CDN = /^https:\/\/cdn\.modrinth\.com\/data\/([^/]+)\/versions\/([^/]+)\/./

function modrinthIdsOf(url: unknown): { projectId: string; versionId: string } | null {
  if (typeof url !== "string") return null
  const match = MODRINTH_CDN.exec(url)
  return match ? { projectId: match[1], versionId: match[2] } : null
}

/** Manifest entries the marker does not know about — a pack file that has not
 *  been installed yet. Typed loosely because this is the raw manifest shape. */
type ManifestFile = {
  path: string
  fileSize: number
  source: { kind: string; projectId?: unknown; versionId?: unknown; url?: unknown }
}

export function usePackContent(slug: string, isLocal: boolean, active: boolean) {
  const t = useT("content")
  const [rows, setRows] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!active) return
    let live = true
    setLoading(true)

    void (async () => {
      const installed = await instanceContent(slug)
      const byPath = new Map<string, ContentRow>()

      const push = (row: ContentRow) => {
        const key = row.path.toLowerCase()
        // The marker wins over the manifest: it knows enabled/installed, which
        // the manifest cannot.
        if (!byPath.has(key)) byPath.set(key, row)
      }

      for (const file of installed) {
        push(rowOf(file))
      }

      // A local pack's manifest is the authority on what the pack CONTAINS;
      // without this a freshly built pack shows an empty Content tab until its
      // first install.
      if (isLocal) {
        const manifest = await localPackGet(slug).catch(() => null)
        for (const raw of (manifest?.version?.files ?? []) as unknown as ManifestFile[]) {
          const path = raw.path.replace(/\\/g, "/")
          const derived = raw.source?.kind === "url" ? modrinthIdsOf(raw.source.url) : null
          push({
            path,
            fileName: fileNameOf(path),
            size: raw.fileSize ?? 0,
            isMod: path.toLowerCase().startsWith("mods/"),
            optional: false,
            enabled: true,
            installed: false,
            kind: derived ? "modrinth" : ((raw.source?.kind ?? "url") as ContentRow["kind"]),
            projectId:
              raw.source?.projectId === undefined
                ? derived?.projectId
                : String(raw.source.projectId),
            versionId:
              raw.source?.versionId === undefined
                ? derived?.versionId
                : String(raw.source.versionId),
            name: fileNameOf(path),
          })
        }
      }

      let list = [...byPath.values()]

      // The marker records a version id and no project, so resolve the missing
      // project ids in one batch rather than one request per row.
      const orphanVersions = list
        .filter((r) => r.kind === "modrinth" && !r.projectId && r.versionId)
        .map((r) => r.versionId as string)
      if (orphanVersions.length > 0) {
        const versions = await catalogVersionsByIds(orphanVersions)
        const projectOf = new Map<string, string>()
        for (const version of versions) {
          // Only `catalog_versions_by_ids` fills projectId — it is the one
          // lookup that starts from a version rather than from a project.
          if (version.projectId) projectOf.set(version.fileId, version.projectId)
        }
        list = list.map((r) =>
          r.versionId && projectOf.has(r.versionId)
            ? { ...r, projectId: projectOf.get(r.versionId) }
            : r,
        )
      }

      const projectIds = [...new Set(list.map((r) => r.projectId).filter(Boolean))] as string[]
      if (projectIds.length > 0) {
        const summaries = await catalogProjectSummaries(projectIds)
        const meta = new Map(summaries.map((s) => [s.projectId, s]))
        list = list.map((r) => {
          const hit = r.projectId ? meta.get(r.projectId) : undefined
          return hit ? { ...r, name: hit.name, iconUrl: hit.iconUrl, author: hit.author } : r
        })
      }

      if (live) {
        setRows(list)
        setLoading(false)
      }
    })()

    return () => {
      live = false
    }
  }, [slug, isLocal, active, nonce])

  return { rows, loading, reload, setRows }
}

function rowOf(file: ContentFile): ContentRow {
  const path = file.path.replace(/\\/g, "/")
  const kind = file.source.kind as ContentRow["kind"]
  // Same derivation as the manifest pass: an instance installed from a
  // pre-`source_of` import carries `url` markers for what are really
  // Modrinth files.
  const derived = file.source.kind === "url" ? modrinthIdsOf(file.source.url) : null
  return {
    path,
    fileName: fileNameOf(path),
    size: file.size,
    isMod: file.isMod,
    optional: file.optional,
    enabled: file.enabled,
    installed: file.installed,
    kind: derived ? "modrinth" : kind,
    versionId:
      file.source.kind === "modrinth" ? file.source.versionId : derived?.versionId,
    projectId:
      file.source.kind === "curseforge" ? String(file.source.projectId) : derived?.projectId,
    name: fileNameOf(path),
  }
}

/** Check every Modrinth-sourced row for a newer version. Local packs only —
 *  a managed pack's versions are the server's to choose, and offering an
 *  update the player cannot take is noise.
 *
 *  The whole version list is fetched rather than just the newest one, because
 *  "different from what we have" is NOT the same question as "newer than what
 *  we have". `catalog_latest_version` prefers the newest *release*, so a pack
 *  pinned to a beta that is newer than every release used to be offered that
 *  release as an "Actualización" — a silent downgrade, and one that came back
 *  every single time the player checked. Comparing publish dates is what makes
 *  the offer directional. */
export async function findUpdates(
  rows: ContentRow[],
  minecraft: string,
  loader: string | null,
): Promise<Map<string, ContentRow["update"]>> {
  const catalogLoader = catalogLoaderOf(loader ?? "")
  const out = new Map<string, ContentRow["update"]>()

  const candidates = rows.filter((r) => r.kind === "modrinth" && r.projectId && r.versionId)
  // Sequential on purpose: twenty parallel requests is exactly the burst that
  // gets a launcher rate-limited by Modrinth.
  for (const row of candidates) {
    const versions = await catalogVersions(row.projectId as string, {
      gameVersion: minecraft,
      loader: catalogLoader,
    })
    if (versions.length === 0) continue

    // Same preference as before: a beta is only offered when the pair has no
    // release at all, since moving a player onto a prerelease is not an update.
    const candidate =
      versions.find((v) => v.releaseType === "release") ?? versions[0]
    if (!candidate || candidate.fileId === row.versionId) continue

    // The pinned version may be absent from this list — it can be for another
    // loader, or withdrawn. Then there is no date to compare against and the
    // offer stands: something is off about that pin either way, and the player
    // is better off seeing the current file than not.
    const current = versions.find((v) => v.fileId === row.versionId)
    if (current && Date.parse(candidate.datePublished) <= Date.parse(current.datePublished)) {
      continue
    }

    out.set(row.path, {
      versionId: candidate.fileId,
      label: candidate.versionNumber ?? candidate.displayName,
      fileName: candidate.fileName,
      fromLabel: current?.versionNumber ?? current?.displayName,
    })
  }
  return out
}
