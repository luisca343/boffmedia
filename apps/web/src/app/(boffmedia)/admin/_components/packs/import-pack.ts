import JSZip from "jszip"
import { PacksService, type PackLoader } from "@/services/api/boffmedia/packsService"
import type { SelectedMod } from "./mod-selector"
import { overrideFileEntry, uploadOverrideBlob } from "./upload-blob"

// Importing an existing pack archive. Two formats, and they differ in the one
// way that matters here: a .mrpack lists sha512 + size + download URL for every
// mod, so nothing has to be downloaded; a CurseForge zip lists only project and
// file ids, so every entry costs a server-side download to be hashed.

export type ImportResult = {
  name: string
  minecraft: string
  loader: PackLoader | ""
  loaderVersion: string
  mods: SelectedMod[]
  /** Entries the archive named but that could not be turned into a manifest
   *  entry — never silently dropped. */
  skipped: string[]
}

interface MrpackIndex {
  name?: string
  versionId?: string
  dependencies?: Record<string, string>
  files?: {
    path?: string
    hashes?: { sha512?: string }
    downloads?: string[]
    fileSize?: number
    env?: { client?: string; server?: string }
  }[]
}

interface CurseforgeManifest {
  name?: string
  version?: string
  minecraft?: {
    version?: string
    modLoaders?: { id?: string; primary?: boolean }[]
  }
  files?: { projectID?: number; fileID?: number; required?: boolean }[]
  overrides?: string
}

const LOADER_KEYS: PackLoader[] = ["forge", "neoforge", "fabric-loader", "quilt-loader"]

/** CurseForge writes the loader as one string, "neoforge-21.4.30". */
function splitCurseforgeLoader(id: string): { loader: PackLoader | ""; version: string } {
  const dash = id.indexOf("-")
  if (dash < 0) return { loader: "", version: "" }
  const head = id.slice(0, dash)
  const version = id.slice(dash + 1)
  const loader: PackLoader | "" =
    head === "forge" || head === "neoforge"
      ? head
      : head === "fabric"
        ? "fabric-loader"
        : head === "quilt"
          ? "quilt-loader"
          : ""
  return { loader, version }
}

function stripOverridePrefix(path: string): string | null {
  for (const prefix of ["overrides/", "client-overrides/"]) {
    if (path.startsWith(prefix)) return path.slice(prefix.length)
  }
  // server-overrides/ belongs to a server install and must NOT ship to players.
  return null
}

export async function parsePackArchive(
  file: File,
  onProgress: (message: string) => void,
): Promise<ImportResult | { error: string }> {
  const zip = await JSZip.loadAsync(file).catch(() => null)
  if (!zip) return { error: "notAZip" }

  const mrpack = zip.file("modrinth.index.json")
  const curseforge = zip.file("manifest.json")
  if (mrpack) return importMrpack(zip, mrpack, onProgress)
  if (curseforge) return importCurseforge(zip, curseforge, onProgress)
  return { error: "unknownFormat" }
}

async function importMrpack(
  zip: JSZip,
  indexFile: JSZip.JSZipObject,
  onProgress: (message: string) => void,
): Promise<ImportResult | { error: string }> {
  const index = JSON.parse(await indexFile.async("string")) as MrpackIndex
  const deps = index.dependencies ?? {}
  const loader = LOADER_KEYS.find((key) => deps[key]) ?? ""

  const mods: SelectedMod[] = []
  const skipped: string[] = []

  for (const entry of index.files ?? []) {
    const url = entry.downloads?.[0]
    const sha512 = entry.hashes?.sha512
    // A client-unsupported file is dead weight in a client pack.
    if (entry.env?.client === "unsupported") continue
    if (!entry.path || !url || !sha512) {
      skipped.push(entry.path ?? "?")
      continue
    }
    mods.push({
      // The archive already carries the hash the manifest needs, so this skips
      // the resolve round-trip entirely.
      key: `url:${url}`,
      path: entry.path,
      sha512,
      fileSize: entry.fileSize ?? 0,
      source: { kind: "url", url },
      name: entry.path.split("/").pop() ?? entry.path,
      platform: "url",
      fileName: entry.path.split("/").pop() ?? entry.path,
    })
  }

  const overrides = await uploadOverrides(zip, onProgress, skipped)
  return {
    name: index.name ?? index.versionId ?? "",
    minecraft: deps.minecraft ?? "",
    loader,
    loaderVersion: loader ? (deps[loader] ?? "") : "",
    mods: [...mods, ...overrides],
    skipped,
  }
}

async function importCurseforge(
  zip: JSZip,
  manifestFile: JSZip.JSZipObject,
  onProgress: (message: string) => void,
): Promise<ImportResult | { error: string }> {
  const manifest = JSON.parse(await manifestFile.async("string")) as CurseforgeManifest
  const primary =
    manifest.minecraft?.modLoaders?.find((l) => l.primary) ?? manifest.minecraft?.modLoaders?.[0]
  const { loader, version } = splitCurseforgeLoader(primary?.id ?? "")

  const mods: SelectedMod[] = []
  const skipped: string[] = []
  const files = manifest.files ?? []

  for (const [index, entry] of files.entries()) {
    if (!entry.projectID || !entry.fileID) {
      skipped.push(String(entry.projectID ?? "?"))
      continue
    }
    // Every CurseForge entry costs a full server-side download: the manifest
    // needs sha512 and CurseForge publishes only sha1/md5.
    onProgress(`${index + 1}/${files.length}`)
    const res = await PacksService.resolveFile({
      kind: "curseforge",
      projectId: entry.projectID,
      fileId: entry.fileID,
    })
    if (!res.success || !res.data) {
      skipped.push(String(entry.projectID))
      continue
    }
    const fileName = res.data.fileName
    mods.push({
      key: `curseforge:${entry.projectID}:${entry.fileID}`,
      path: `mods/${fileName}`,
      sha512: res.data.sha512,
      fileSize: res.data.fileSize,
      source: res.data.source,
      name: fileName,
      platform: "curseforge",
      fileName,
      projectId: String(entry.projectID),
    })
  }

  const overrides = await uploadOverrides(zip, onProgress, skipped, manifest.overrides)
  return {
    name: manifest.name ?? manifest.version ?? "",
    minecraft: manifest.minecraft?.version ?? "",
    loader,
    loaderVersion: version,
    mods: [...mods, ...overrides],
    skipped,
  }
}

/** Everything under overrides/ is OUR bytes: it has to be uploaded as a blob
 *  before a manifest can reference it. */
async function uploadOverrides(
  zip: JSZip,
  onProgress: (message: string) => void,
  skipped: string[],
  folder?: string,
): Promise<SelectedMod[]> {
  const prefix = folder ? `${folder.replace(/\/+$/, "")}/` : null
  const entries: { path: string; zipEntry: JSZip.JSZipObject }[] = []

  zip.forEach((path, zipEntry) => {
    if (zipEntry.dir) return
    const inner = prefix
      ? path.startsWith(prefix)
        ? path.slice(prefix.length)
        : null
      : stripOverridePrefix(path)
    if (inner) entries.push({ path: inner, zipEntry })
  })

  const uploaded: SelectedMod[] = []
  for (const [index, entry] of entries.entries()) {
    onProgress(`${index + 1}/${entries.length} · ${entry.path}`)
    const blob = await entry.zipEntry.async("blob")
    const result = await uploadOverrideBlob(blob)
    if (!result.ok) {
      skipped.push(entry.path)
      continue
    }
    const manifestEntry = overrideFileEntry(entry.path, result.sha512, result.fileSize)
    uploaded.push({
      key: `override:${result.sha512}:${entry.path}`,
      path: manifestEntry.path,
      sha512: manifestEntry.sha512,
      fileSize: manifestEntry.fileSize,
      source: manifestEntry.source,
      name: entry.path.split("/").pop() ?? entry.path,
      platform: "override",
      fileName: entry.path.split("/").pop() ?? entry.path,
    })
  }
  return uploaded
}
