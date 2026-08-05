import { useCallback, useRef, useState } from "react"

import {
  Button,
  type BrowsePick,
  type CatalogProjectType,
  Field,
  Icon,
  Input,
  ModBrowser,
  type ModFile,
  type ModPlatform,
  type ModSearchHit,
  Spinner,
  type Translate,
  bestFile,
  catalogLoaderOf,
  defaultFolder,
  getCatalog,
  toast,
} from "@boffmedia/ui"

// Registers the Modrinth-backed catalog client the browser reads. Side-effect
// import, from the one component that mounts it.
import "../../services/catalog"
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

const LABELS: Record<string, string> = {
  needMinecraftLead: "Elige primero una versión de Minecraft para el pack.",
  platformModrinth: "Modrinth",
  platformCurseforge: "CurseForge",
  modSearchPlaceholder: "Buscar mods…",
  projectType: "Tipo",
  "type.mod": "Mods",
  "type.resourcepack": "Recursos",
  "type.shader": "Shaders",
  "type.datapack": "Datapacks",
  sort: "Orden",
  "sortBy.downloads": "Descargas",
  "sortBy.follows": "Seguidores",
  "sortBy.updated": "Actualizado",
  "sortBy.relevance": "Relevancia",
  "sortBy.name": "Nombre",
  categories: "Categorías",
  allCategories: "Todas",
  noModResults: "Ningún mod coincide con la búsqueda.",
  added: "Añadido",
  close: "Cerrar",
  linkSource: "Código",
  linkIssues: "Incidencias",
  linkWebsite: "Web",
  files: "Archivos",
  compatibleOnly: "Compatibles",
  allFiles: "Todos",
  loadingFiles: "Cargando archivos…",
  noCompatibleFiles: "No hay archivos para esta versión de Minecraft y este loader.",
  "releaseType.release": "Estable",
  "releaseType.beta": "Beta",
  "releaseType.alpha": "Alpha",
  resolving: "Añadiendo…",
  addMod: "Añadir",
  notDistributable: "No descargable",
  notDistributableLead: "El autor no permite la descarga automática de estos archivos.",
  "side.client.required": "Cliente",
  "side.client.optional": "Cliente opcional",
  "side.client.unsupported": "Solo servidor",
  "side.server.required": "Servidor",
  "side.server.optional": "Servidor opcional",
  "side.server.unsupported": "Solo cliente",
}

/** The launcher has no i18n runtime yet, so the shared browser gets a plain
 *  dictionary. Its `t` is a prop precisely so a host without next-intl can do
 *  this instead of shipping one. */
const t: Translate = (key, values) => {
  const template = LABELS[key]
  if (template === undefined) {
    if (key === "loadMore") return `Cargar más (${values?.shown}/${values?.total})`
    if (key === "depsCount") return `${values?.count} dep.`
    return key
  }
  return template
}

type PendingEntry = {
  path: string
  sha512: string
  fileSize: number
  source: unknown
  projectId: string
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
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [urlBusy, setUrlBusy] = useState(false)
  const [added, setAdded] = useState<string[]>(addedProjectIds)

  const catalogLoader = catalogLoaderOf(loader ?? "")
  const addedRef = useRef(added)
  addedRef.current = added

  const isAdded = useCallback(
    (_platform: ModPlatform, projectId: string) => addedRef.current.includes(projectId),
    [],
  )

  const resolveEntry = useCallback(
    async (
      projectId: string,
      file: ModFile,
      projectType: CatalogProjectType,
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
      }
    },
    [],
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
        const pending = frontier.filter((d) => !known.has(d.projectId))
        frontier = []
        if (pending.length === 0) break

        const summaries = await getCatalog().projectSummaries(
          "modrinth",
          pending.map((d) => d.projectId),
        )
        const names = new Map<string, ModSearchHit>(summaries.map((s) => [s.projectId, s]))

        for (const dep of pending) {
          known.add(dep.projectId)
          const name = names.get(dep.projectId)?.name ?? dep.projectId
          setProgress(`Resolviendo dependencia: ${name}`)

          const files = await getCatalog().files("modrinth", dep.projectId, {
            gameVersion: minecraft,
            loader: catalogLoader,
          })
          const pick = bestFile(files)
          if (!pick) {
            skipped.push(name)
            continue
          }
          // Always "mod": a required dependency is a loadable jar whatever
          // depends on it — a shader's dependency is Iris, which is a mod, not
          // another shader.
          const entry = await resolveEntry(dep.projectId, pick, "mod")
          if (!entry) {
            skipped.push(name)
            continue
          }
          found.push(entry)
          frontier.push(...pick.dependencies.filter((d) => d.relation === "required"))
        }
      }
      return { found, skipped }
    },
    [catalogLoader, minecraft, resolveEntry],
  )

  const addPick = useCallback(
    async ({ hit, file, projectType }: BrowsePick) => {
      const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
      if (busyKey) return
      setBusyKey(key)
      setProgress("Añadiendo…")
      try {
        const entry = await resolveEntry(hit.projectId, file, projectType)
        if (!entry) {
          toast.error(`No se pudo añadir ${file.fileName}.`)
          return
        }
        const known = new Set(addedRef.current)
        known.add(hit.projectId)
        const { found, skipped } = await collectDependencies(file, known)

        // One write for the mod and its whole dependency closure: a save per
        // entry would leave the manifest half-updated if the last one failed.
        await addFiles(slug, [entry, ...found])
        setAdded([...addedRef.current, entry.projectId, ...found.map((f) => f.projectId)])

        if (skipped.length > 0) {
          toast({ tone: "warn", title: "Sin versión compatible", msg: skipped.join(", ") })
        } else if (found.length > 0) {
          toast.success(`${hit.name} y ${found.length} dependencia(s) añadidas.`)
        } else {
          toast.success(`${hit.name} añadido.`)
        }
        onChanged()
      } catch (err) {
        // ModBrowser calls this as `void onAdd(...)`, so anything thrown here
        // would otherwise become an unhandled rejection with no visible cause.
        toast.error((err as { message?: string })?.message ?? "No se pudo añadir el mod.")
      } finally {
        setBusyKey(null)
        setProgress(null)
      }
    },
    [busyKey, collectDependencies, onChanged, resolveEntry, slug],
  )

  /** The one path that must download to add: a raw URL has no published hash to
   *  borrow, and PackFile.sha512 is mandatory. */
  const addByUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || urlBusy) return
    setUrlBusy(true)
    setProgress("Descargando para calcular el hash…")
    try {
      const resolved = await getCatalog().resolve({ kind: "url", url: trimmed })
      if (!resolved) {
        toast.error("No se pudo añadir el enlace.")
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
      toast.success(`${name} añadido.`)
      onChanged()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "No se pudo añadir el enlace.")
    } finally {
      setUrlBusy(false)
      setProgress(null)
    }
  }, [onChanged, slug, url, urlBusy])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted hover:text-accent-bright"
        >
          <Icon name="back" size={13} /> Volver al pack
        </button>
        <span className="flex-1" />
        <div className="w-full max-w-[420px]">
          <Field label="Añadir por enlace" hint="Se descarga una vez para calcular su SHA-512.">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com/mod.jar"
              />
              <Button
                size="sm"
                icon="link"
                loading={urlBusy}
                disabled={urlBusy || !url.trim()}
                onClick={() => void addByUrl()}
              >
                Añadir
              </Button>
            </div>
          </Field>
        </div>
      </div>

      <ModBrowser
        t={t}
        platform="modrinth"
        onPlatformChange={() => {}}
        // One platform, so the toggle is hidden rather than rendered as a
        // single dead button.
        platforms={["modrinth"]}
        // Modrinth has no name sort; offering one would be a dead option.
        sorts={["downloads", "follows", "updated", "relevance"]}
        gameVersion={minecraft}
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
  )
}
