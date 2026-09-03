import { useCallback, useState } from "react"

import {
  BackLink,
  Button,
  type BrowsePick,
  Field,
  Input,
  ModBrowser,
  Spinner,
  toast,
} from "@boffmedia/ui"

// Registers the Modrinth-backed catalog client. Side-effect import, same as the
// mod browser's.
import "../../services/catalog"
import { useT } from "../../i18n"
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

export function ImportPackPage({
  onBack,
  onImported,
}: {
  onBack: () => void
  /** Reload the library; the caller also decides whether to leave this page. */
  onImported: () => void
}) {
  const t = useT("importPack")
  // The shared ModBrowser resolves its own key set from the labels sub-namespace.
  const browserLabels = useT("importPack.labels")
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
          ? t("importedRenamedMessage", { name: result.manifest.pack.name })
          : t("importedMessage", { name: result.manifest.pack.name }),
      )
      onImported()
    },
    [onImported, t],
  )

  const importPick = useCallback(
    async ({ hit, file }: BrowsePick) => {
      const key = `${hit.platform}:${hit.projectId}:${file.fileId}`
      if (busyKey) return
      setBusyKey(key)
      setProgress(t("downloadingPack", { name: hit.name }))
      try {
        // A version URL rather than a bare id: the Rust resolver matches on
        // both the version number and the version id, and this shape is the one
        // a player could also have pasted by hand.
        announce(await importMrpackUrl(`https://modrinth.com/modpack/${hit.slug}/version/${file.fileId}`))
      } catch (err) {
        // ModBrowser calls this as `void onAdd(...)`, so a throw here would
        // otherwise surface as an unhandled rejection with no visible cause.
        toast.error((err as { message?: string })?.message ?? t("importPackError"))
      } finally {
        setBusyKey(null)
        setProgress(null)
      }
    },
    [announce, busyKey, t],
  )

  const importByUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || urlBusy) return
    setUrlBusy(true)
    setProgress(t("downloadingFile"))
    try {
      announce(await importMrpackUrl(trimmed))
      setUrl("")
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("importLinkError"))
    } finally {
      setUrlBusy(false)
      setProgress(null)
    }
  }, [announce, t, url, urlBusy])

  const importFromFile = useCallback(async () => {
    if (fileBusy) return
    setFileBusy(true)
    try {
      announce(await importMrpack())
    } catch (err) {
      const message = (err as { message?: string })?.message ?? t("importFileError")
      // Cancelling the native picker is not a failure worth shouting about. The
      // Rust side emits this cancel message in Spanish regardless of UI locale,
      // so the guard matches the Spanish string on purpose.
      if (!message.startsWith("Importación cancelada")) toast.error(message)
    } finally {
      setFileBusy(false)
    }
  }, [announce, fileBusy, t])

  return (
    // h-full, not flex-1: this renders straight into the shell's <main>, which
    // is a block scroll container — flex-1 does nothing there and the page just
    // grows, which keeps ModBrowser's infinite-scroll sentinel in view and
    // chain-loads pages forever. Bounded, the result grid scrolls instead.
    <div className="flex h-full flex-col gap-4 px-8 py-7">
      {/* The bare `BackLink` atom, not a `SectionBar`: like BrowsePage, this
          link shares its row with a labelled field, and the bar owns a whole
          row of its own. */}
      <div className="flex flex-wrap items-end gap-3">
        <BackLink label={t("backButton")} onBack={onBack} className="mb-1" />
        <span className="flex-1" />
        <Button size="sm" icon="upload" loading={fileBusy} onClick={() => void importFromFile()}>
          {t("fileButton")}
        </Button>
        <div className="w-full max-w-[27.5rem]">
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
                onClick={() => void importByUrl()}
              >
                {t("importButton")}
              </Button>
            </div>
          </Field>
        </div>
      </div>

      <ModBrowser
        t={browserLabels}
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
        <span className="flex shrink-0 items-center gap-2 font-mono text-[0.6875rem] text-txt-dim">
          <Spinner size={12} /> {progress}
        </span>
      )}
    </div>
  )
}
