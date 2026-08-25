"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  type BrowsePick,
  CONNECTOR_PROJECT_ID,
  type CatalogLoader,
  type CatalogProjectType,
  Button,
  Field,
  Icon,
  Input,
  ModBrowser,
  type ModFile,
  type ModPlatform,
  type ModSearchHit,
  Spinner,
  bestFile,
  catalogLoaderOf,
  connectorCompanions,
  connectorSubstitute,
  connectorSupport,
  defaultFolder,
  getCatalog,
  resolveSourceOf,
  toast,
} from "@boffmedia/ui"
// Registers the catalog client the browser reads. Imported for the side effect
// only, and from the one component that mounts it, so the wiring cannot be
// forgotten by a future caller.
import "@/lib/catalog-runtime"
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
  /** Recorded only when the jar's loader differs from the pack's — a Fabric mod
   *  running on NeoForge through Connector. Carried straight to the manifest's
   *  `PackFile.loader`, and what the "Fabric" badge in the list reads. */
  loader?: CatalogLoader
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
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [urlBusy, setUrlBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const gameVersion = minecraft.trim()
  const catalogLoader = catalogLoaderOf(loader)

  // Connector mode. `available` is asked of Modrinth (does Connector ship for
  // this Minecraft/loader pair at all?); `choice` is the admin's explicit
  // toggle, and null means "not touched", in which case the pack already
  // containing Connector is taken as the answer. That way the switch turns
  // itself on the moment Connector lands in the list, without ever overriding
  // someone who deliberately turned it off.
  const [connectorAvailable, setConnectorAvailable] = useState(false)
  const [connectorChoice, setConnectorChoice] = useState<boolean | null>(null)

  useEffect(() => {
    let live = true
    void connectorSupport(gameVersion, catalogLoader).then((support) => {
      if (live) setConnectorAvailable(support.available)
    })
    return () => {
      live = false
    }
  }, [gameVersion, catalogLoader])

  const hasConnector = value.some((m) => m.projectId === CONNECTOR_PROJECT_ID)
  const connectorEnabled = connectorAvailable && (connectorChoice ?? hasConnector)

  // `value` is read inside async handlers, never in an effect; a ref keeps the
  // handlers free of a dependency that changes on every pick.
  const valueRef = useRef(value)
  valueRef.current = value
  const appendAll = useCallback(
    (mods: SelectedMod[]) => {
      if (mods.length === 0) return
      // Both sets grow as the batch is walked, so the incoming mods are deduped
      // against EACH OTHER as well as against what is already selected. Path is
      // checked alongside key because path is what the manifest actually
      // constrains: two dependency edges resolving to the same jar (Fabric API
      // and Forgified Fabric API both land on the forgified one under Connector)
      // produce different keys but the SAME path, and the API rejects the whole
      // version over it.
      const existing = new Set(valueRef.current.map((m) => m.key))
      const paths = new Set(valueRef.current.map((m) => m.path.toLowerCase()))
      const fresh: SelectedMod[] = []
      for (const mod of mods) {
        const path = mod.path.toLowerCase()
        if (existing.has(mod.key) || paths.has(path)) continue
        existing.add(mod.key)
        paths.add(path)
        fresh.push(mod)
      }
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
      projectType: CatalogProjectType,
      /** Only when it differs from the pack's own loader — see SelectedMod. */
      entryLoader?: CatalogLoader,
    ): Promise<SelectedMod | null> => {
      const resolved = await getCatalog().resolve(
        resolveSourceOf(hitPlatform, projectId, file.fileId),
      )
      if (!resolved) return null
      const fileName = resolved.fileName || file.fileName
      return {
        key: `${hitPlatform}:${projectId}:${file.fileId}`,
        path: `${defaultFolder(fileName, projectType)}/${fileName}`,
        sha512: resolved.sha512,
        fileSize: resolved.fileSize,
        source: resolved.source,
        name,
        platform: hitPlatform,
        fileName,
        versionLabel: file.versionNumber ?? file.displayName,
        viaDependency,
        projectId,
        loader: entryLoader,
      }
    },
    [],
  )

  /** Files for a project against this pack, falling back to Fabric when the
   *  project has nothing for the pack's own loader and Connector is on.
   *
   *  Empirical rather than derived from the project's advertised loaders on
   *  purpose: a search hit folds its loaders into `categories`, but a project
   *  summary does not reliably, so asking "are there files?" is the only check
   *  that is correct for both. The second request only happens on the fallback
   *  path — a dual-loader mod never reaches it. */
  const filesForLoader = useCallback(
    async (
      hitPlatform: ModPlatform,
      projectId: string,
    ): Promise<{ files: ModFile[]; entryLoader?: CatalogLoader }> => {
      const native = await getCatalog().files(hitPlatform, projectId, {
        gameVersion,
        loader: catalogLoader,
        pageSize: 30,
      })
      if (native.length > 0 || !connectorEnabled) return { files: native }

      const fabric = await getCatalog().files(hitPlatform, projectId, {
        gameVersion,
        loader: "fabric",
        pageSize: 30,
      })
      return fabric.length > 0 ? { files: fabric, entryLoader: "fabric" } : { files: native }
    },
    [catalogLoader, connectorEnabled, gameVersion],
  )

  /** Best installable file for a project id, resolved into a manifest entry.
   *  Shared by the dependency walk, the Connector substitution and the
   *  companion add, so all three agree on loader fallback and naming. */
  const entryForProject = useCallback(
    async (
      hitPlatform: ModPlatform,
      projectId: string,
      name: string,
      viaDependency: boolean,
    ): Promise<{ entry: SelectedMod; file: ModFile } | null> => {
      const { files, entryLoader } = await filesForLoader(hitPlatform, projectId)
      const pick = bestFile(files)
      if (!pick) return null
      // Always "mod": a required dependency is a loadable jar whatever depends
      // on it — a shader's dependency is Iris, which is a mod.
      const entry = await resolveEntry(
        hitPlatform,
        projectId,
        pick,
        name,
        viaDependency,
        "mod",
        entryLoader,
      )
      // The file comes back alongside the entry because the dependency walk
      // needs ITS dependencies to build the next frontier.
      return entry ? { entry, file: pick } : null
    },
    [filesForLoader, resolveEntry],
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
        // A Fabric mod's dependency on Fabric API must become Forgified Fabric
        // API under Connector. Connector refuses to load Fabric API itself, so
        // following this edge literally is not a degraded pack, it is one that
        // does not boot.
        //
        // The substitution happens BEFORE the `known` check, not after, and that
        // order is the whole point: the companion pass registers the FORGIFIED
        // id, while the raw edge carries the FABRIC one. Filtering on the raw id
        // first let Fabric API through, substituted it to a project already
        // queued, and produced two entries with the same path — which the
        // manifest rejects, so the entire add failed.
        //
        // Both ids are checked: the raw one so an already-present Fabric API is
        // still skipped, the substituted one so the companion is not re-added.
        // `roundSeen` covers the third case the set cannot — two mods in the
        // SAME batch depending on Fabric API, which would otherwise resolve to
        // the same jar twice.
        const roundSeen = new Set<string>()
        const targets: { dep: (typeof frontier)[number]; projectId: string }[] = []
        for (const dep of frontier) {
          const projectId =
            (connectorEnabled ? connectorSubstitute(dep.projectId) : undefined) ??
            dep.projectId
          if (
            known.has(`${dep.platform}:${dep.projectId}`) ||
            known.has(`${dep.platform}:${projectId}`) ||
            roundSeen.has(projectId)
          ) {
            continue
          }
          roundSeen.add(projectId)
          targets.push({ dep, projectId })
        }
        frontier = []
        if (targets.length === 0) break

        // Names come from the batch lookup on the SUBSTITUTED ids, so the list
        // shows the forgified jar under its own name rather than "Fabric API".
        const summaries = await getCatalog().projectSummaries(
          hitPlatform,
          targets.map((x) => x.projectId),
        )
        const names = new Map<string, ModSearchHit>(summaries.map((s) => [s.projectId, s]))

        for (const { dep, projectId: depId } of targets) {
          known.add(`${dep.platform}:${dep.projectId}`)
          known.add(`${dep.platform}:${depId}`)

          const name = names.get(depId)?.name ?? depId
          setProgress(t("resolvingDependency", { name }))

          const resolved = await entryForProject(hitPlatform, depId, name, true)
          if (!resolved) {
            skipped.push(name)
            continue
          }
          added.push(resolved.entry)
          frontier.push(...resolved.file.dependencies.filter((d) => d.relation === "required"))
        }
      }
      return { added, skipped }
    },
    [connectorEnabled, entryForProject, t],
  )

  const addPick = useCallback(
    async ({ hit, file, projectType, viaConnector }: BrowsePick) => {
      const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
      if (busyKey) return
      setBusyKey(key)
      setProgress(t("resolving"))
      try {
        // The substitution has to cover a DIRECT pick, not just a walked
        // dependency: with Connector on, Fabric API ranks first for almost any
        // query, so the likeliest way to break a pack is for someone to click it.
        const substitute = connectorEnabled
          ? connectorSubstitute(hit.projectId)
          : undefined
        if (substitute) {
          const swapped = await entryForProject(hit.platform, substitute, hit.name, false)
          if (!swapped) {
            toast({ tone: "bad", title: t("resolveFailed"), msg: hit.name })
            return
          }
          appendAll([swapped.entry])
          toast({
            tone: "warn",
            title: t("connectorSubstituted"),
            msg: swapped.entry.name,
          })
          return
        }

        const entry = await resolveEntry(
          hit.platform,
          hit.projectId,
          file,
          hit.name,
          false,
          projectType,
          viaConnector ? "fabric" : undefined,
        )
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

        // Connector and Forgified Fabric API, pulled in the first time a Fabric
        // mod is added. Both, not just Connector: Connector alone boots and then
        // every Fabric mod touching Fabric API crashes on a missing class.
        // `known` gets them before the dependency walk so the walk cannot add
        // them a second time.
        const companions: SelectedMod[] = []
        if (viaConnector) {
          for (const c of await connectorCompanions(gameVersion, catalogLoader)) {
            if (known.has(`${hit.platform}:${c.projectId}`)) continue
            known.add(`${hit.platform}:${c.projectId}`)
            setProgress(t("resolvingDependency", { name: c.file.displayName }))
            const resolved = await entryForProject(
              hit.platform,
              c.projectId,
              c.file.displayName,
              true,
            )
            if (resolved) companions.push(resolved.entry)
          }
        }

        const { added, skipped } = await collectDependencies(hit.platform, file, known)
        appendAll([entry, ...companions, ...added])

        if (companions.length > 0) {
          toast({ tone: "ok", title: t("connectorCompanionsAdded") })
        }
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
    [
      appendAll,
      busyKey,
      catalogLoader,
      collectDependencies,
      connectorEnabled,
      entryForProject,
      gameVersion,
      resolveEntry,
      t,
    ],
  )

  const addByUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || urlBusy) return
    setUrlBusy(true)
    try {
      const resolved = await getCatalog().resolve({ kind: "url", url: trimmed })
      if (!resolved) {
        toast({ tone: "bad", title: t("resolveFailed"), msg: trimmed })
        return
      }
      const name = resolved.fileName || fileNameOfUrl(trimmed)
      appendAll([
        {
          key: `url:${trimmed}`,
          path: `${defaultFolder(name)}/${name}`,
          sha512: resolved.sha512,
          fileSize: resolved.fileSize,
          source: resolved.source,
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
          t={t}
          platform={platform}
          onPlatformChange={setPlatform}
          gameVersion={gameVersion}
          loader={catalogLoader}
          // Absent unless Connector actually ships for this Minecraft/loader
          // pair, so a Fabric pack or an unsupported version never sees a
          // toggle that could not do anything.
          connector={
            connectorAvailable
              ? { enabled: connectorEnabled, onChange: setConnectorChoice }
              : undefined
          }
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
          <ul className="bm-scroll flex max-h-[45vh] min-h-0 flex-1 flex-col gap-1 overflow-auto pr-1">
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
                  {mod.loader === "fabric" && (
                    <Badge tone="new" className="shrink-0">
                      {t("loaderFabric")}
                    </Badge>
                  )}
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
