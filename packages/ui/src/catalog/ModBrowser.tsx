"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "../cn"
import type { Translate } from "../i18n"
import { Badge } from "../primitives/badge"
import { Button } from "../primitives/button"
import { Icon } from "../primitives/icon"
import { Input } from "../primitives/input"
import { Seg } from "../primitives/seg"
import { Select } from "../primitives/select"
import { Spinner } from "../primitives/spinner"
import { CatalogIcon } from "./CatalogIcon"
import { getCatalog } from "./client"
import type {
  CatalogCategory,
  CatalogLoader,
  CatalogProjectType,
  CatalogSort,
  ModFile,
  ModPlatform,
  ModProject,
  ModSearchHit,
} from "./types"

// The browse half of the picker: catalog on the left, project detail on the
// right. Everything is filtered by the pack's Minecraft/loader pair, which is
// the whole reason a mod picked here is guaranteed to be installable.
//
// `t` is a prop rather than `useT()` on purpose: the ui runtime's translator is
// bound to the primitives namespace, and these strings live in each host's own
// namespace (or, in the launcher, in a plain dictionary).

// 50, not 20: at ~260px per card a wide window fits three or four per row, so
// twenty results left the grid visibly half-empty and made the first scroll a
// click. Modrinth's own ceiling is 100, but that is 100 icon fetches on a cold
// cache for results most players never scroll to.
const PAGE_SIZE = 50

const ALL_PLATFORMS: ModPlatform[] = ["modrinth", "curseforge"]
const ALL_SORTS: CatalogSort[] = ["downloads", "follows", "updated", "relevance", "name"]
const ALL_TYPES: CatalogProjectType[] = ["mod", "resourcepack", "shader", "datapack"]

/** `projectType` is the browser's current tab, carried on the pick because the
 *  target folder cannot be derived from the file alone: a shader and a resource
 *  pack are both a `.zip`, and only the tab the player picked from says which
 *  one this is. */
export type BrowsePick = {
  hit: ModSearchHit
  file: ModFile
  projectType: CatalogProjectType
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function compactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

/** Strips the HTML CurseForge returns for its description; Modrinth's markdown
 *  survives this unchanged apart from its (rare) inline tags. */
function toPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function ModBrowser({
  t,
  platform,
  onPlatformChange,
  platforms = ALL_PLATFORMS,
  sorts = ALL_SORTS,
  projectTypes = ALL_TYPES,
  gameVersion,
  loader,
  isAdded,
  onAdd,
  busyKey,
}: {
  t: Translate
  platform: ModPlatform
  onPlatformChange: (platform: ModPlatform) => void
  /** Which platforms this host can actually reach. With one entry the toggle
   *  is hidden rather than rendered as a single dead button — the launcher
   *  only ever speaks to Modrinth. */
  platforms?: ModPlatform[]
  /** Not every platform supports every sort (Modrinth has no name sort), so
   *  the host narrows the list instead of the browser offering a dead option. */
  sorts?: CatalogSort[]
  projectTypes?: CatalogProjectType[]
  /** The pack's target Minecraft version. Required for every type except
   *  `modpack`, which brings its own — see `needsGameVersion`. */
  gameVersion: string
  loader?: CatalogLoader
  isAdded: (platform: ModPlatform, projectId: string) => boolean
  onAdd: (pick: BrowsePick) => void | Promise<void>
  busyKey: string | null
}) {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [projectType, setProjectType] = useState<CatalogProjectType>(projectTypes[0] ?? "mod")
  const [sort, setSort] = useState<CatalogSort>(sorts[0] ?? "downloads")
  const [category, setCategory] = useState("")
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [hits, setHits] = useState<ModSearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ModSearchHit | null>(null)

  const searchSeq = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query])

  // Any filter change restarts paging: appending page 2 of the new filters to
  // page 1 of the old ones is how a picker shows mods that do not match.
  useEffect(() => {
    setPage(0)
    setHits([])
  }, [debounced, platform, projectType, sort, category, gameVersion, loader])

  useEffect(() => {
    setCategory("")
    let live = true
    void getCatalog()
      .categories(platform, projectType)
      .then((res) => {
        if (live) setCategories(res)
      })
      .catch(() => {
        if (live) setCategories([])
      })
    return () => {
      live = false
    }
  }, [platform, projectType])

  // A modpack DEFINES its Minecraft version rather than targeting one, so it
  // is the one type that can be browsed before a version is chosen. Everything
  // else filters by it, and searching without it returns mods that will not
  // load.
  const needsGameVersion = projectType !== "modpack"

  useEffect(() => {
    if (needsGameVersion && !gameVersion) {
      setHits([])
      setTotal(0)
      return
    }
    const seq = ++searchSeq.current
    setLoading(true)
    void getCatalog()
      .search({
        platform,
        query: debounced || undefined,
        gameVersion: gameVersion || undefined,
        // Resource packs and shaders have no loader, and sending one filters
        // every result away.
        loader: projectType === "mod" ? loader : undefined,
        sort,
        category: category || undefined,
        projectType,
        page,
        pageSize: PAGE_SIZE,
      })
      .catch(() => ({ hits: [], total: 0 }))
      .then((data) => {
        if (seq !== searchSeq.current) return
        setHits((current) => (page === 0 ? data.hits : [...current, ...data.hits]))
        setTotal(data.total)
        setLoading(false)
      })
  }, [platform, debounced, gameVersion, loader, sort, category, projectType, page, needsGameVersion])

  // ProjectDetail knows the hit and the file but not which tab they came from,
  // so the browser stamps the type on the way out. One place, rather than a
  // prop threaded through both ProjectDetail mounts.
  const addPick = (pick: { hit: ModSearchHit; file: ModFile }) =>
    onAdd({ ...pick, projectType })

  const canLoadMore = hits.length > 0 && hits.length < total && !loading

  // Infinite scroll. The sentinel sits after the last card INSIDE the grid,
  // which is the element that actually scrolls (the page itself never grows),
  // so that element has to be the observer root — against the viewport the
  // sentinel would never intersect and the grid would simply stop at page 1.
  //
  // `canLoadMore` is in the dependency list rather than read inside the
  // callback: it is what goes false the moment a page starts loading, and
  // re-running the effect is what disconnects the observer for the duration.
  // Without that, one flick of the wheel queues three pages at once.
  const listRef = useRef<HTMLUListElement | null>(null)
  const sentinelRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    const root = listRef.current
    const target = sentinelRef.current
    if (!root || !target || !canLoadMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setPage((p) => p + 1)
      },
      // A page ahead of the fold, so the next batch is usually already there
      // by the time the player reaches the bottom.
      { root, rootMargin: "600px 0px" },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [canLoadMore])

  if (needsGameVersion && !gameVersion) {
    return (
      <p className="border border-solid border-line bg-panel px-3 py-4 font-body text-[12px] text-txt-dim">
        {t("needMinecraftLead")}
      </p>
    )
  }

  return (
    // flex-1 rather than h-full: the selector column also holds a progress
    // line, and 100% height would overflow it whenever that line shows.
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {platforms.length > 1 && (
          <Seg
            value={platform}
            onChange={(v) => {
              onPlatformChange(v as ModPlatform)
              setSelected(null)
            }}
            options={platforms.map((p) => ({
              value: p,
              label: p === "modrinth" ? t("platformModrinth") : t("platformCurseforge"),
            }))}
          />
        )}
        <div className="min-w-[200px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("modSearchPlaceholder")}
          />
        </div>
        {projectTypes.length > 1 && (
          <div className="w-[150px]">
            <Select
              value={projectType}
              onChange={(v) => setProjectType(v as CatalogProjectType)}
              ariaLabel={t("projectType")}
              options={projectTypes.map((p) => ({ value: p, label: t(`type.${p}`) }))}
            />
          </div>
        )}
        <div className="w-[150px]">
          <Select
            value={sort}
            onChange={(v) => setSort(v as CatalogSort)}
            ariaLabel={t("sort")}
            options={sorts.map((s) => ({ value: s, label: t(`sortBy.${s}`) }))}
          />
        </div>
        {loading && <Spinner size={16} className="text-txt-muted" />}
      </div>

      {/* The three panes each own their scroll, so the page itself never grows:
          categories · results · the selected project. */}
      <div className="flex min-h-0 flex-1 gap-3">
        <aside className="hidden w-[180px] shrink-0 flex-col gap-1 md:flex">
          <span className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
            {t("categories")}
          </span>
          <ul className="bm-scroll flex min-h-0 flex-1 flex-col overflow-auto">
            <li>
              <button
                type="button"
                onClick={() => setCategory("")}
                className={cn(
                  "w-full px-2 py-[5px] text-left font-body text-[12px]",
                  category === "" ? "bg-panel-2 text-acc" : "text-txt-dim hover:text-txt",
                )}
              >
                {t("allCategories")}
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "w-full truncate px-2 py-[5px] text-left font-body text-[12px] capitalize",
                    category === c.id ? "bg-panel-2 text-acc" : "text-txt-dim hover:text-txt",
                  )}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {hits.length === 0 && !loading ? (
            <p className="border border-solid border-line bg-panel px-3 py-4 font-body text-[12px] text-txt-dim">
              {t("noModResults")}
            </p>
          ) : (
            <>
              {/* auto-fill, not a fixed column count: a 2560px screen shows five
                  cards per row instead of two very wide ones. */}
              <ul
                ref={listRef}
                className="bm-scroll grid min-h-0 flex-1 auto-rows-min content-start gap-2 overflow-auto pr-1 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]"
              >
                {hits.map((hit) => {
                  const added = isAdded(hit.platform, hit.projectId)
                  return (
                    <li key={`${hit.platform}:${hit.projectId}`} className="h-full">
                      <button
                        type="button"
                        onClick={() => setSelected(hit)}
                        className={cn(
                          "flex h-full w-full items-start gap-2 border border-solid bg-panel px-2 py-2 text-left",
                          selected?.projectId === hit.projectId ? "border-acc" : "border-line",
                        )}
                      >
                        <CatalogIcon src={hit.iconUrl} size={40} />
                        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                          <span className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                              {hit.name}
                            </span>
                            {added && (
                              <Badge tone="ok" className="shrink-0">
                                {t("added")}
                              </Badge>
                            )}
                          </span>
                          <span className="line-clamp-1 font-body text-[11px] text-txt-dim">
                            {hit.summary}
                          </span>
                          <span className="mt-auto flex items-center gap-2 font-mono text-[10px] text-txt-muted">
                            <Icon name="download" size={11} />
                            {compactCount(hit.downloads)}
                            {hit.author ? ` · ${hit.author}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
                {/* Zero-height and spanning every column so it never disturbs
                    the grid's flow, but still a real box the observer can see. */}
                <li ref={sentinelRef} aria-hidden className="col-span-full h-px" />
              </ul>
              {/* Kept as a fallback, not as the primary affordance: the
                  observer normally fires first, and this is what a player who
                  reaches the bottom mid-fetch (or on a host without
                  IntersectionObserver) still has to click. */}
              {canLoadMore && (
                <div className="mt-2 flex shrink-0 justify-center">
                  <Button size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)}>
                    {t("loadMore", { shown: hits.length, total })}
                  </Button>
                </div>
              )}
              {loading && hits.length > 0 && (
                <div className="mt-2 flex shrink-0 justify-center">
                  <Spinner size={14} />
                </div>
              )}
            </>
          )}
        </div>

        {selected && (
          <div className="bm-scroll hidden min-h-0 w-[400px] shrink-0 overflow-auto lg:block 2xl:w-[480px]">
            <ProjectDetail
              t={t}
              hit={selected}
              gameVersion={needsGameVersion ? gameVersion : ""}
              loader={projectType === "mod" ? loader : undefined}
              onClose={() => setSelected(null)}
              onAdd={addPick}
              busyKey={busyKey}
            />
          </div>
        )}
      </div>

      {/* Below lg there is no room for a third pane, so the detail goes back
          under the results rather than vanishing. */}
      {selected && (
        <div className="shrink-0 lg:hidden">
          <ProjectDetail
            t={t}
            hit={selected}
            gameVersion={needsGameVersion ? gameVersion : ""}
            loader={projectType === "mod" ? loader : undefined}
            onClose={() => setSelected(null)}
            onAdd={addPick}
            busyKey={busyKey}
          />
        </div>
      )}
    </div>
  )
}

function ProjectDetail({
  t,
  hit,
  gameVersion,
  loader,
  onClose,
  onAdd,
  busyKey,
}: {
  t: Translate
  hit: ModSearchHit
  gameVersion: string
  loader?: CatalogLoader
  onClose: () => void
  /** Deliberately narrower than `BrowsePick`: the detail pane has no idea which
   *  tab it was opened from, and the browser stamps `projectType` on before
   *  handing the pick to the host. */
  onAdd: (pick: { hit: ModSearchHit; file: ModFile }) => void | Promise<void>
  busyKey: string | null
}) {
  const [project, setProject] = useState<ModProject | null>(null)
  const [files, setFiles] = useState<ModFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllFiles, setShowAllFiles] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    setProject(null)
    setFiles([])
    const catalog = getCatalog()

    void Promise.all([
      catalog.project(hit.platform, hit.projectId).catch(() => null),
      catalog
        .files(hit.platform, hit.projectId, {
          // An empty string is "no target version" (a modpack browse), not a
          // version to match — sending it would filter every file away.
          gameVersion: showAllFiles ? undefined : gameVersion || undefined,
          loader: showAllFiles ? undefined : loader,
          pageSize: 50,
        })
        .catch(() => [] as ModFile[]),
    ]).then(([detail, fileList]) => {
      if (!live) return
      setProject(detail)
      setFiles(fileList)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [hit.platform, hit.projectId, gameVersion, loader, showAllFiles])

  const description = project ? toPlainText(project.description || project.summary) : ""

  return (
    <div className="flex flex-col gap-3 border border-solid border-acc bg-panel px-3 py-3">
      <div className="flex items-start gap-3">
        <CatalogIcon src={hit.iconUrl} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-bold uppercase tracking-[0.03em]">
            {hit.name}
          </h3>
          <p className="font-body text-[12px] text-txt-dim">{hit.summary}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-txt-muted">
            {project?.clientSide && project.clientSide !== "unknown" && (
              <Badge tone={project.clientSide === "required" ? "info" : "warn"}>
                {t(`side.client.${project.clientSide}`)}
              </Badge>
            )}
            {project?.serverSide && project.serverSide !== "unknown" && (
              <Badge tone={project.serverSide === "required" ? "info" : "warn"}>
                {t(`side.server.${project.serverSide}`)}
              </Badge>
            )}
            {(project?.categories ?? hit.categories).slice(0, 5).map((c) => (
              <span key={c} className="capitalize">
                {c}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="shrink-0 font-mono text-[12px] text-txt-dim hover:text-txt"
        >
          ×
        </button>
      </div>

      {description && (
        <p className="max-h-[120px] overflow-auto whitespace-pre-line font-body text-[12px] text-txt-dim">
          {description}
        </p>
      )}

      {project && (project.sourceUrl || project.issuesUrl || project.websiteUrl) && (
        <div className="flex flex-wrap gap-3 font-mono text-[11px]">
          {project.sourceUrl && (
            <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="text-acc">
              {t("linkSource")}
            </a>
          )}
          {project.issuesUrl && (
            <a href={project.issuesUrl} target="_blank" rel="noreferrer" className="text-acc">
              {t("linkIssues")}
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="text-acc">
              {t("linkWebsite")}
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
          {t("files")}
        </span>
        <Seg
          value={showAllFiles ? "all" : "compatible"}
          onChange={(v) => setShowAllFiles(v === "all")}
          options={[
            { value: "compatible", label: t("compatibleOnly") },
            { value: "all", label: t("allFiles") },
          ]}
        />
      </div>

      {loading ? (
        <span className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
          <Spinner size={12} /> {t("loadingFiles")}
        </span>
      ) : files.length === 0 ? (
        <p className="font-body text-[12px] text-txt-dim">{t("noCompatibleFiles")}</p>
      ) : (
        <ul className="flex max-h-[220px] flex-col gap-1 overflow-auto">
          {files.map((file) => {
            const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
            const busy = busyKey === key
            const requiredDeps = file.dependencies.filter((d) => d.relation === "required").length
            return (
              <li
                key={file.fileId}
                className="flex flex-wrap items-center gap-2 border border-solid border-line bg-panel-2 px-2 py-[6px]"
              >
                <Badge tone={file.releaseType === "release" ? "ok" : "warn"} className="shrink-0">
                  {t(`releaseType.${file.releaseType}`)}
                </Badge>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-txt-muted">
                  {file.fileName}
                </span>
                {showAllFiles && (
                  <span className="shrink-0 font-mono text-[10px] text-txt-dim">
                    {file.gameVersions
                      .filter((v) => /^\d/.test(v))
                      .slice(0, 3)
                      .join(", ")}
                  </span>
                )}
                {requiredDeps > 0 && (
                  <Badge tone="info" className="shrink-0">
                    {t("depsCount", { count: requiredDeps })}
                  </Badge>
                )}
                <span className="shrink-0 font-mono text-[11px] text-txt-dim">
                  {formatSize(file.fileSize)}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-txt-dim">
                  {file.datePublished.slice(0, 10)}
                </span>
                {file.downloadable ? (
                  <Button
                    size="sm"
                    icon="plus"
                    loading={busy}
                    disabled={busyKey !== null}
                    onClick={() => void onAdd({ hit, file })}
                  >
                    {busy ? t("resolving") : t("addMod")}
                  </Button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-bad">
                    <Icon name="alert" size={12} />
                    {t("notDistributable")}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {files.some((f) => !f.downloadable) && (
        <p className="font-body text-[12px] text-bad">{t("notDistributableLead")}</p>
      )}
    </div>
  )
}
