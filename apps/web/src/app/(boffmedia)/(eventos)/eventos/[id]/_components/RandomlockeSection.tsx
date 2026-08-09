"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, toast, Spinner } from "@boffmedia/ui"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"

export interface EventConfig {
  id: string
  eventId: number
  gamePlatform: string
  gameTitle: string
  cleanRomSha512: string
  romHint: string | null
  fvxJarSha512: string
  settingsBlobSha512?: string | null
  status: "draft" | "open" | "closed" | "published"
  createdAt: string
}

// Mirrors PublicAssignmentDto. The server sends `displayName` (joined from
// boffMediaUsers), never `participantName`/`outputHash` — the old shape here
// left the participant column blank on the public results table, exactly as it
// did on the admin one.
export interface ConfigAssignment {
  id: number
  configId: number
  displayName: string
  status: "pending" | "claimed" | "patched" | "verified"
  seed?: number | null
  outputSha512: string | null
  createdAt: string
}

export function RandomlockeSection({ eventId }: { eventId: number }) {
  const t = useTranslations("events.detail")
  const [config, setConfig] = useState<EventConfig | null>(null)
  const [assignments, setAssignments] = useState<ConfigAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const configResponse = await RandomizerService.getEventConfig(eventId)

        if (!configResponse.success || !("data" in configResponse) || !configResponse.data) {
          // No config for this event — that's OK, just hide the section
          setConfig(null)
          setLoading(false)
          return
        }

        const cfg = configResponse.data as EventConfig
        setConfig(cfg)

        const assignResponse = await RandomizerService.getPublicAssignments(eventId)
        if (assignResponse.success && "data" in assignResponse && assignResponse.data) {
          setAssignments(assignResponse.data as ConfigAssignment[])
        }
      } catch (err) {
        console.error("Failed to load randomlocke config:", err)
        setError(t("randomlockeLoadError"))
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [eventId, t])

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-dim mb-4">
          {t("randomlockeTitle")}
        </h2>
        <div className="grid place-items-center py-8">
          <Spinner />
        </div>
      </section>
    )
  }

  if (!config) {
    return null
  }

  return (
    <section className="mb-8">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-dim mb-4">
        {t("randomlockeTitle")}
      </h2>

      {error && (
        <div className="border border-solid border-bad bg-panel px-4 py-3 text-sm text-bad mb-4">
          {error}
        </div>
      )}

      <RandomlockeConfig config={config} assignments={assignments} />
    </section>
  )
}

function RandomlockeConfig({
  config,
  assignments,
}: {
  config: EventConfig
  assignments: ConfigAssignment[]
}) {
  const t = useTranslations("events.detail")
  const isPublished = config.status === "published"

  const statusTitle = isPublished ? t("randomlockeFinished") : t("randomlockeRunning")

  return (
    <div className="mb-6 border border-solid border-line bg-panel overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-line bg-panel-alt">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-mono text-[12px] font-semibold uppercase text-txt">
            {config.gameTitle} ({config.gamePlatform.toUpperCase()})
          </h3>
          <div className="flex items-center gap-3 shrink-0">
            {assignments.length > 0 && (
              <span className="font-mono text-[10px] text-txt-dim">
                {t("randomlockeParticipants", { count: assignments.length })}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
                isPublished ? "text-ok" : "text-accent-bright"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-ok" : "bg-accent animate-pulse"}`}
              />
              {statusTitle}
            </span>
          </div>
        </div>
        {config.romHint && (
          <p className="font-body text-[11px] text-txt-muted">{config.romHint}</p>
        )}
      </div>

      {/* Status table or published results */}
      {isPublished ? (
        <RandomlockePublishedView config={config} assignments={assignments} />
      ) : (
        <RandomlockeRunningView assignments={assignments} />
      )}
    </div>
  )
}

function RandomlockeRunningView({
  assignments,
}: {
  assignments: ConfigAssignment[]
}) {
  const t = useTranslations("events.detail")

  if (assignments.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
          {t("randomlockeEmpty")}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-2 text-left font-mono font-semibold uppercase text-txt-dim text-[10px]">
              {t("randomlockeParticipant")}
            </th>
            <th className="px-4 py-2 text-left font-mono font-semibold uppercase text-txt-dim text-[10px]">
              {t("randomlockeStatus")}
            </th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} className="border-b border-line-2 hover:bg-panel-alt">
              <td className="px-4 py-2 text-txt">{a.displayName}</td>
              <td className="px-4 py-2">
                <StatusBadge status={a.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RandomlockePublishedView({
  config,
  assignments,
}: {
  config: EventConfig
  assignments: ConfigAssignment[]
}) {
  const t = useTranslations("events.detail")
  const [downloadingSettings, setDownloadingSettings] = useState(false)

  if (assignments.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
          {t("randomlockeEmpty")}
        </p>
      </div>
    )
  }

  const handleDownloadSettings = async () => {
    try {
      setDownloadingSettings(true)
      const blob = await RandomizerService.downloadConfigSettings(config.eventId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `settings-${config.id}.rnqs`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("randomlockeDownloadError"))
    } finally {
      setDownloadingSettings(false)
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-2 text-left font-mono font-semibold uppercase text-txt-dim text-[10px]">
                {t("randomlockeParticipant")}
              </th>
              <th className="px-4 py-2 text-left font-mono font-semibold uppercase text-txt-dim text-[10px]">
                {t("randomlockeSeed")}
              </th>
              <th className="px-4 py-2 text-left font-mono font-semibold uppercase text-txt-dim text-[10px]">
                {t("randomlockeOutput")}
              </th>
              <th className="px-4 py-2 text-left font-mono font-semibold uppercase text-txt-dim text-[10px]">
                {t("randomlockeLog")}
              </th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b border-line-2 hover:bg-panel-alt">
                <td className="px-4 py-2 text-txt">{a.displayName}</td>
                <td className="px-4 py-2 font-mono text-txt-muted">
                  {a.seed !== undefined && a.seed !== null ? (
                    <CopyableText text={String(a.seed)} />
                  ) : (
                    <span className="text-txt-dim">—</span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-txt-muted text-[11px]">
                  {a.outputSha512 ? (
                    <CopyableText
                      text={a.outputSha512.substring(0, 16)}
                      full={a.outputSha512}
                    />
                  ) : (
                    <span className="text-txt-dim">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <LogDownloadButton eventId={config.eventId} assignmentId={String(a.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification section */}
      <div className="px-4 py-4 border-t border-line bg-panel-alt">
        <details className="group">
          <summary className="cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-txt-muted flex items-center gap-2">
            <span className="transition-transform group-open:rotate-90">›</span>
            {t("randomlockeVerifyTitle")}
          </summary>

          <div className="mt-3 space-y-2 font-body text-[12px] text-txt-muted">
            <p>{t("randomlockeVerifyHint")}</p>

            <div className="bg-panel p-3 rounded border border-line-2 font-mono text-[11px] overflow-x-auto">
              <span className="block mb-1 text-txt-dim">{t("randomlockeVerifyCommand")}</span>
              <code className="text-ok whitespace-nowrap block">
                java --enable-preview -Xmx4096m -jar fvx.jar cli -i clean.rom -o out.rom -s
                settings.rnqs --seed [seed] -l
              </code>
            </div>

            {config.settingsBlobSha512 && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="default"
                  icon="download"
                  disabled={downloadingSettings}
                  onClick={handleDownloadSettings}
                >
                  {t("randomlockeSettings")}
                </Button>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: "pending" | "claimed" | "patched" | "verified"
}) {
  const t = useTranslations("events.detail")

  const colors: Record<typeof status, string> = {
    pending: "bg-panel-alt text-txt-dim",
    claimed: "bg-accent-soft text-accent-bright",
    patched: "bg-ok-soft text-ok",
    verified: "text-ok",
  }

  const labels: Record<typeof status, string> = {
    pending: t("randomlockeStatusPending"),
    claimed: t("randomlockeStatusClaimed"),
    patched: t("randomlockeStatusPatched"),
    verified: t("randomlockeStatusVerified"),
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${colors[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function CopyableText({ text, full }: { text: string; full?: string }) {
  const t = useTranslations("events.detail")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const toCopy = full || text
    navigator.clipboard.writeText(toCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 border-0 bg-transparent p-0 font-mono text-inherit cursor-pointer hover:text-accent-bright transition-colors"
      title={copied ? t("randomlockeCopied") : full ? `${t("randomlockeCopy")}: ${full}` : t("randomlockeCopy")}
    >
      {text}
      {copied ? (
        <span className="text-ok">✓</span>
      ) : (
        <Icon name="copy" size={11} className="text-txt-dim" />
      )}
    </button>
  )
}

function LogDownloadButton({
  eventId,
  assignmentId,
}: {
  eventId: number
  assignmentId: string
}) {
  const t = useTranslations("events.detail")
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const blob = await RandomizerService.downloadPublicLog(eventId, assignmentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `log-${assignmentId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("randomlockeDownloadError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="default"
      icon="download"
      disabled={loading}
      onClick={handleDownload}
    >
      {t("randomlockeDownload")}
    </Button>
  )
}
