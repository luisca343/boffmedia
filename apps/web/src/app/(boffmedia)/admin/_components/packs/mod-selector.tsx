"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Field, Icon, Input, Spinner, toast } from "@boffmedia/ui"
import {
  type CatalogLoader,
  type ModFile,
  type ModPlatform,
  type ModSearchHit,
  PacksService,
  type ResolveSource,
} from "@/services/api/boffmedia/packsService"
import { ModBrowser, type BrowsePick } from "./mod-browser"
import { overrideFileEntry, uploadOverrideBlob } from "./upload-blob"

/** A resolved PackFile plus the display metadata the picker needs. `path` is
 *  editable: `mods/` is only the default, some jars belong elsewhere. */
export type SelectedMod = {
  key: string
  path: string
  sha512: string
  fileSize: number
  source: unknown
  name: string
  platform: ModPlatform | "url" | "override"
  fileName: string
  versionLabel?: string
  /** Set when the entry was pulled in as somebody else's dependency, so the
   *  admin can tell it apart from a deliberate pick. */
  viaDependency?: boolean
  projectId?: string
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
 *  mods/ are simply not loaded by the game. */
function defaultFolder(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".jar")) return "mods"
  if (lower.endsWith(".zip")) return "resourcepacks"
  return "mods"
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function fileNameOfUrl(url: string): string {
  const tail = url.split("?")[0].split("/").filter(Boolean).pop()
  return tail || "file.jar"
}

function sourceOf(platform: ModPlatform, projectId: string, fileId: string): ResolveSource {
  return platform === "curseforge"
    ? { kind: "curseforge", projectId: Number(projectId), fileId: Number(fileId) }
    : { kind: "modrinth", projectId, versionId: fileId }
}

/** Newest downloadable file wins; the lists come back newest-first from both
 *  platforms, and a non-downloadable CurseForge file can never be installed. */
function bestFile(files: ModFile[]): ModFile | undefined {
  return files.find((f) => f.downloadable && f.releaseType === "release") ??
    files.find((f) => f.downloadable)
}

export function ModSelector({
  value,
  onChange,
  minecraft,
  loader,
}: {
  value: SelectedMod[]
  onChange: (next: SelectedMod[]) => void
  minecraft: string
  loader: string
}) {
  const t = useTranslations("admin.packs")
  const [platform, setPlatform] = useState<ModPlatform>("modrinth")
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [urlBusy, setUrlBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const gameVersion = minecraft.trim()
  const catalogLoader = catalogLoaderOf(loader)

  // `value` is read inside async handlers, never in an effect; a ref keeps the
  // handlers free of a dependency that changes on every pick.
  const valueRef = useRef(value)
  valueRef.current = value
  const appendAll = useCallback(
    (mods: SelectedMod[]) => {
      if (mods.length === 0) return
      const existing = new Set(valueRef.current.map((m) => m.key))
      const fresh = mods.filter((m) => !existing.has(m.key))
      if (fresh.length > 0) onChange([...valueRef.current, ...fresh])
    },
    [onChange],
  )

  const isAdded = useCallback(
    (hitPlatform: ModPlatform, projectId: string) =>
      valueRef.current.some((m) => m.platform === hitPlatform && m.projectId === projectId),
    [],
  )

  /** Resolve one catalog file into a manifest entry. The server hashes the
   *  bytes for CurseForge, so this can take seconds per file. */
  const resolveEntry = useCallback(
    async (
      hitPlatform: ModPlatform,
      projectId: string,
      file: ModFile,
      name: string,
      viaDependency: boolean,
    ): Promise<SelectedMod | null> => {
      const res = await PacksService.resolveFile(sourceOf(hitPlatform, projectId, file.fileId))
      if (!res.success || !res.data) return null
      const fileName = res.data.fileName || file.fileName
      return {
        key: `${hitPlatform}:${projectId}:${file.fileId}`,
        path: `${defaultFolder(fileName)}/${fileName}`,
        sha512: res.data.sha512,
        fileSize: res.data.fileSize,
        source: res.data.source,
        name,
        platform: hitPlatform,
        fileName,
        versionLabel: file.versionNumber ?? file.displayName,
        viaDependency,
        projectId,
      }
    },
    [],
  )

  /** Walks required dependencies breadth-first. Without this a pack installs
   *  and then crashes at launch on a missing library — the single most common
   *  way a hand-authored modpack is broken. */
  const collectDependencies = useCallback(
    async (
      hitPlatform: ModPlatform,
      rootFile: ModFile,
      known: Set<string>,
    ): Promise<{ added: SelectedMod[]; skipped: string[] }> => {
      const added: SelectedMod[] = []
      const skipped: string[] = []
      let frontier = rootFile.dependencies.filter((d) => d.relation === "required")
      // Depth cap: dependency graphs are shallow in practice, and a cycle here
      // would otherwise resolve (and download) forever.
      for (let depth = 0; depth < 4 && frontier.length > 0; depth += 1) {
        const pending = frontier.filter((d) => !known.has(`${d.platform}:${d.projectId}`))
        frontier = []
        if (pending.length === 0) break

        const summaries = await PacksService.projectSummaries(
          hitPlatform,
          pending.map((d) => d.projectId),
        )
        const names = new Map<string, ModSearchHit>(
          (summaries.success && summaries.data ? summaries.data : []).map((s) => [
            s.projectId,
            s,
          ]),
        )

        for (const dep of pending) {
          known.add(`${dep.platform}:${dep.projectId}`)
          const name = names.get(dep.projectId)?.name ?? dep.projectId
          setProgress(t("resolvingDependency", { name }))

          const listRes =
            hitPlatform === "curseforge"
              ? await PacksService.curseforgeFiles(dep.projectId, {
                  gameVersion,
                  loader: catalogLoader,
                  pageSize: 30,
                })
              : await PacksService.modrinthVersions(dep.projectId, {
                  gameVersion,
                  loader: catalogLoader,
                })
          const files = listRes.success && listRes.data ? listRes.data : []
          const pick = bestFile(files)
          if (!pick) {
            skipped.push(name)
            continue
          }
          const entry = await resolveEntry(hitPlatform, dep.projectId, pick, name, true)
          if (!entry) {
            skipped.push(name)
            continue
          }
          added.push(entry)
          frontier.push(...pick.dependencies.filter((d) => d.relation === "required"))
        }
      }
      return { added, skipped }
    },
    [catalogLoader, gameVersion, resolveEntry, t],
  )

  const addPick = useCallback(
    async ({ hit, file }: BrowsePick) => {
      const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
      if (busyKey) return
      setBusyKey(key)
      setProgress(t("resolving"))
      try {
        const entry = await resolveEntry(hit.platform, hit.projectId, file, hit.name, false)
        if (!entry) {
          toast({ tone: "bad", title: t("resolveFailed"), msg: file.fileName })
          return
        }
        const known = new Set(
          valueRef.current
            .filter((m) => m.projectId)
            .map((m) => `${m.platform}:${m.projectId}`),
        )
        known.add(`${hit.platform}:${hit.projectId}`)
        const { added, skipped } = await collectDependencies(hit.platform, file, known)
        appendAll([entry, ...added])

        if (skipped.length > 0) {
          toast({ tone: "warn", title: t("depsSkipped"), msg: skipped.join(", ") })
        } else if (added.length > 0) {
          toast({ tone: "ok", title: t("depsAdded", { count: added.length }) })
        }
      } finally {
        setBusyKey(null)
        setProgress(null)
      }
    },
    [appendAll, busyKey, collectDependencies, resolveEntry, t],
  )

  const addByUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || urlBusy) return
    setUrlBusy(true)
    try {
      const res = await PacksService.resolveFile({ kind: "url", url: trimmed })
      if (!res.success || !res.data) {
        toast({ tone: "bad", title: t("resolveFailed"), msg: trimmed })
        return
      }
      const name = res.data.fileName || fileNameOfUrl(trimmed)
      appendAll([
        {
          key: `url:${trimmed}`,
          path: `${defaultFolder(name)}/${name}`,
          sha512: res.data.sha512,
          fileSize: res.data.fileSize,
          source: res.data.source,
          name,
          platform: "url",
          fileName: name,
        },
      ])
      setUrl("")
    } finally {
      setUrlBusy(false)
    }
  }, [appendAll, t, url, urlBusy])

  const addUploads = useCallback(
    async (list: FileList | null) => {
      if (!list || uploadBusy) return
      setUploadBusy(true)
      try {
        const entries: SelectedMod[] = []
        for (const file of Array.from(list)) {
          const result = await uploadOverrideBlob(file)
          if (!result.ok) {
            toast({ tone: "bad", title: t("blobFailed"), msg: file.name })
            continue
          }
          const entry = overrideFileEntry(
            `${defaultFolder(file.name)}/${file.name}`,
            result.sha512,
            result.fileSize,
          )
          entries.push({
            key: `override:${result.sha512}`,
            path: entry.path,
            sha512: entry.sha512,
            fileSize: entry.fileSize,
            source: entry.source,
            name: file.name,
            platform: "override",
            fileName: file.name,
          })
        }
        appendAll(entries)
      } finally {
        setUploadBusy(false)
      }
    },
    [appendAll, t, uploadBusy],
  )

  const setPath = (key: string, path: string) =>
    onChange(valueRef.current.map((m) => (m.key === key ? { ...m, path } : m)))
  const remove = (key: string) => onChange(valueRef.current.filter((m) => m.key !== key))

  // The manifest rejects duplicates case-insensitively — Windows and macOS
  // would silently overwrite one file with the other.
  const pathCounts = new Map<string, number>()
  for (const mod of value) {
    const key = mod.path.toLowerCase().replace(/\\/g, "/")
    pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1)
  }

  return (
    // Catalog on the left, the pack being assembled on the right — the two
    // halves of the job, both visible at once instead of stacked.
    <div className="flex h-full min-h-0 gap-4 max-[1200px]:flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <ModBrowser
          platform={platform}
          onPlatformChange={setPlatform}
          gameVersion={gameVersion}
          loader={catalogLoader}
          isAdded={isAdded}
          onAdd={addPick}
          busyKey={busyKey}
        />
        {progress && (
          <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-txt-dim">
            <Spinner size={12} /> {progress}
          </span>
        )}
      </div>

      <aside className="flex min-h-0 shrink-0 flex-col gap-4 border-solid border-line max-[1200px]:border-t max-[1200px]:pt-4 min-[1201px]:w-[420px] min-[1201px]:border-l min-[1201px]:pl-4 2xl:min-[1201px]:w-[500px]">
        <div className="grid shrink-0 gap-3 sm:grid-cols-2 min-[1201px]:grid-cols-1">
          <Field label={t("addByUrl")} hint={t("addByUrlHint")}>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/mod.jar"
              />
              <Button
                size="sm"
                icon="link"
                loading={urlBusy}
                disabled={urlBusy || !url.trim()}
                onClick={() => void addByUrl()}
              >
                {t("add")}
              </Button>
            </div>
          </Field>
          <Field label={t("uploadJar")} hint={t("uploadJarHint")}>
            <div>
              <Button
                size="sm"
                icon="upload"
                loading={uploadBusy}
                disabled={uploadBusy}
                onClick={() => uploadRef.current?.click()}
              >
                {t("chooseJars")}
              </Button>
              <input
                ref={uploadRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  void addUploads(e.target.files)
                  e.target.value = ""
                }}
              />
            </div>
          </Field>
        </div>

      {/* Field is a grid: pinning row 2 to minmax(0,1fr) is what lets the list
          inside it scroll instead of pushing the sidebar taller. */}
      <Field
        label={t("selectedMods", { count: value.length })}
        className="min-h-0 flex-1 [grid-template-rows:auto_minmax(0,1fr)]"
      >
        {value.length === 0 ? (
          <p className="font-body text-[12px] text-txt-dim">{t("noModsSelected")}</p>
        ) : (
          <ul className="bm-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-auto pr-1">
            {value.map((mod) => {
              const duplicate =
                (pathCounts.get(mod.path.toLowerCase().replace(/\\/g, "/")) ?? 0) > 1
              return (
                <li
                  key={mod.key}
                  className="flex flex-wrap items-center gap-2 border border-solid border-line bg-panel px-3 py-2"
                >
                  <Badge tone="info" className="shrink-0">
                    {t(`sourceKind.${mod.platform}`)}
                  </Badge>
                  {mod.viaDependency && (
                    <Badge tone="warn" className="shrink-0">
                      {t("viaDependency")}
                    </Badge>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                      {mod.name}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-txt-dim">
                      {mod.fileName}
                      {mod.versionLabel ? ` · ${mod.versionLabel}` : ""} ·{" "}
                      {formatSize(mod.fileSize)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="shrink-0 font-mono text-[11px] text-txt-dim hover:text-bad"
                    aria-label={t("remove")}
                    onClick={() => remove(mod.key)}
                  >
                    ×
                  </button>
                  {/* Full width on its own line: the target path is long and
                      the sidebar is narrower than the old modal body. */}
                  <span className="w-full basis-full">
                    <Input
                      value={mod.path}
                      onChange={(e) => setPath(mod.key, e.target.value)}
                      className="font-mono text-[11px]"
                    />
                    {duplicate && (
                      <span className="mt-1 block font-body text-[11px] text-bad">
                        {t("duplicatePath")}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Field>

        {value.length > 0 && (
          <p className="flex shrink-0 items-center gap-2 border-t border-solid border-line pt-3 font-mono text-[11px] text-txt-dim">
            <Icon name="info" size={12} />
            {t("totalSize", {
              size: formatSize(value.reduce((sum, m) => sum + m.fileSize, 0)),
            })}
          </p>
        )}
      </aside>
    </div>
  )
}
