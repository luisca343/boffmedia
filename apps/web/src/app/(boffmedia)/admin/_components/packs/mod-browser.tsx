"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Icon, Input, Select, Seg, Spinner, cn } from "@boffmedia/ui"
import {
  type CatalogCategory,
  type CatalogLoader,
  type CatalogProjectType,
  type CatalogSort,
  type ModFile,
  type ModPlatform,
  type ModProject,
  type ModSearchHit,
  PacksService,
} from "@/services/api/boffmedia/packsService"

// The browse half of the picker: catalog on the left, project detail on the
// right. Everything is filtered by the version's Minecraft/loader pair, which
// is the whole reason a mod picked here is guaranteed to be installable.

const PAGE_SIZE = 20

export type BrowsePick = { hit: ModSearchHit; file: ModFile }

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
  platform,
  onPlatformChange,
  gameVersion,
  loader,
  isAdded,
  onAdd,
  busyKey,
}: {
  platform: ModPlatform
  onPlatformChange: (platform: ModPlatform) => void
  gameVersion: string
  loader?: CatalogLoader
  isAdded: (platform: ModPlatform, projectId: string) => boolean
  onAdd: (pick: BrowsePick) => void | Promise<void>
  busyKey: string | null
}) {
  const t = useTranslations("admin.packs")
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [projectType, setProjectType] = useState<CatalogProjectType>("mod")
  const [sort, setSort] = useState<CatalogSort>("downloads")
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
    void PacksService.categories(platform, projectType).then((res) => {
      if (!live) return
      setCategories(res.success && res.data ? res.data : [])
    })
    return () => {
      live = false
    }
  }, [platform, projectType])

  useEffect(() => {
    if (!gameVersion) {
      setHits([])
      setTotal(0)
      return
    }
    const seq = ++searchSeq.current
    setLoading(true)
    void PacksService.searchMods({
      platform,
      query: debounced || undefined,
      gameVersion,
      // Resource packs and shaders have no loader, and sending one filters
      // every result away.
      loader: projectType === "mod" ? loader : undefined,
      sort,
      category: category || undefined,
      projectType,
      page,
      pageSize: PAGE_SIZE,
    }).then((res) => {
      if (seq !== searchSeq.current) return
      const data = res.success && res.data ? res.data : { hits: [], total: 0 }
      setHits((current) => (page === 0 ? data.hits : [...current, ...data.hits]))
      setTotal(data.total)
      setLoading(false)
    })
  }, [platform, debounced, gameVersion, loader, sort, category, projectType, page])

  const canLoadMore = hits.length > 0 && hits.length < total && !loading

  if (!gameVersion) {
    return (
      <p className="border border-solid border-line bg-panel px-3 py-4 font-body text-[12px] text-txt-dim">
        {t("needMinecraftLead")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Seg
          value={platform}
          onChange={(v) => {
            onPlatformChange(v as ModPlatform)
            setSelected(null)
          }}
          options={[
            { value: "modrinth", label: t("platformModrinth") },
            { value: "curseforge", label: t("platformCurseforge") },
          ]}
        />
        <div className="min-w-[200px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("modSearchPlaceholder")}
          />
        </div>
        <div className="w-[150px]">
          <Select
            value={projectType}
            onChange={(v) => setProjectType(v as CatalogProjectType)}
            ariaLabel={t("projectType")}
            options={[
              { value: "mod", label: t("type.mod") },
              { value: "resourcepack", label: t("type.resourcepack") },
              { value: "shader", label: t("type.shader") },
              { value: "datapack", label: t("type.datapack") },
            ]}
          />
        </div>
        <div className="w-[150px]">
          <Select
            value={sort}
            onChange={(v) => setSort(v as CatalogSort)}
            ariaLabel={t("sort")}
            options={[
              { value: "downloads", label: t("sortBy.downloads") },
              { value: "follows", label: t("sortBy.follows") },
              { value: "updated", label: t("sortBy.updated") },
              { value: "relevance", label: t("sortBy.relevance") },
              { value: "name", label: t("sortBy.name") },
            ]}
          />
        </div>
        {loading && <Spinner size={16} className="text-txt-muted" />}
      </div>

      <div className="flex gap-3">
        <aside className="hidden w-[170px] shrink-0 flex-col gap-1 md:flex">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
            {t("categories")}
          </span>
          <ul className="flex max-h-[420px] flex-col overflow-auto">
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

        <div className="min-w-0 flex-1">
          {hits.length === 0 && !loading ? (
            <p className="border border-solid border-line bg-panel px-3 py-4 font-body text-[12px] text-txt-dim">
              {t("noModResults")}
            </p>
          ) : (
            <>
              <ul className="grid max-h-[420px] gap-2 overflow-auto sm:grid-cols-2">
                {hits.map((hit) => {
                  const added = isAdded(hit.platform, hit.projectId)
                  return (
                    <li key={`${hit.platform}:${hit.projectId}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(hit)}
                        className={cn(
                          "flex w-full items-start gap-2 border border-solid bg-panel px-2 py-2 text-left",
                          selected?.projectId === hit.projectId ? "border-acc" : "border-line",
                        )}
                      >
                        {hit.iconUrl ? (
                          // Remote catalog art: no next/image loader is
                          // configured for the CurseForge/Modrinth CDNs.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={hit.iconUrl}
                            alt=""
                            className="size-10 shrink-0 border border-solid border-line object-cover"
                          />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center border border-solid border-line text-txt-dim">
                            <Icon name="cube" size={16} />
                          </span>
                        )}
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
                          <span className="line-clamp-2 font-body text-[11px] text-txt-dim">
                            {hit.summary}
                          </span>
                          <span className="flex items-center gap-2 font-mono text-[10px] text-txt-muted">
                            <Icon name="download" size={11} />
                            {compactCount(hit.downloads)}
                            {hit.author ? ` · ${hit.author}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {canLoadMore && (
                <div className="mt-2 flex justify-center">
                  <Button size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)}>
                    {t("loadMore", { shown: hits.length, total })}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <ProjectDetail
          hit={selected}
          gameVersion={gameVersion}
          loader={projectType === "mod" ? loader : undefined}
          onClose={() => setSelected(null)}
          onAdd={onAdd}
          busyKey={busyKey}
        />
      )}
    </div>
  )
}

function ProjectDetail({
  hit,
  gameVersion,
  loader,
  onClose,
  onAdd,
  busyKey,
}: {
  hit: ModSearchHit
  gameVersion: string
  loader?: CatalogLoader
  onClose: () => void
  onAdd: (pick: BrowsePick) => void | Promise<void>
  busyKey: string | null
}) {
  const t = useTranslations("admin.packs")
  const [project, setProject] = useState<ModProject | null>(null)
  const [files, setFiles] = useState<ModFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllFiles, setShowAllFiles] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true)
    setProject(null)
    setFiles([])
    const filesRequest =
      hit.platform === "curseforge"
        ? PacksService.curseforgeFiles(hit.projectId, {
            gameVersion: showAllFiles ? undefined : gameVersion,
            loader: showAllFiles ? undefined : loader,
            pageSize: 50,
          })
        : PacksService.modrinthVersions(hit.projectId, {
            gameVersion: showAllFiles ? undefined : gameVersion,
            loader: showAllFiles ? undefined : loader,
          })

    void Promise.all([PacksService.project(hit.platform, hit.projectId), filesRequest]).then(
      ([detail, fileRes]) => {
        if (!live) return
        setProject(detail.success && detail.data ? detail.data : null)
        setFiles(fileRes.success && fileRes.data ? fileRes.data : [])
        setLoading(false)
      },
    )
    return () => {
      live = false
    }
  }, [hit.platform, hit.projectId, gameVersion, loader, showAllFiles])

  const description = project ? toPlainText(project.description || project.summary) : ""

  return (
    <div className="flex flex-col gap-3 border border-solid border-acc bg-panel px-3 py-3">
      <div className="flex items-start gap-3">
        {hit.iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hit.iconUrl}
            alt=""
            className="size-12 shrink-0 border border-solid border-line object-cover"
          />
        )}
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
                    {file.gameVersions.filter((v) => /^\d/.test(v)).slice(0, 3).join(", ")}
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
