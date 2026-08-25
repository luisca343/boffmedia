import { useCallback, useEffect, useRef, useState } from "react"

import {
  Button,
  type BrowsePick,
  CONNECTOR_PROJECT_ID,
  type CatalogLoader,
  type CatalogProjectType,
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
  toast,
} from "@boffmedia/ui"

// Registers the Modrinth-backed catalog client the browser reads. Side-effect
// import, from the one component that mounts it.
import "../../services/catalog"
import { useT } from "../../i18n"
import { addFiles } from "../../services/localPackEdit"

// "Añadir contenido" — the catalog, full page.
//
// This was a modal. A modal was wrong for it: the browser is three panes wide,
// adding several mods in a row meant reopening a dialog each time, and the
// staged-selection sidebar duplicated the Content tab that now sits one click
// away. Here a pick is written straight to the manifest and the Content tab
// shows it on return.
//
// Modrinth only — see catalog.rs for why a desktop client cannot carry a
// CurseForge key.

type PendingEntry = {
  path: string
  sha512: string
  fileSize: number
  source: unknown
  projectId: string
  /** Only when the jar's loader differs from the pack's — a Fabric mod running
   *  on NeoForge through Connector. Goes straight to `PackFile.loader`. */
  loader?: CatalogLoader
}

function fileNameOfUrl(url: string): string {
  return url.split("?")[0].split("/").filter(Boolean).pop() || "file.jar"
}

export function BrowsePage({
  slug,
  minecraft,
  loader,
  addedProjectIds,
  onBack,
  onChanged,
}: {
  slug: string
  minecraft: string
  /** The MANIFEST loader id ("fabric-loader"); `catalogLoaderOf` maps it. */
  loader: string | null
  /** Modrinth project ids already in the pack, so the grid can mark them. */
  addedProjectIds: string[]
  onBack: () => void
  onChanged: () => void
}) {
  const t = useT("browse")
  // The shared ModBrowser resolves its OWN key set (type.*, sortBy.*, side.* …)
  // from the labels sub-namespace; the component's `t` above is for its own text.
  const browserLabels = useT("browse.labels")
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [urlBusy, setUrlBusy] = useState(false)
  const [added, setAdded] = useState<string[]>(addedProjectIds)

  const catalogLoader = catalogLoaderOf(loader ?? "")
  const addedRef = useRef(added)
  addedRef.current = added

  // Connector mode. `available` is asked of Modrinth (does Connector ship for
  // this Minecraft/loader pair at all?); `choice` is the player's explicit
  // toggle, and null means untouched, in which case the pack already containing
  // Connector is taken as the answer. The switch therefore turns itself on the
  // moment Connector lands in the pack, without overriding a deliberate off.
  const [connectorAvailable, setConnectorAvailable] = useState(false)
  const [connectorChoice, setConnectorChoice] = useState<boolean | null>(null)

  useEffect(() => {
    let live = true
    void connectorSupport(minecraft, catalogLoader).then((support) => {
      if (live) setConnectorAvailable(support.available)
    })
    return () => {
      live = false
    }
  }, [minecraft, catalogLoader])

  const connectorEnabled =
    connectorAvailable && (connectorChoice ?? added.includes(CONNECTOR_PROJECT_ID))

  const isAdded = useCallback(
    (_platform: ModPlatform, projectId: string) => addedRef.current.includes(projectId),
    [],
  )

  const resolveEntry = useCallback(
    async (
      projectId: string,
      file: ModFile,
      projectType: CatalogProjectType,
      /** Only when it differs from the pack's own loader — see PendingEntry. */
      entryLoader?: CatalogLoader,
    ): Promise<PendingEntry | null> => {
      const resolved = await getCatalog().resolve({
        kind: "modrinth",
        projectId,
        versionId: file.fileId,
      })
      if (!resolved) return null
      const fileName = resolved.fileName || file.fileName
      return {
        path: `${defaultFolder(fileName, projectType)}/${fileName}`,
        sha512: resolved.sha512,
        fileSize: resolved.fileSize,
        source: resolved.source,
        projectId,
        loader: entryLoader,
      }
    },
    [],
  )

  /** Files for a project against this pack, falling back to Fabric when it has
   *  nothing for the pack's own loader and Connector is on.
   *
   *  Empirical rather than read off the project's advertised loaders: a search
   *  hit folds its loaders into `categories`, a project summary does not
   *  reliably, and "are there files?" is the check that is correct for both.
   *  The second request only happens on the fallback path. */
  const filesForLoader = useCallback(
    async (projectId: string): Promise<{ files: ModFile[]; entryLoader?: CatalogLoader }> => {
      const native = await getCatalog().files("modrinth", projectId, {
        gameVersion: minecraft,
        loader: catalogLoader,
      })
      if (native.length > 0 || !connectorEnabled) return { files: native }

      const fabric = await getCatalog().files("modrinth", projectId, {
        gameVersion: minecraft,
        loader: "fabric",
      })
      return fabric.length > 0 ? { files: fabric, entryLoader: "fabric" } : { files: native }
    },
    [catalogLoader, connectorEnabled, minecraft],
  )

  /** Best installable file for a project id, resolved into a manifest entry.
   *  Shared by the dependency walk, the Connector substitution and the companion
   *  add, so all three agree on loader fallback. The file comes back too because
   *  the walk needs ITS dependencies for the next frontier. */
  const entryForProject = useCallback(
    async (
      projectId: string,
    ): Promise<{ entry: PendingEntry; file: ModFile } | null> => {
      const { files, entryLoader } = await filesForLoader(projectId)
      const pick = bestFile(files)
      if (!pick) return null
      // Always "mod": a required dependency is a loadable jar whatever depends
      // on it — a shader's dependency is Iris, which is a mod, not another
      // shader.
      const entry = await resolveEntry(projectId, pick, "mod", entryLoader)
      return entry ? { entry, file: pick } : null
    },
    [filesForLoader, resolveEntry],
  )

  /** Walks required dependencies breadth-first. Without this a pack installs
   *  and then crashes at launch on a missing library — the single most common
   *  way a hand-built modpack is broken. */
  const collectDependencies = useCallback(
    async (rootFile: ModFile, known: Set<string>) => {
      const found: PendingEntry[] = []
      const skipped: string[] = []
      let frontier = rootFile.dependencies.filter((d) => d.relation === "required")
      // Depth cap: dependency graphs are shallow in practice, and a cycle would
      // otherwise resolve forever.
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
          if (known.has(dep.projectId) || known.has(projectId) || roundSeen.has(projectId)) {
            continue
          }
          roundSeen.add(projectId)
          targets.push({ dep, projectId })
        }
        frontier = []
        if (targets.length === 0) break

        // Names come from the batch lookup on the SUBSTITUTED ids, so the pack
        // lists the forgified jar under its own name rather than "Fabric API".
        const summaries = await getCatalog().projectSummaries(
          "modrinth",
          targets.map((x) => x.projectId),
        )
        const names = new Map<string, ModSearchHit>(summaries.map((s) => [s.projectId, s]))

        for (const { dep, projectId: depId } of targets) {
          known.add(dep.projectId)
          known.add(depId)
          const name = names.get(depId)?.name ?? depId
          setProgress(t("resolvingDep", { name }))

          const resolved = await entryForProject(depId)
          if (!resolved) {
            skipped.push(name)
            continue
          }
          found.push(resolved.entry)
          frontier.push(...resolved.file.dependencies.filter((d) => d.relation === "required"))
        }
      }
      return { found, skipped }
    },
    [connectorEnabled, entryForProject, t],
  )

  const addPick = useCallback(
    async ({ hit, file, projectType, viaConnector }: BrowsePick) => {
      const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
      if (busyKey) return
      setBusyKey(key)
      setProgress(t("adding"))
      try {
        // The substitution has to cover a DIRECT pick, not just a walked
        // dependency: with Connector on, Fabric API ranks first for almost any
        // query, so the likeliest way to break a pack is for someone to click it.
        const substitute = connectorEnabled
          ? connectorSubstitute(hit.projectId)
          : undefined
        if (substitute) {
          const swapped = await entryForProject(substitute)
          if (!swapped) {
            toast.error(t("addError", { file: file.fileName }))
            return
          }
          await addFiles(slug, [swapped.entry])
          setAdded([...addedRef.current, swapped.entry.projectId])
          toast({ tone: "warn", title: t("connectorSubstituted"), msg: hit.name })
          onChanged()
          return
        }

        const entry = await resolveEntry(
          hit.projectId,
          file,
          projectType,
          viaConnector ? "fabric" : undefined,
        )
        if (!entry) {
          toast.error(t("addError", { file: file.fileName }))
          return
        }
        const known = new Set(addedRef.current)
        known.add(hit.projectId)

        // Connector and Forgified Fabric API, pulled in the first time a Fabric
        // mod is added. Both, not just Connector: Connector alone boots and then
        // every Fabric mod touching Fabric API crashes on a missing class.
        // Added to `known` first so the dependency walk cannot duplicate them.
        const companions: PendingEntry[] = []
        if (viaConnector) {
          for (const c of await connectorCompanions(minecraft, catalogLoader)) {
            if (known.has(c.projectId)) continue
            known.add(c.projectId)
            setProgress(t("resolvingDep", { name: c.file.displayName }))
            const resolved = await entryForProject(c.projectId)
            if (resolved) companions.push(resolved.entry)
          }
        }

        const { found, skipped } = await collectDependencies(file, known)

        // One write for the mod and its whole dependency closure: a save per
        // entry would leave the manifest half-updated if the last one failed.
        const all = [entry, ...companions, ...found]
        await addFiles(slug, all)
        setAdded([...addedRef.current, ...all.map((f) => f.projectId)])

        if (companions.length > 0) {
          toast.success(t("connectorCompanionsAdded"))
        }
        if (skipped.length > 0) {
          toast({ tone: "warn", title: t("incompatibleWarning"), msg: skipped.join(", ") })
        } else if (found.length > 0) {
          toast.success(t("addedWithDepsMessage", { name: hit.name, count: found.length }))
        } else {
          toast.success(t("addedMessage", { name: hit.name }))
        }
        onChanged()
      } catch (err) {
        // ModBrowser calls this as `void onAdd(...)`, so anything thrown here
        // would otherwise become an unhandled rejection with no visible cause.
        toast.error((err as { message?: string })?.message ?? t("addModError"))
      } finally {
        setBusyKey(null)
        setProgress(null)
      }
    },
    [
      busyKey,
      catalogLoader,
      collectDependencies,
      connectorEnabled,
      entryForProject,
      minecraft,
      onChanged,
      resolveEntry,
      slug,
      t,
    ],
  )

  /** The one path that must download to add: a raw URL has no published hash to
   *  borrow, and PackFile.sha512 is mandatory. */
  const addByUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || urlBusy) return
    setUrlBusy(true)
    setProgress(t("hashProgress"))
    try {
      const resolved = await getCatalog().resolve({ kind: "url", url: trimmed })
      if (!resolved) {
        toast.error(t("addLinkError"))
        return
      }
      const name = resolved.fileName || fileNameOfUrl(trimmed)
      await addFiles(slug, [
        {
          path: `${defaultFolder(name)}/${name}`,
          sha512: resolved.sha512,
          fileSize: resolved.fileSize,
          source: resolved.source,
        },
      ])
      setUrl("")
      toast.success(t("addedMessage", { name }))
      onChanged()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("addLinkError"))
    } finally {
      setUrlBusy(false)
      setProgress(null)
    }
  }, [onChanged, slug, t, url, urlBusy])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted hover:text-accent-bright"
        >
          <Icon name="back" size={13} /> {t("backButton")}
        </button>
        <span className="flex-1" />
        <div className="w-full max-w-[420px]">
          <Field label={t("linkLabel")} hint={t("linkHint")}>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("urlPlaceholder")}
              />
              <Button
                size="sm"
                icon="link"
                loading={urlBusy}
                disabled={urlBusy || !url.trim()}
                onClick={() => void addByUrl()}
              >
                {t("addButton")}
              </Button>
            </div>
          </Field>
        </div>
      </div>

      <ModBrowser
        t={browserLabels}
        platform="modrinth"
        onPlatformChange={() => {}}
        // One platform, so the toggle is hidden rather than rendered as a
        // single dead button.
        platforms={["modrinth"]}
        // Modrinth has no name sort; offering one would be a dead option.
        sorts={["downloads", "follows", "updated", "relevance"]}
        gameVersion={minecraft}
        loader={catalogLoader}
        // Absent unless Connector actually ships for this Minecraft/loader
        // pair, so a Fabric pack or an unsupported version never sees a toggle
        // that could not do anything.
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
  )
}
