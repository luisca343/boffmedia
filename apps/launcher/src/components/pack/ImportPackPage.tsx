import { useCallback, useState } from "react"

import {
  Button,
  type BrowsePick,
  Field,
  Icon,
  Input,
  ModBrowser,
  Spinner,
  type Translate,
  toast,
} from "@boffmedia/ui"

// Registers the Modrinth-backed catalog client. Side-effect import, same as the
// mod browser's.
import "../../services/catalog"
import { importMrpack, importMrpackUrl } from "../../runtime"

// "Importar un modpack" — the three ways in, on one page.
//
//   1. Browse Modrinth's modpacks and pick a version.
//   2. Paste a link (project page, version page, or a direct .mrpack).
//   3. Open a .mrpack file already on disk.
//
// All three end in the same Rust command pair, and both of those end in the
// same converter (mrpack.rs). An imported pack is a LOCAL pack from that point
// on — editable, launchable and re-exportable exactly like one built by hand.
//
// A page rather than a modal, for the same reason the mod browser is one: the
// browser is three panes wide and the results list is the whole point.

const LABELS: Record<string, string> = {
  platformModrinth: "Modrinth",
  platformCurseforge: "CurseForge",
  modSearchPlaceholder: "Buscar modpacks…",
  projectType: "Tipo",
  "type.modpack": "Modpacks",
  sort: "Orden",
  "sortBy.downloads": "Descargas",
  "sortBy.follows": "Seguidores",
  "sortBy.updated": "Actualizado",
  "sortBy.relevance": "Relevancia",
  categories: "Categorías",
  allCategories: "Todas",
  noModResults: "Ningún modpack coincide con la búsqueda.",
  added: "Importado",
  close: "Cerrar",
  linkSource: "Código",
  linkIssues: "Incidencias",
  linkWebsite: "Web",
  files: "Versiones",
  compatibleOnly: "Compatibles",
  allFiles: "Todas",
  loadingFiles: "Cargando versiones…",
  noCompatibleFiles: "Este proyecto no publica ninguna versión descargable.",
  "releaseType.release": "Estable",
  "releaseType.beta": "Beta",
  "releaseType.alpha": "Alpha",
  resolving: "Importando…",
  addMod: "Importar",
  notDistributable: "No descargable",
  notDistributableLead: "El autor no permite la descarga automática de estos archivos.",
  "side.client.required": "Cliente",
  "side.client.optional": "Cliente opcional",
  "side.client.unsupported": "Solo servidor",
  "side.server.required": "Servidor",
  "side.server.optional": "Servidor opcional",
  "side.server.unsupported": "Solo cliente",
}

const t: Translate = (key, values) => {
  const template = LABELS[key]
  if (template === undefined) {
    if (key === "loadMore") return `Cargar más (${values?.shown}/${values?.total})`
    if (key === "depsCount") return `${values?.count} dep.`
    return key
  }
  return template
}

export function ImportPackPage({
  onBack,
  onImported,
}: {
  onBack: () => void
  /** Reload the library; the caller also decides whether to leave this page. */
  onImported: () => void
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [urlBusy, setUrlBusy] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)

  /** The one place an import result becomes a message. Every entry point funnels
   *  through it so a collision rename is reported the same way whichever route
   *  the player took (RF-09: never a silent rename). */
  const announce = useCallback(
    (result: { manifest: { pack: { name: string } }; renamed: boolean }) => {
      toast.success(
        result.renamed
          ? `Importado como «${result.manifest.pack.name}» (había un pack con ese nombre).`
          : `Pack «${result.manifest.pack.name}» importado.`,
      )
      onImported()
    },
    [onImported],
  )

  const importPick = useCallback(
    async ({ hit, file }: BrowsePick) => {
      const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
      if (busyKey) return
      setBusyKey(key)
      setProgress(`Descargando ${hit.name}…`)
      try {
        // A version URL rather than a bare id: the Rust resolver matches on
        // both the version number and the version id, and this shape is the one
        // a player could also have pasted by hand.
        announce(await importMrpackUrl(`https://modrinth.com/modpack/${hit.slug}/version/${file.fileId}`))
      } catch (err) {
        // ModBrowser calls this as `void onAdd(...)`, so a throw here would
        // otherwise surface as an unhandled rejection with no visible cause.
        toast.error((err as { message?: string })?.message ?? "No se pudo importar el modpack.")
      } finally {
        setBusyKey(null)
        setProgress(null)
      }
    },
    [announce, busyKey],
  )

  const importByUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || urlBusy) return
    setUrlBusy(true)
    setProgress("Descargando el pack…")
    try {
      announce(await importMrpackUrl(trimmed))
      setUrl("")
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "No se pudo importar el enlace.")
    } finally {
      setUrlBusy(false)
      setProgress(null)
    }
  }, [announce, url, urlBusy])

  const importFromFile = useCallback(async () => {
    if (fileBusy) return
    setFileBusy(true)
    try {
      announce(await importMrpack())
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "No se pudo importar el .mrpack."
      // Cancelling the native picker is not a failure worth shouting about.
      if (!message.startsWith("Importación cancelada")) toast.error(message)
    } finally {
      setFileBusy(false)
    }
  }, [announce, fileBusy])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 py-7">
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted hover:text-accent-bright"
        >
          <Icon name="back" size={13} /> Volver a la biblioteca
        </button>
        <span className="flex-1" />
        <Button size="sm" icon="upload" loading={fileBusy} onClick={() => void importFromFile()}>
          Desde archivo .mrpack
        </Button>
        <div className="w-full max-w-[440px]">
          <Field
            label="Importar por enlace"
            hint="Página del modpack en Modrinth, una versión concreta o un .mrpack directo."
          >
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://modrinth.com/modpack/…"
              />
              <Button
                size="sm"
                icon="link"
                loading={urlBusy}
                disabled={urlBusy || !url.trim()}
                onClick={() => void importByUrl()}
              >
                Importar
              </Button>
            </div>
          </Field>
        </div>
      </div>

      <ModBrowser
        t={t}
        platform="modrinth"
        onPlatformChange={() => {}}
        platforms={["modrinth"]}
        // The only type here. A modpack is not something you add TO a pack, so
        // the selector is a single dead option and stays hidden.
        projectTypes={["modpack"]}
        sorts={["downloads", "follows", "updated", "relevance"]}
        // A modpack declares its own Minecraft version; there is nothing to
        // filter against yet, which is exactly the case ModBrowser allows an
        // empty version for.
        gameVersion=""
        // Nothing is ever marked as already imported: the same pack CAN be
        // imported twice (the second copy is renamed), and greying the button
        // out would block a legitimate "start over from a clean copy".
        isAdded={() => false}
        onAdd={importPick}
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
