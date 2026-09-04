"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Button, ConfirmDialog, Empty, Field, Icon, Input, ReleaseRow, Select, Spinner, Textarea, toast } from "@boffmedia/ui"
import type { DesktopReleaseEntity } from "@/services/api/boffmedia/desktopReleasesService"

import {
  DesktopReleasesService,
  type DesktopTarget,
} from "@/services/api/boffmedia/desktopReleasesService"
import { AvAlert, AvKpi, AvKpis, AvPanel, AvPill, AvSectionHead, formatAdminDate } from "../_components/ui/av-kit"
import { useStepUp } from "../_components/hooks/useStepUp"

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const TARGETS: { value: DesktopTarget; labelKey: string }[] = [
  { value: "windows-x86_64", labelKey: "windows" },
  { value: "linux-x86_64", labelKey: "linux" },
  { value: "darwin-x86_64", labelKey: "macIntel" },
  { value: "darwin-aarch64", labelKey: "macApple" },
]

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes
  let unit = "B"
  for (const next of units) {
    value /= 1024
    unit = next
    if (value < 1024 || next === "GB") break
  }
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} ${unit}`
}

export function DesktopReleasesAdmin() {
  const t = useTranslations("admin.releases")
  // Uploading and publishing both change what runs on someone else's machine,
  // so both ask for a fresh code rather than riding the admin session alone.
  const { requestStepUp, stepUpDialog } = useStepUp()
  const [rows, setRows] = useState<DesktopReleaseEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState("")
  const [target, setTarget] = useState<DesktopTarget>("windows-x86_64")
  const [notes, setNotes] = useState("")
  const [artifact, setArtifact] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [confirmPublish, setConfirmPublish] = useState<DesktopReleaseEntity | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingRollout, setEditingRollout] = useState<string>("")
  const [rolloutLoading, setRolloutLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await DesktopReleasesService.list()
      if (!response.success) {
        setError(response.userMessage ?? t("loadFailed"))
        return
      }
      setRows(response.data ?? [])
    } catch {
      setError(t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void reload()
  }, [reload])

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const cleanVersion = version.trim()

    if (!VERSION_RE.test(cleanVersion)) {
      toast({ tone: "bad", title: t("uploadFailed"), msg: t("versionInvalid") })
      return
    }
    if (!artifact || !signatureFile) {
      toast({ tone: "bad", title: t("uploadFailed"), msg: t("filesRequired") })
      return
    }

    setUploading(true)
    try {
      const signature = await signatureFile.text()
      if (!signature.trim()) {
        toast({ tone: "bad", title: t("uploadFailed"), msg: t("signatureEmpty") })
        return
      }

      const stepUpToken = await requestStepUp()
      if (!stepUpToken) return

      const response = await DesktopReleasesService.upload(
        { version: cleanVersion, target, notes },
        artifact,
        signature,
        stepUpToken,
      )
      if (!response.success || !response.data) {
        toast({ tone: "bad", title: t("uploadFailed"), msg: response.userMessage ?? t("tryAgain") })
        return
      }

      toast({ tone: "ok", title: t("uploaded"), msg: t("draftCreated") })
      setVersion("")
      setNotes("")
      setArtifact(null)
      setSignatureFile(null)
      form.reset()
      await reload()
    } catch {
      toast({ tone: "bad", title: t("uploadFailed"), msg: t("tryAgain") })
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmPublish = async () => {
    if (!confirmPublish) return
    setBusyId(confirmPublish.id)
    try {
      const stepUpToken = await requestStepUp()
      if (!stepUpToken) return

      const response = confirmPublish.published
        ? await DesktopReleasesService.unpublish(confirmPublish.id, stepUpToken)
        : await DesktopReleasesService.publish(confirmPublish.id, stepUpToken)
      if (!response.success) {
        toast({
          tone: "bad",
          title: confirmPublish.published ? t("unpublishFailed") : t("publishFailed"),
          msg: response.userMessage ?? t("tryAgain"),
        })
        return
      }
      toast({ tone: "ok", title: confirmPublish.published ? t("unpublished") : t("published") })
      setConfirmPublish(null)
      await reload()
    } catch {
      toast({
        tone: "bad",
        title: confirmPublish.published ? t("unpublishFailed") : t("publishFailed"),
        msg: t("tryAgain"),
      })
    } finally {
      setBusyId(null)
    }
  }

  const togglePublished = (release: DesktopReleaseEntity) => {
    setConfirmPublish(release)
  }

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      toast({ tone: "ok", title: t("hashCopied") })
    } catch {
      toast({ tone: "bad", title: t("hashCopyFailed") })
    }
  }

  const handleTogglePause = async (release: DesktopReleaseEntity) => {
    setBusyId(release.id)
    try {
      const stepUpToken = await requestStepUp()
      if (!stepUpToken) {
        setBusyId(null)
        return
      }

      const response = release.paused
        ? await DesktopReleasesService.resume(release.id, stepUpToken)
        : await DesktopReleasesService.pause(release.id, stepUpToken)
      if (!response.success) {
        toast({
          tone: "bad",
          title: release.paused ? t("resumeFailed") : t("pauseFailed"),
          msg: response.userMessage ?? t("tryAgain"),
        })
        return
      }
      toast({ tone: "ok", title: release.paused ? t("resumed") : t("paused") })
      await reload()
    } catch {
      toast({
        tone: "bad",
        title: release.paused ? t("resumeFailed") : t("pauseFailed"),
        msg: t("tryAgain"),
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleRolloutChange = async (release: DesktopReleaseEntity) => {
    const percent = Number.parseInt(editingRollout, 10)
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      toast({ tone: "bad", title: t("rolloutFailed"), msg: t("rolloutInvalid") })
      return
    }

    setRolloutLoading(true)
    try {
      const stepUpToken = await requestStepUp()
      if (!stepUpToken) {
        setRolloutLoading(false)
        return
      }

      const response = await DesktopReleasesService.setRollout(release.id, percent, stepUpToken)
      if (!response.success) {
        toast({
          tone: "bad",
          title: t("rolloutFailed"),
          msg: response.userMessage ?? t("tryAgain"),
        })
        return
      }
      toast({ tone: "ok", title: t("rolloutUpdated") })
      setExpandedId(null)
      setEditingRollout("")
      await reload()
    } catch {
      toast({ tone: "bad", title: t("rolloutFailed"), msg: t("tryAgain") })
    } finally {
      setRolloutLoading(false)
    }
  }

  const publishedCount = rows.filter((release) => release.published).length

  return (
    <div>
      {stepUpDialog}
      <AvSectionHead
        title={t("title")}
        desc={t("desc")}
        actions={
          <Button size="sm" variant="ghost" icon="refresh" onClick={() => void reload()} loading={loading}>
            {t("refresh")}
          </Button>
        }
      />

      <AvAlert tone="info" title={t("securityTitle")} className="mb-[1.125rem]">
        {t("securityLead")}
      </AvAlert>

      <AvKpis>
        <AvKpi label={t("kpiTotal")} value={rows.length} icon="layers" />
        <AvKpi label={t("kpiPublished")} value={publishedCount} icon="globe" live />
        <AvKpi label={t("kpiDrafts")} value={rows.length - publishedCount} icon="bookmark" />
      </AvKpis>

      <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.5fr)]">
        <AvPanel title={t("uploadTitle")} icon="upload">
          <form className="grid gap-4" onSubmit={(event) => void upload(event)}>
            <Field label={t("version")} hint={t("versionHint")}>
              <Input
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="0.0.2"
                autoComplete="off"
                disabled={uploading}
              />
            </Field>

            <Select
              label={t("target")}
              value={target}
              onChange={(value) => setTarget(value as DesktopTarget)}
              disabled={uploading}
              options={TARGETS.map((option) => ({ value: option.value, label: t(`targets.${option.labelKey}`) }))}
            />

            <Field label={t("artifact")} hint={artifact?.name ?? t("artifactHint")}>
              <input
                type="file"
                accept=".msi,.exe,.zip,.tar.gz,.AppImage.tar.gz,.app.tar.gz"
                disabled={uploading}
                onChange={(event) => setArtifact(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer border border-line-2 bg-base px-3 py-2 text-[0.8125rem] text-txt file:mr-3 file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-mono file:text-[0.625rem] file:font-bold file:uppercase file:text-accent"
              />
            </Field>

            <Field label={t("signature")} hint={signatureFile?.name ?? t("signatureHint")}>
              <input
                type="file"
                accept=".sig,.txt"
                disabled={uploading}
                onChange={(event) => setSignatureFile(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer border border-line-2 bg-base px-3 py-2 text-[0.8125rem] text-txt file:mr-3 file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-mono file:text-[0.625rem] file:font-bold file:uppercase file:text-accent"
              />
            </Field>

            <Field label={t("notes")} hint={t("notesHint")}>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} disabled={uploading} />
            </Field>

            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">
                {t("draftNotice")}
              </span>
              <Button type="submit" variant="pri" icon="upload" loading={uploading}>
                {t("upload")}
              </Button>
            </div>
          </form>
        </AvPanel>

        <AvPanel title={t("listTitle")} icon="layers" aside={<AvPill tone="muted">{rows.length}</AvPill>}>
          {error ? (
            <AvAlert tone="error" title={t("loadFailed")}>
              {error}
            </AvAlert>
          ) : loading ? (
            <div className="flex min-h-[15rem] items-center justify-center">
              <Spinner size={30} className="text-accent" />
            </div>
          ) : rows.length === 0 ? (
            <Empty icon="download" title={t("emptyTitle")} lead={t("emptyLead")} />
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((release) => {
                const publishedAt = asText(release.publishedAt)
                const isExpanded = expandedId === release.id
                return (
                  <div key={release.id}>
                    <ReleaseRow
                      published={release.published}
                      version={release.version}
                      target={release.target}
                      meta={<>{release.artifactName} · {formatBytes(release.sizeBytes)}</>}
                      hashShort={`${release.artifactSha512.slice(0, 12)}…`}
                      hashFull={release.artifactSha512}
                      onCopyHash={() => void copyHash(release.artifactSha512)}
                      copyLabel={t("copyHash")}
                      date={publishedAt ? formatAdminDate(publishedAt) : undefined}
                      actions={
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" icon={isExpanded ? "collapse" : "chevronDown"} onClick={() => setExpandedId(isExpanded ? null : release.id)}>
                            {t("details")}
                          </Button>
                          <Button size="sm" variant={release.published ? "ghost" : "pri"} icon={release.published ? "x" : "check"} loading={busyId === release.id} onClick={() => void togglePublished(release)}>
                            {release.published ? t("unpublish") : t("publish")}
                          </Button>
                        </div>
                      }
                    />
                    {isExpanded && (
                      <div className="border-t border-line px-4 py-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-txt-dim mb-2">
                            {t("rolloutPercent")}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editingRollout || release.rolloutPercent}
                              onChange={(event) => setEditingRollout(event.target.value)}
                              disabled={rolloutLoading}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="pri"
                              onClick={() => void handleRolloutChange(release)}
                              loading={rolloutLoading}
                            >
                              {t("apply")}
                            </Button>
                          </div>
                          <p className="text-xs text-txt-dim mt-1">{t("rolloutHint")}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={release.paused ? "pri" : "ghost"}
                            icon={release.paused ? "play" : "pause"}
                            loading={busyId === release.id}
                            onClick={() => void handleTogglePause(release)}
                          >
                            {release.paused ? t("resume") : t("pause")}
                          </Button>
                          {release.paused && (
                            <span className="text-xs text-warn font-medium">{t("pausedWarning")}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </AvPanel>
      </div>

      <ConfirmDialog
        open={confirmPublish !== null}
        title={confirmPublish?.published ? t("confirmUnpublish") : t("confirmPublish")}
        body={confirmPublish ? t(confirmPublish.published ? "confirmUnpublishLead" : "confirmPublishLead", { version: confirmPublish.version }) : ""}
        tone={confirmPublish?.published ? "error" : "warning"}
        onClose={() => setConfirmPublish(null)}
        onConfirm={() => void handleConfirmPublish()}
      />
    </div>
  )
}
