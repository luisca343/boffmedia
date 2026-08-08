"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Input, Modal, Spinner, Empty, toast } from "@boffmedia/ui"
import { AvPanel, AvSectionHead, AvPill } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerConfig } from "@/services/api/boffmedia/randomizer.types"

const STATUS_TONE: Record<string, "amber" | "green" | "muted" | "warn"> = {
  draft: "amber",
  open: "warn",
  closed: "green",
  published: "muted",
}

const PLATFORM_LABELS: Record<"gba" | "nds", string> = {
  gba: "GBA",
  nds: "NDS",
}

interface ConfigsListProps {
  eventId: number
  onEdit: (config: RandomizerConfig) => void
  onShowAssignments: (config: RandomizerConfig) => void
}

export function ConfigsList({
  eventId,
  onEdit,
  onShowAssignments,
}: ConfigsListProps) {
  const t = useTranslations("randomizer.events")
  const [configs, setConfigs] = useState<RandomizerConfig[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<{
    action: "open" | "close" | "publish" | "delete"
    config: RandomizerConfig
  } | null>(null)

  useEffect(() => {
    if (eventId) {
      loadConfigs()
    } else {
      setConfigs(null)
    }
  }, [eventId])

  const loadConfigs = async () => {
    if (!eventId) return
    setLoading(true)
    try {
      // A config is 1:1 with an event, so "the list" is at most one row.
      // getEventConfig returns the config for any status (settings gated to
      // published, which the list doesn't display); success:false => no config.
      const res = await RandomizerService.getEventConfig(eventId)
      const cfg = res.success && "data" in res ? (res.data as RandomizerConfig) : null
      setConfigs(cfg ? [cfg] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoading"), msg: String(err) })
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async (config: RandomizerConfig) => {
    if (config.status !== "draft") return
    setConfirming(null)
    setActionInProgress(config.id)
    try {
      const res = await RandomizerService.openConfig(config.id)
      if (res.success) {
        toast({ tone: "ok", title: t("configOpened") })
        await loadConfigs()
      } else {
        toast({ tone: "bad", title: t("openError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const handleClose = async (config: RandomizerConfig) => {
    if (config.status !== "open") return
    setConfirming(null)
    setActionInProgress(config.id)
    try {
      const res = await RandomizerService.closeConfig(config.id)
      if (res.success) {
        toast({ tone: "ok", title: t("configClosed") })
        await loadConfigs()
      } else {
        toast({ tone: "bad", title: t("closeError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const handlePublish = async (config: RandomizerConfig) => {
    if (config.status !== "closed") return
    setConfirming(null)
    setActionInProgress(config.id)
    try {
      const res = await RandomizerService.publishConfig(config.id)
      if (res.success) {
        toast({ tone: "ok", title: t("configPublished") })
        await loadConfigs()
      } else {
        toast({ tone: "bad", title: t("publishError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDelete = async (config: RandomizerConfig) => {
    if (config.status !== "draft") return
    setConfirming(null)
    setActionInProgress(config.id)
    try {
      const res = await RandomizerService.deleteConfig(config.id)
      if (res.success) {
        toast({ tone: "ok", title: t("configDeleted") })
        await loadConfigs()
      } else {
        toast({ tone: "bad", title: t("deleteError"), msg: res.userMessage })
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const filtered = (configs ?? []).filter(
    (c) =>
      c.gameTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gamePlatform.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!eventId) {
    return (
      <Empty
        title={t("selectEvent")}
        lead={t("selectEventDesc")}
        icon="home"
      />
    )
  }

  return (
    <div className="space-y-5">
      <AvSectionHead
        title={t("configs")}
        actions={
          <Button onClick={() => loadConfigs()} disabled={loading}>
            {loading ? <Spinner size={16} /> : <Icon name="refresh" size={16} />}
            {t("refresh")}
          </Button>
        }
      />

      <AvPanel>
        <Input
          placeholder={t("searchConfigs")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </AvPanel>

      {loading && !configs ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("loadingConfigs")}</span>
          </div>
        </AvPanel>
      ) : filtered.length === 0 ? (
        <Empty
          title={t("noConfigs")}
          lead={t("noConfigsDesc")}
          icon="calendar"
        />
      ) : (
        <AvPanel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-semibold">{t("colStatus")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colPlatform")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colTitle")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colCreatedAt")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((config) => (
                  <tr
                    key={config.id}
                    className="border-b border-line hover:bg-panel-2 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <AvPill tone={STATUS_TONE[config.status] ?? "muted"}>
                        {t(`status_${config.status}`)}
                      </AvPill>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-txt-muted font-mono">
                        {PLATFORM_LABELS[config.gamePlatform] || config.gamePlatform}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{config.gameTitle}</td>
                    <td className="px-3 py-2 text-txt-muted">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(config)}
                          disabled={config.status !== "draft"}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onShowAssignments(config)}
                        >
                          {t("assignments")}
                        </Button>
                        {config.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirming({ action: "open", config })}
                            disabled={actionInProgress === config.id}
                          >
                            {actionInProgress === config.id ? (
                              <Spinner size={14} />
                            ) : (
                              t("open")
                            )}
                          </Button>
                        )}
                        {config.status === "open" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirming({ action: "close", config })}
                            disabled={actionInProgress === config.id}
                          >
                            {actionInProgress === config.id ? (
                              <Spinner size={14} />
                            ) : (
                              t("close")
                            )}
                          </Button>
                        )}
                        {config.status === "closed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirming({ action: "publish", config })}
                            disabled={actionInProgress === config.id}
                          >
                            {actionInProgress === config.id ? (
                              <Spinner size={14} />
                            ) : (
                              t("publish")
                            )}
                          </Button>
                        )}
                        {config.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title={t("delete")}
                            onClick={() => setConfirming({ action: "delete", config })}
                            disabled={actionInProgress === config.id}
                          >
                            <Icon name="trash" size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AvPanel>
      )}

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        size="sm"
        title={confirming ? t(`${confirming.action}ConfirmTitle`) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant={confirming?.action === "delete" ? "danger" : "pri"}
              onClick={() => {
                if (!confirming) return
                if (confirming.action === "open") handleOpen(confirming.config)
                else if (confirming.action === "close") handleClose(confirming.config)
                else if (confirming.action === "publish") handlePublish(confirming.config)
                else handleDelete(confirming.config)
              }}
            >
              {t("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-txt-muted">
          {confirming
            ? t(`${confirming.action}ConfirmMsg`, { name: confirming.config.gameTitle })
            : ""}
        </p>
      </Modal>
    </div>
  )
}
