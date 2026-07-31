"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Empty, Field, Icon, Input, Seg, Spinner, toast } from "@boffmedia/ui"
import {
  type CatalogLoader,
  type ModFile,
  type ModPlatform,
  type ModSearchHit,
  PacksService,
  type ResolveSource,
} from "@/services/api/boffmedia/packsService"
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
}

/** The catalogs speak "fabric"/"quilt"; the manifest speaks "fabric-loader"/
 *  "quilt-loader". Sending the manifest id straight through returns nothing. */
export function catalogLoaderOf(loader: string): CatalogLoader | undefined {
  if (loader === "forge" || loader === "neoforge") return loader
  if (loader === "fabric-loader") return "fabric"
  if (loader === "quilt-loader") return "quilt"
  return undefined
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function fileNameOfUrl(url: string): string {
  const tail = url.split("?")[0].split("/").filter(Boolean).pop()
  return tail || "file.jar"
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
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<ModSearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [files, setFiles] = useState<ModFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [urlBusy, setUrlBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const gameVersion = minecraft.trim()
  const catalogLoader = catalogLoaderOf(loader)
  // Only the resolved primitives feed the search effect — an inline callback in
  // the dependency array would re-run it on every render of the parent modal.
  const searchSeq = useRef(0)
  const filesSeq = useRef(0)

  // `value` is read inside async handlers, never in an effect; a ref keeps the
  // handlers free of a dependency that changes on every pick.
  const valueRef = useRef(value)
  valueRef.current = value
  const append = useCallback(
    (mod: SelectedMod) => onChange([...valueRef.current, mod]),
    [onChange],
  )

  useEffect(() => {
    if (!gameVersion || !query.trim()) {
      setHits([])
      setExpanded(null)
      return
    }
    const seq = ++searchSeq.current
    setSearching(true)
    const timer = setTimeout(() => {
      void PacksService.searchMods({
        platform,
        query: query.trim(),
        gameVersion,
        loader: catalogLoader,
        pageSize: 20,
      }).then((res) => {
        if (seq !== searchSeq.current) return
        setHits(res.success && res.data ? res.data : [])
        setSearching(false)
      })
    }, 350)
    return () => {
      clearTimeout(timer)
      if (seq === searchSeq.current) setSearching(false)
    }
  }, [platform, query, gameVersion, catalogLoader])

  const openFiles = useCallback(
    (hit: ModSearchHit) => {
      if (expanded === hit.projectId) {
        setExpanded(null)
        return
      }
      setExpanded(hit.projectId)
      setFiles([])
      const seq = ++filesSeq.current
      setLoadingFiles(true)
      const request =
        hit.platform === "curseforge"
          ? PacksService.curseforgeFiles(hit.projectId, {
              gameVersion,
              loader: catalogLoader,
              pageSize: 30,
            })
          : PacksService.modrinthVersions(hit.projectId, {
              gameVersion,
              loader: catalogLoader,
            })
      void request.then((res) => {
        if (seq !== filesSeq.current) return
        setFiles(res.success && res.data ? res.data : [])
        setLoadingFiles(false)
      })
    },
    [expanded, gameVersion, catalogLoader],
  )

  const pickFile = useCallback(
    async (hit: ModSearchHit, file: ModFile) => {
      if (resolvingId) return
      setResolvingId(file.fileId)
      try {
        const source: ResolveSource =
          hit.platform === "curseforge"
            ? {
                kind: "curseforge",
                projectId: Number(hit.projectId),
                fileId: Number(file.fileId),
              }
            : { kind: "modrinth", projectId: hit.projectId, versionId: file.fileId }
        const res = await PacksService.resolveFile(source)
        if (!res.success || !res.data) {
          toast({ tone: "bad", title: t("resolveFailed"), msg: file.fileName })
          return
        }
        append({
          key: `${hit.platform}:${hit.projectId}:${file.fileId}`,
          path: `mods/${res.data.fileName || file.fileName}`,
          sha512: res.data.sha512,
          fileSize: res.data.fileSize,
          source: res.data.source,
          name: hit.name,
          platform: hit.platform,
          fileName: res.data.fileName || file.fileName,
          versionLabel: file.versionNumber ?? file.displayName,
        })
      } finally {
        setResolvingId(null)
      }
    },
    [append, resolvingId, t],
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
      append({
        key: `url:${trimmed}:${Date.now()}`,
        path: `mods/${name}`,
        sha512: res.data.sha512,
        fileSize: res.data.fileSize,
        source: res.data.source,
        name,
        platform: "url",
        fileName: name,
      })
      setUrl("")
    } finally {
      setUrlBusy(false)
    }
  }, [append, t, url, urlBusy])

  const addUploads = useCallback(
    async (list: FileList | null) => {
      if (!list || uploadBusy) return
      setUploadBusy(true)
      try {
        for (const file of Array.from(list)) {
          const result = await uploadOverrideBlob(file)
          if (!result.ok) {
            toast({ tone: "bad", title: t("blobFailed"), msg: file.name })
            continue
          }
          const entry = overrideFileEntry(`mods/${file.name}`, result.sha512, result.fileSize)
          append({
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
      } finally {
        setUploadBusy(false)
      }
    },
    [append, t, uploadBusy],
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Seg
          value={platform}
          onChange={(v) => {
            setPlatform(v as ModPlatform)
            setExpanded(null)
          }}
          options={[
            { value: "modrinth", label: t("platformModrinth") },
            { value: "curseforge", label: t("platformCurseforge") },
          ]}
        />
        <div className="min-w-[220px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("modSearchPlaceholder")}
          />
        </div>
        {searching && <Spinner size={16} className="text-txt-muted" />}
      </div>

      {!gameVersion ? (
        <Empty
          icon="info"
          title={t("needMinecraft")}
          lead={t("needMinecraftLead")}
          className="py-6 [&_h2]:text-[24px]"
        />
      ) : hits.length === 0 ? (
        <p className="font-body text-[12px] text-txt-dim">
          {query.trim() ? (searching ? t("searching") : t("noModResults")) : t("searchPrompt")}
        </p>
      ) : (
        <ul className="flex max-h-[320px] flex-col gap-1 overflow-auto">
          {hits.map((hit) => (
            <li key={hit.projectId} className="border border-solid border-line bg-panel">
              <button
                type="button"
                onClick={() => openFiles(hit)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left"
              >
                {hit.iconUrl ? (
                  // Remote catalog art: no next/image loader is configured for
                  // CurseForge/Modrinth CDNs, so this stays a plain <img>.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hit.iconUrl}
                    alt=""
                    className="size-8 shrink-0 border border-solid border-line object-cover"
                  />
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center border border-solid border-line text-txt-dim">
                    <Icon name="cube" size={14} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                    {hit.name}
                  </span>
                  <span className="truncate font-body text-[12px] text-txt-dim">{hit.summary}</span>
                </span>
                <span className="hidden shrink-0 font-mono text-[11px] text-txt-dim sm:block">
                  {hit.author}
                </span>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-txt-muted">
                  <Icon name="download" size={12} />
                  {hit.downloads.toLocaleString()}
                </span>
                <Icon
                  name={expanded === hit.projectId ? "chevronDown" : "chevronRight"}
                  size={14}
                  className="shrink-0 text-txt-dim"
                />
              </button>

              {expanded === hit.projectId && (
                <div className="border-t border-solid border-line px-3 py-2">
                  {loadingFiles ? (
                    <span className="flex items-center gap-2 font-mono text-[11px] text-txt-dim">
                      <Spinner size={12} /> {t("loadingFiles")}
                    </span>
                  ) : files.length === 0 ? (
                    <p className="font-body text-[12px] text-txt-dim">{t("noCompatibleFiles")}</p>
                  ) : (
                    <ul className="flex max-h-[220px] flex-col gap-1 overflow-auto">
                      {files.map((file) => {
                        const busy = resolvingId === file.fileId
                        return (
                          <li
                            key={file.fileId}
                            className="flex flex-wrap items-center gap-2 border border-solid border-line bg-panel-2 px-2 py-[6px]"
                          >
                            <Badge
                              tone={file.releaseType === "release" ? "ok" : "warn"}
                              className="shrink-0"
                            >
                              {t(`releaseType.${file.releaseType}`)}
                            </Badge>
                            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-txt-muted">
                              {file.fileName}
                            </span>
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
                                disabled={resolvingId !== null}
                                onClick={() => void pickFile(hit, file)}
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
                    <p className="mt-2 font-body text-[12px] text-bad">
                      {t("notDistributableLead")}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
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

      <Field label={t("selectedMods", { count: value.length })}>
        {value.length === 0 ? (
          <p className="font-body text-[12px] text-txt-dim">{t("noModsSelected")}</p>
        ) : (
          <ul className="flex max-h-[260px] flex-col gap-1 overflow-auto">
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
                  <span className="w-[240px]">
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
                  <button
                    type="button"
                    className="shrink-0 font-mono text-[11px] text-txt-dim hover:text-bad"
                    aria-label={t("remove")}
                    onClick={() => remove(mod.key)}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Field>
    </div>
  )
}
