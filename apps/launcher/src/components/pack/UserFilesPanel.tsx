import { useCallback, useEffect, useState } from "react"

import { Badge, Button, Panel, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import { instanceProvideUserFile, instanceUserFiles } from "../../runtime"
import type { UserFile } from "../../runtime"
import { formatBytes } from "../../utils/format"

/** The files this pack cannot download for the player — ROM dumps and the
 *  like (`source: user-provided` in the manifest). Renders nothing for a pack
 *  that declares none, which is every Minecraft pack, so PackDetail can mount
 *  it unconditionally for emulator packs.
 *
 *  The picker, the hash check and the blob-store copy all live on the Rust
 *  side (`instance_provide_user_file`); this panel only shows the checklist
 *  and relays its errors — the wrong-dump message is the command's own. */
export function UserFilesPanel({
  packId,
  manifestFor,
  onChanged,
}: {
  packId: string
  manifestFor: (packId: string) => Promise<unknown>
  /** Fired after a file lands, so the parent can rescan the install state. */
  onChanged: () => void
}) {
  const t = useT("packDetail")
  const [files, setFiles] = useState<UserFile[]>([])
  const [manifest, setManifest] = useState<unknown>(null)
  const [providing, setProviding] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void manifestFor(packId)
      .then(async (m) => {
        if (!alive || !m) return
        setManifest(m)
        const list = await instanceUserFiles(m)
        if (alive) setFiles(list)
      })
      .catch(() => {
        /* an unreachable registry already surfaces elsewhere; the checklist
           simply stays empty */
      })
    return () => {
      alive = false
    }
  }, [packId, manifestFor])

  const provide = useCallback(
    async (path: string) => {
      if (!manifest) return
      setProviding(path)
      try {
        const list = await instanceProvideUserFile(manifest, path)
        setFiles(list)
        onChanged()
      } catch (err) {
        const message = (err as { message?: string })?.message
        // A cancelled picker is not an error worth toasting about.
        if (message && message !== t("userFiles.cancelled")) {
          toast.error(message)
        }
      } finally {
        setProviding(null)
      }
    },
    [manifest, onChanged, t],
  )

  if (files.length === 0) return null

  const missing = files.filter((f) => !f.satisfied).length

  return (
    <Panel
      title={t("userFiles.title")}
      aside={
        missing > 0 ? (
          <Badge tone="bad">{t("userFiles.missingCount", { count: missing })}</Badge>
        ) : (
          <Badge tone="ok">{t("userFiles.complete")}</Badge>
        )
      }
      className="mb-4"
    >
      <p className="mb-3 text-xs text-txt-dim">{t("userFiles.lead")}</p>
      <ul className="flex flex-col gap-2">
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
    </Panel>
  )
}
