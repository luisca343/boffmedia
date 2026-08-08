"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Spinner, Empty, toast } from "@boffmedia/ui"
import { AvPanel, AvSectionHead, AvPill } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerConfig, RandomizerAssignment } from "@/services/api/boffmedia/randomizer.types"

const STATUS_TONE: Record<string, "amber" | "green" | "muted" | "warn"> = {
  pending: "amber",
  claimed: "warn",
  patched: "green",
  verified: "muted",
}

interface ConfigAssignmentsListProps {
  config: RandomizerConfig | null
  onClose: () => void
}

export function ConfigAssignmentsList({ config, onClose }: ConfigAssignmentsListProps) {
  const t = useTranslations("randomizer.events")
  const [assignments, setAssignments] = useState<RandomizerAssignment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [loadingLog, setLoadingLog] = useState(false)

  useEffect(() => {
    if (config) {
      loadAssignments()
    }
  }, [config])

  const loadAssignments = async () => {
    if (!config) return
    setLoading(true)
    try {
      const res = await RandomizerService.listConfigAssignments(config.id)
      setAssignments(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoading"), msg: String(err) })
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewLog = async (assignment: RandomizerAssignment) => {
    if (!config) return
    setLoadingLog(true)
    try {
      const res = await RandomizerService.readConfigLog(config.id, assignment.id)
      if (res.success && res.data) {
        setSelectedLog(res.data)
        setLogModalOpen(true)
      } else {
        toast({ tone: "bad", title: t("errorLoadingLog"), msg: res.userMessage || t("unknownError") })
      }
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingLog"), msg: String(err) })
    } finally {
      setLoadingLog(false)
    }
  }

  if (!config) {
    return (
      <Empty
        title={t("selectConfig")}
        lead={t("selectConfigDesc")}
        icon="calendar"
      />
    )
  }

  return (
    <div className="space-y-5">
      <AvSectionHead
        title={t("assignmentsFor", { event: config.gameTitle })}
        actions={
          <Button onClick={onClose} variant="ghost" size="sm">
            {t("back")}
          </Button>
        }
      />

      {loading && !assignments ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("loadingAssignments")}</span>
          </div>
        </AvPanel>
      ) : (assignments ?? []).length === 0 ? (
        <Empty
          title={t("noAssignments")}
          lead={t("noAssignmentsDesc")}
          icon="users"
        />
      ) : (
        <AvPanel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-semibold">{t("colParticipant")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colStatus")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colSealed")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colOutputHash")}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(assignments ?? []).map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-line hover:bg-panel-2 transition-colors"
                  >
                    <td className="px-3 py-2 font-medium">
                      {assignment.participantName || assignment.participantId}
                    </td>
                    <td className="px-3 py-2">
                      <AvPill tone={STATUS_TONE[assignment.status] ?? "muted"}>
                        {t(`status_${assignment.status}`)}
                      </AvPill>
                    </td>
                    <td className="px-3 py-2">
                      {assignment.seedSealed ? (
                        <Icon name="lock" size={16} className="text-txt-muted" />
                      ) : (
                        <span className="text-txt-dim text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {assignment.outputHash || assignment.outputSha512 ? (
                        <code className="text-xs bg-panel-2 px-2 py-1 rounded">
                          {(assignment.outputHash || assignment.outputSha512)!.slice(0, 16)}…
                        </code>
                      ) : (
                        <span className="text-txt-dim text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewLog(assignment)}
                        disabled={loadingLog}
                      >
                        {loadingLog ? <Spinner size={14} /> : <Icon name="message" size={14} />}
                        {t("viewLog")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AvPanel>
      )}

      {/* Log Modal */}
      {logModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <AvPanel className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("judgeLog")}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogModalOpen(false)}
              >
                <Icon name="x" size={16} />
              </Button>
            </div>
            <pre className="bg-panel-2 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">
              {selectedLog}
            </pre>
            <div className="mt-4">
              <Button onClick={() => setLogModalOpen(false)} className="w-full">
                {t("close")}
              </Button>
            </div>
          </AvPanel>
        </div>
      )}
    </div>
  )
}
