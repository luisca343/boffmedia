"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Modal, toast } from "@boffmedia/ui"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerConfig } from "@/services/api/boffmedia/randomizer.types"
import type { ApiResponse } from "@/services/http/core"

type LifecycleAction = "open" | "close" | "reopen" | "publish" | "delete"

const ACTIONS_BY_STATUS: Record<RandomizerConfig["status"], LifecycleAction[]> = {
  draft: ["open", "delete"],
  open: ["close"],
  closed: ["reopen", "publish"],
  published: [],
}

const CALLS: Record<LifecycleAction, (id: string) => Promise<ApiResponse<unknown>>> = {
  open: (id) => RandomizerService.openConfig(id),
  close: (id) => RandomizerService.closeConfig(id),
  reopen: (id) => RandomizerService.reopenConfig(id),
  publish: (id) => RandomizerService.publishConfig(id),
  delete: (id) => RandomizerService.deleteConfig(id),
}

interface LifecycleActionsProps {
  config: RandomizerConfig
  onChanged: () => void
}

export function LifecycleActions({ config, onChanged }: LifecycleActionsProps) {
  const t = useTranslations("randomizer.eventPanel.lifecycle")
  const tc = useTranslations("randomizer.eventPanel")
  const [confirming, setConfirming] = useState<LifecycleAction | null>(null)
  const [busy, setBusy] = useState<LifecycleAction | null>(null)

  const actions = ACTIONS_BY_STATUS[config.status]
  if (actions.length === 0) return null

  const run = async (action: LifecycleAction) => {
    setConfirming(null)
    setBusy(action)
    try {
      const res = await CALLS[action](config.id)
      if (res.success) {
        toast({ tone: "ok", title: t(`${action}Success`) })
        onChanged()
      } else {
        toast({ tone: "bad", title: t(`${action}Error`), msg: res.userMessage })
      }
    } catch (err) {
      toast({ tone: "bad", title: t(`${action}Error`), msg: String(err) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={
              action === "delete"
                ? "danger"
                : action === "open" || action === "publish"
                  ? "pri"
                  : "default"
            }
            icon={action === "delete" ? "trash" : undefined}
            onClick={() => setConfirming(action)}
            disabled={busy !== null}
            loading={busy === action}
          >
            {t(action)}
          </Button>
        ))}
      </div>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        size="sm"
        title={confirming ? t(`${confirming}ConfirmTitle`) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              {tc("cancel")}
            </Button>
            <Button
              variant={confirming === "delete" ? "danger" : "pri"}
              onClick={() => confirming && run(confirming)}
            >
              {tc("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-txt-muted">
          {confirming ? t(`${confirming}ConfirmMsg`, { name: config.gameTitle }) : ""}
        </p>
      </Modal>
    </>
  )
}
