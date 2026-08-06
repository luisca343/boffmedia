// The mod-catalog vocabulary, shared by every host that browses mods. It lives
// here rather than in a host's service layer because two very different hosts
// speak it: apps/web talks to our API's CurseForge+Modrinth proxy, and
// apps/launcher talks to Modrinth directly from Rust. Neither can import the
// other's types, and a drifting copy is how a picker starts silently dropping
// fields.

export type ModPlatform = "curseforge" | "modrinth"

/** The loader names both catalogs understand — not the manifest's loader ids
 *  ("fabric-loader"/"quilt-loader"), which is why callers must map. */
export type CatalogLoader = "forge" | "neoforge" | "fabric" | "quilt"

/** What a pack can contain besides jars. Each platform files these separately,
 *  so the picker has to ask for one type at a time.
 *
 *  `modpack` is the odd one out and is deliberately NOT in `ALL_TYPES`: it is
 *  not something you add TO a pack, it is a whole pack, so only a host that
 *  means to import one (the launcher) asks for it. Leaving it out of the
 *  default keeps it from appearing in the admin content picker, where choosing
 *  it would make no sense. */
export type CatalogProjectType = "mod" | "resourcepack" | "shader" | "datapack" | "modpack"

export type CatalogSort = "relevance" | "downloads" | "updated" | "name" | "follows"

export type SideSupport = "required" | "optional" | "unsupported" | "unknown"

export interface ModSearchHit {
  platform: ModPlatform
  /** String on both platforms; CurseForge's is numeric and is narrowed only
   *  when a FileSource is built. */
  projectId: string
  slug: string
  name: string
  summary: string
  iconUrl?: string
  downloads: number
  author?: string
  categories: string[]
  updatedAt?: string
  clientSide?: SideSupport
  serverSide?: SideSupport
}

export interface ModSearchPage {
  hits: ModSearchHit[]
  total: number
}

export interface ModProject extends ModSearchHit {
  /** Markdown on Modrinth, HTML on CurseForge. */
  description: string
  gameVersions: string[]
  loaders: string[]
  gallery: string[]
  sourceUrl?: string
  issuesUrl?: string
  websiteUrl?: string
  clientSide: SideSupport
  serverSide: SideSupport
}

export interface CatalogCategory {
  id: string
  name: string
  iconUrl?: string
}

export interface ModDependency {
  platform: ModPlatform
  projectId: string
  relation: "required" | "optional" | "incompatible" | "embedded"
  versionId?: string
  name?: string
  slug?: string
  iconUrl?: string
}

export interface ModFile {
  platform: ModPlatform
  /** CurseForge file id, or the Modrinth *version* id. */
  fileId: string
  /** The project this file belongs to. Present when the file was looked up BY
   *  version id rather than under a project — the install marker records only
   *  a version, so this is how a row gets back to its project. */
  projectId?: string
  versionNumber?: string
  displayName: string
  fileName: string
  fileSize: number
  gameVersions: string[]
  releaseType: "release" | "beta" | "alpha"
  datePublished: string
  sha512: string | null
  /** False when CurseForge's author forbids third-party distribution: the
   *  launcher can never fetch that file automatically. */
  downloadable: boolean
  loaders: string[]
  /** What must ship alongside this file. Skipping the required ones is what
   *  makes a pack crash at launch with a missing-library error. */
  dependencies: ModDependency[]
}

export interface ResolvedFile {
  sha512: string
  fileSize: number
  fileName: string
  /** The FileSource ready for the manifest. */
  source: unknown
}

export type ResolveSource =
  | { kind: "curseforge"; projectId: number; fileId: number }
  | { kind: "modrinth"; projectId: string; versionId: string }
  | { kind: "url"; url: string }

export interface ModSearchInput {
  platform: ModPlatform
  query?: string
  gameVersion?: string
  loader?: CatalogLoader
  page?: number
  pageSize?: number
  projectType?: CatalogProjectType
  sort?: CatalogSort
  /** CurseForge category id, or Modrinth category name. */
  category?: string
}

export interface CatalogFileFilters {
  gameVersion?: string
  loader?: CatalogLoader
  pageSize?: number
}
