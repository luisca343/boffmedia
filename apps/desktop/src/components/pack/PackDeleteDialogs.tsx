import { useState } from "react"

import { Button, Modal, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import { instanceDelete, localPackDelete } from "../../runtime"

/** Shared by the library grid and the pack detail: a local pack is deleted
 *  WHOLE — its manifest, its installed instance and its backups all go — so the
 *  copy is unambiguous that nothing is recoverable. The Rust `local_pack_delete`
 *  is what actually removes all three; this only confirms intent and reports the
 *  outcome. `onDone` runs once the delete succeeds (reload the library, and on
 *  the detail screen also navigate away). */
export function DeleteLocalPackModal({
  open,
  slug,
  name,
  onClose,
  onDone,
}: {
  open: boolean
  slug: string
  name: string
  onClose: () => void
  onDone: () => void
}) {
  const t = useT("packs")
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await localPackDelete(slug)
      toast.success(t("deleteLocalSuccess", { name }))
      onDone()
      onClose()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("deleteLocalError"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("deleteLocalTitle")}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-txt-muted">{t("deleteLocalWarning", { name })}</p>
        <p className="text-xs text-txt-dim">{t("deleteLocalDetail")}</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            {t("cancelButton")}
          </Button>
          <Button size="sm" variant="danger" icon="trash" loading={busy} onClick={() => void confirm()}>
            {t("deleteButton")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/** Uninstall a MANAGED pack: only the installed files go, so the copy promises
 *  the pack stays in the library and can be reinstalled. Backups are kept. The
 *  caller must not open this while the game is running; the confirm button is
 *  also guarded on `blocked` as a second line of defence. */
export function UninstallPackModal({
  open,
  slug,
  name,
  blocked,
  onClose,
  onDone,
}: {
  open: boolean
  slug: string
  name: string
  blocked?: boolean
  onClose: () => void
  onDone: () => void
}) {
  const t = useT("packs")
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await instanceDelete(slug)
      toast.success(t("uninstallSuccess", { name }))
      onDone()
      onClose()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("uninstallError"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("uninstallTitle")}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-txt-muted">{t("uninstallWarning", { name })}</p>
        <p className="text-xs text-txt-dim">{t("uninstallDetail")}</p>
        {blocked && <p className="text-xs text-bad">{t("cannotWhileRunning")}</p>}
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            {t("cancelButton")}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            loading={busy}
            disabled={blocked}
            onClick={() => void confirm()}
          >
            {t("uninstallButton")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
