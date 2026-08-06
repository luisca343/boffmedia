import type {
  CatalogCategory,
  CatalogFileFilters,
  CatalogLoader,
  CatalogProjectType,
  ModFile,
  ModPlatform,
  ModProject,
  ModSearchHit,
  ModSearchInput,
  ModSearchPage,
  ResolveSource,
  ResolvedFile,
} from "./types"

/** What a host must provide for `<ModBrowser>` to work. Every method returns
 *  the plain value, never an envelope: unwrapping `{success, data}` is the
 *  host adapter's job, so the browser has one shape to render and one failure
 *  mode (an empty list) rather than two. */
export interface CatalogClient {
  search(input: ModSearchInput): Promise<ModSearchPage>
  categories(platform: ModPlatform, projectType: CatalogProjectType): Promise<CatalogCategory[]>
  project(platform: ModPlatform, projectId: string): Promise<ModProject | null>
  /** Files for one project, newest first. Filters are the version's own
   *  Minecraft/loader pair — dropping them is what "show all files" does. */
  files(
    platform: ModPlatform,
    projectId: string,
    filters: CatalogFileFilters,
  ): Promise<ModFile[]>
  /** Batch name/icon lookup, used to label dependencies without one round
   *  trip per project. */
  projectSummaries(platform: ModPlatform, ids: string[]): Promise<ModSearchHit[]>
  /** Turn a catalog pick into a manifest-ready entry: sha512, size, filename
   *  and the FileSource. May be slow — some platforms have to stream the bytes
   *  to produce the hash. */
  resolve(source: ResolveSource): Promise<ResolvedFile | null>
  /** Optional: turn a remote icon URL into something this host can actually
   *  render. A browser needs nothing — it loads the URL directly. A Tauri
   *  webview does: its CSP forbids arbitrary remote hosts, so the launcher
   *  caches the bytes on disk and hands back an `asset:` URL instead. Absent
   *  means "use the URL as-is". */
  iconSrc?(remoteUrl: string): Promise<string | null>
  /** Optional: called when an icon URL was produced successfully but the host's
   *  webview then REFUSED to render it — a CSP rejection or a denied protocol
   *  scope, neither of which is observable from the code that resolved the URL.
   *  Without this hook the two halves fail in different places and both look
   *  identical from the outside: a placeholder cube. */
  onIconRenderFailure?(attemptedSrc: string, remoteUrl: string): void
}

// A module-level registry, matching `configureUi` — the browser is deep inside
// a tree that neither host wants to wrap in yet another provider.
let client: CatalogClient | null = null

/** Call once per module graph, at import time. */
export function configureCatalog(next: CatalogClient) {
  client = next
}

export function getCatalog(): CatalogClient {
  if (!client) {
    throw new Error("configureCatalog() was never called — no catalog client is registered.")
  }
  return client
}

/** The catalogs speak "fabric"/"quilt"; the manifest speaks "fabric-loader"/
 *  "quilt-loader". Sending the manifest id straight through returns nothing. */
export function catalogLoaderOf(loader: string): CatalogLoader | undefined {
  if (loader === "forge" || loader === "neoforge") return loader
  if (loader === "fabric-loader") return "fabric"
  if (loader === "quilt-loader") return "quilt"
  return undefined
}

/** Where a file belongs inside the instance. Shaders and resource packs in
 *  mods/ are simply not loaded by the game.
 *
 *  The project TYPE decides, not the extension, because the extension cannot:
 *  a shader and a resource pack are both a `.zip`, and routing on `.zip` alone
 *  put every shader in `resourcepacks/`, where the game silently ignores it.
 *  The extension is still the fallback for the one caller that has no type to
 *  offer — a raw URL the player pasted. */
export function defaultFolder(fileName: string, projectType?: CatalogProjectType): string {
  switch (projectType) {
    case "mod":
      return "mods"
    case "resourcepack":
      return "resourcepacks"
    case "shader":
      return "shaderpacks"
    // Datapacks are per-world (`saves/<world>/datapacks/`) and the pack has no
    // world to name, so they go to the instance-level folder that Fabric's
    // and NeoForge's global-datapack loaders read.
    case "datapack":
      return "datapacks"
    default:
      break
  }
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".jar")) return "mods"
  if (lower.endsWith(".zip")) return "resourcepacks"
  return "mods"
}

/** Newest downloadable file wins; the lists come back newest-first from both
 *  platforms, and a non-downloadable CurseForge file can never be installed. */
export function bestFile(files: ModFile[]): ModFile | undefined {
  return (
    files.find((f) => f.downloadable && f.releaseType === "release") ??
    files.find((f) => f.downloadable)
  )
}

export function resolveSourceOf(
  platform: ModPlatform,
  projectId: string,
  fileId: string,
): ResolveSource {
  return platform === "curseforge"
    ? { kind: "curseforge", projectId: Number(projectId), fileId: Number(fileId) }
    : { kind: "modrinth", projectId, versionId: fileId }
}
