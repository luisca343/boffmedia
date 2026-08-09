"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, Icon, Modal, Spinner, toast } from "@boffmedia/ui"
import { AvPanel, AvPill } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerAssignment } from "@/services/api/boffmedia/randomizer.types"

const STATUS_TONE: Record<RandomizerAssignment["status"], "amber" | "green" | "default" | "muted"> = {
  pending: "amber",
  claimed: "default",
  patched: "green",
  verified: "muted",
}

const STATUS_KEY: Record<RandomizerAssignment["status"], string> = {
  pending: "statusPending",
  claimed: "statusClaimed",
  patched: "statusPatched",
  verified: "statusVerified",
}

interface AssignmentsPanelProps {
  configId: string
}

export function AssignmentsPanel({ configId }: AssignmentsPanelProps) {
  const t = useTranslations("randomizer.eventPanel.assignments")
  const [assignments, setAssignments] = useState<RandomizerAssignment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [loadingLogId, setLoadingLogId] = useState<number | null>(null)

  useEffect(() => {
    loadAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId])

  const loadAssignments = async () => {
    setLoading(true)
    try {
      const res = await RandomizerService.listConfigAssignments(configId)
      setAssignments(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoading"), msg: String(err) })
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewLog = async (assignment: RandomizerAssignment) => {
    setLoadingLogId(assignment.id)
    try {
      const res = await RandomizerService.readConfigLog(configId, String(assignment.id))
      // `!= null` rather than truthy: an empty log is a real (if odd) answer,
      // and reporting it as "could not load the log" sends you looking for a
      // network problem that is not there.
      if (res.success && res.data != null) {
        setSelectedLog(res.data)
      } else {
        toast({
          tone: "bad",
          title: t("errorLoadingLog"),
          msg: res.userMessage || t("unknownError"),
        })
      }
    } catch (err) {
      toast({ tone: "bad", title: t("errorLoadingLog"), msg: String(err) })
    } finally {
      setLoadingLogId(null)
    }
  }

  if (loading && !assignments) {
    return (
      <AvPanel>
        <div className="flex items-center justify-center py-8 gap-2">
          <Spinner />
          <span className="text-txt-muted">{t("loading")}</span>
        </div>
      </AvPanel>
    )
  }

  if ((assignments ?? []).length === 0) {
    return <Empty title={t("empty")} lead={t("emptyDesc")} icon="users" />
  }

  return (
    <>
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
                    {assignment.displayName}
                  </td>
                  <td className="px-3 py-2">
                    <AvPill tone={STATUS_TONE[assignment.status] ?? "muted"}>
                      {t(STATUS_KEY[assignment.status] ?? "statusPending")}
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
                    {assignment.outputSha512 ? (
                      <code className="text-xs bg-panel-2 px-2 py-1 rounded">
                        {assignment.outputSha512.slice(0, 16)}…
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
                      disabled={loadingLogId === assignment.id}
                    >
                      {loadingLogId === assignment.id ? (
                        <Spinner size={14} />
                      ) : (
                        <Icon name="message" size={14} />
                      )}
                      {t("viewLog")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AvPanel>

      <Modal
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        size="lg"
        title={t("judgeLog")}
        footer={
          <Button onClick={() => setSelectedLog(null)}>{t("close")}</Button>
        }
      >
        {/* A spoiler log runs to thousands of lines; without a capped height the
            modal grows past the viewport and the close button goes with it. */}
        <pre className="bg-panel-2 p-4 text-xs max-h-[60vh] overflow-auto whitespace-pre-wrap break-words">
          {selectedLog}
        </pre>
      </Modal>
    </>
  )
}
