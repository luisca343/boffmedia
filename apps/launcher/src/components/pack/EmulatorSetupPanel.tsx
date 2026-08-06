import { useCallback, useEffect, useRef, useState } from "react"

import { Badge, Button, Panel, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  emulatorClearPath,
  emulatorSetPath,
  emulatorStatus,
  instanceProvideUserFile,
  instanceUserFilesScan,
} from "../../runtime"
import type { EmulatorStatus, UserFile } from "../../runtime"
import { formatBytes } from "../../utils/format"

/** What players read instead of a wire enum. */
const KIND_LABEL: Record<string, string> = {
  mgba: "mGBA (Game Boy Advance)",
  melonds: "melonDS (Nintendo DS)",
}

/** Everything an emulator pack needs set up before Play works, in one panel:
 *
 *  1. Which emulator will launch, and where it was found. A pack never ships
 *     one — the Rust side resolves the player's own install (their setting,
 *     then EmuDeck's folders, then common locations, then PATH), so their
 *     controls and shaders apply untouched. Not found → offer the picker and
 *     recommend EmuDeck.
 *  2. The `user-provided` files (ROM dumps). On mount the library auto-scan
 *     runs — EmuDeck's `Emulation/roms/<system>` dirs plus the player's own —
 *     so for most set-ups the ROM is found without a single click. The manual
 *     picker stays as the fallback, and every path hash-verifies the dump.
 */
export function EmulatorSetupPanel({
  packId,
  manifestFor,
  onChanged,
}: {
  packId: string
  manifestFor: (packId: string) => Promise<unknown>
  /** Fired when a file lands, so the parent can rescan the install state. */
  onChanged: () => void
}) {
  const t = useT("packDetail")
  const [manifest, setManifest] = useState<unknown>(null)
  const [kind, setKind] = useState<string | null>(null)
  const [emulator, setEmulator] = useState<EmulatorStatus | null>(null)
  const [files, setFiles] = useState<UserFile[]>([])
  const [scanning, setScanning] = useState(false)
  const [locating, setLocating] = useState(false)
  const [providing, setProviding] = useState<string | null>(null)
  // The mount-time auto-scan must run once per pack, not on every re-render of
  // the parent — a scan sweeps directories and hashes candidates.
  const scannedFor = useRef<string | null>(null)

  const runScan = useCallback(
    async (m: unknown, opts?: { toastOnFound?: boolean }) => {
      setScanning(true)
      try {
        const result = await instanceUserFilesScan(m)
        setFiles(result.files)
        if (result.found > 0) {
          onChanged()
          if (opts?.toastOnFound) {
            toast.success(t("emulator.scanFound", { count: result.found }))
          }
        }
        return result
      } finally {
        setScanning(false)
      }
    },
    [onChanged, t],
  )

  useEffect(() => {
    let alive = true
    void manifestFor(packId)
      .then(async (m) => {
        if (!alive || !m) return
        setManifest(m)
        const emuKind =
          (m as { version?: { emulator?: { kind?: string } } }).version?.emulator?.kind ?? null
        setKind(emuKind)
        if (emuKind) {
          void emulatorStatus(emuKind).then((s) => {
            if (alive) setEmulator(s)
          })
        }
        if (scannedFor.current !== packId) {
          scannedFor.current = packId
          // Plug and play: the first open sweeps the player's library so a ROM
          // already sitting in EmuDeck's folders satisfies itself silently.
          await runScan(m, { toastOnFound: true })
        } else {
          const result = await instanceUserFilesScan(m)
          if (alive) setFiles(result.files)
        }
      })
      .catch(() => {
        /* an unreachable registry already surfaces elsewhere */
      })
    return () => {
      alive = false
    }
  }, [packId, manifestFor, runScan])

  const locate = useCallback(async () => {
    if (!kind) return
    setLocating(true)
    try {
      setEmulator(await emulatorSetPath(kind))
    } catch (err) {
      const message = (err as { message?: string })?.message
      if (message && message !== t("userFiles.cancelled")) toast.error(message)
    } finally {
      setLocating(false)
    }
  }, [kind, t])

  const clearOverride = useCallback(async () => {
    if (!kind) return
    try {
      setEmulator(await emulatorClearPath(kind))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulator.error"))
    }
  }, [kind, t])

  const provide = useCallback(
    async (path: string) => {
      if (!manifest) return
      setProviding(path)
      try {
        setFiles(await instanceProvideUserFile(manifest, path))
        onChanged()
      } catch (err) {
        const message = (err as { message?: string })?.message
        if (message && message !== t("userFiles.cancelled")) toast.error(message)
      } finally {
        setProviding(null)
      }
    },
    [manifest, onChanged, t],
  )

  const missing = files.filter((f) => !f.satisfied).length
  const ready = emulator?.path != null && missing === 0

  return (
    <Panel
      title={t("emulator.title")}
      aside={
        ready ? (
          <Badge tone="ok">{t("emulator.ready")}</Badge>
        ) : (
          <Badge tone="bad">{t("emulator.setupPending")}</Badge>
        )
      }
      className="mb-4"
    >
      {/* ── The emulator itself ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-black/20 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm text-txt">{(kind && KIND_LABEL[kind]) ?? kind ?? "—"}</p>
          {emulator?.path ? (
            <p className="truncate font-mono text-[11px] text-txt-dim">
              {emulator.path}
              {emulator.source === "emudeck" && " · EmuDeck"}
              {emulator.source === "override" && ` · ${t("emulator.manualPath")}`}
            </p>
          ) : (
            <p className="text-[11px] text-txt-dim">{t("emulator.notFound")}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" icon="folder" loading={locating} onClick={() => void locate()}>
            {emulator?.path ? t("emulator.change") : t("emulator.locate")}
          </Button>
          {emulator?.source === "override" && (
            <Button size="sm" onClick={() => void clearOverride()}>
              {t("emulator.useAuto")}
            </Button>
          )}
        </div>
      </div>
      {!emulator?.path && (
        <p className="mt-2 text-xs text-txt-dim">{t("emulator.emudeckHint")}</p>
      )}

      {/* ── The player's files (ROM dumps) ──────────────────────────────── */}
      {files.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-txt-dim">{t("userFiles.lead")}</p>
            <Button size="sm" icon="refresh" loading={scanning} onClick={() => void (manifest && runScan(manifest, { toastOnFound: true }).then((r) => { if (r.found === 0) toast.info(t("emulator.scanNone")) }))}>
              {t("emulator.scan")}
            </Button>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {files.map((file) => (
              <li
                key={file.path}
                className="flex items-center justify-between gap-4 rounded-sm border border-line bg-black/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-txt">{file.hint}</p>
                  <p className="truncate font-mono text-[11px] text-txt-dim">
                    {file.path} · {formatBytes(file.size)}
                  </p>
                </div>
                {file.satisfied ? (
                  <Badge tone="ok">{t("userFiles.provided")}</Badge>
                ) : (
                  <Button
                    size="sm"
                    icon="upload"
                    loading={providing === file.path}
                    onClick={() => void provide(file.path)}
                  >
                    {t("userFiles.provide")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
