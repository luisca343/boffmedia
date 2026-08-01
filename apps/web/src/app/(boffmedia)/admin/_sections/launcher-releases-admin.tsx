"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, Field, Icon, Input, Select, Spinner, Textarea, toast } from "@boffmedia/ui"
import type { LauncherReleaseEntity } from "@boffmedia/shared"

import {
  LauncherReleasesService,
  type LauncherTarget,
} from "@/services/api/boffmedia/launcherReleasesService"
import { AvAlert, AvKpi, AvKpis, AvPanel, AvPill, AvSectionHead } from "../_components/ui/av-kit"

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const TARGETS: { value: LauncherTarget; labelKey: string }[] = [
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

export function LauncherReleasesAdmin() {
  const t = useTranslations("admin.releases")
  const [rows, setRows] = useState<LauncherReleaseEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState("")
  const [target, setTarget] = useState<LauncherTarget>("windows-x86_64")
  const [notes, setNotes] = useState("")
  const [artifact, setArtifact] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await LauncherReleasesService.list()
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

      const response = await LauncherReleasesService.upload(
        { version: cleanVersion, target, notes },
        artifact,
        signature,
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

  const togglePublished = async (release: LauncherReleaseEntity) => {
    setBusyId(release.id)
    try {
      const response = release.published
        ? await LauncherReleasesService.unpublish(release.id)
        : await LauncherReleasesService.publish(release.id)
      if (!response.success) {
        toast({
          tone: "bad",
          title: release.published ? t("unpublishFailed") : t("publishFailed"),
          msg: response.userMessage ?? t("tryAgain"),
        })
        return
      }
      toast({ tone: "ok", title: release.published ? t("unpublished") : t("published") })
      await reload()
    } catch {
      toast({
        tone: "bad",
        title: release.published ? t("unpublishFailed") : t("publishFailed"),
        msg: t("tryAgain"),
      })
    } finally {
      setBusyId(null)
    }
  }

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      toast({ tone: "ok", title: t("hashCopied") })
    } catch {
      toast({ tone: "bad", title: t("hashCopyFailed") })
    }
  }

  const publishedCount = rows.filter((release) => release.published).length

  return (
    <div>
      <AvSectionHead
        title={t("title")}
        desc={t("desc")}
        actions={
          <Button size="sm" variant="ghost" icon="refresh" onClick={() => void reload()} loading={loading}>
            {t("refresh")}
          </Button>
        }
      />

      <AvAlert tone="info" title={t("securityTitle")} className="mb-[18px]">
        {t("securityLead")}
      </AvAlert>

      <AvKpis>
        <AvKpi label={t("kpiTotal")} value={rows.length} icon="layers" />
        <AvKpi label={t("kpiPublished")} value={publishedCount} icon="globe" live />
        <AvKpi label={t("kpiDrafts")} value={rows.length - publishedCount} icon="bookmark" />
      </AvKpis>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.5fr)]">
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
              onChange={(value) => setTarget(value as LauncherTarget)}
              disabled={uploading}
              options={TARGETS.map((option) => ({ value: option.value, label: t(`targets.${option.labelKey}`) }))}
            />

            <Field label={t("artifact")} hint={artifact?.name ?? t("artifactHint")}>
              <input
                type="file"
                accept=".msi,.exe,.zip,.tar.gz,.AppImage.tar.gz,.app.tar.gz"
                disabled={uploading}
                onChange={(event) => setArtifact(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer border border-line-2 bg-base px-3 py-2 text-[13px] text-txt file:mr-3 file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-bold file:uppercase file:text-accent"
              />
            </Field>

            <Field label={t("signature")} hint={signatureFile?.name ?? t("signatureHint")}>
              <input
                type="file"
                accept=".sig,.txt"
                disabled={uploading}
                onChange={(event) => setSignatureFile(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer border border-line-2 bg-base px-3 py-2 text-[13px] text-txt file:mr-3 file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-bold file:uppercase file:text-accent"
              />
            </Field>

            <Field label={t("notes")} hint={t("notesHint")}>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} disabled={uploading} />
            </Field>

            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
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
            <div className="flex min-h-[240px] items-center justify-center">
              <Spinner size={30} className="text-accent" />
            </div>
          ) : rows.length === 0 ? (
            <Empty icon="download" title={t("emptyTitle")} lead={t("emptyLead")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-txt-dim">
                    <th className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.1em]">{t("colRelease")}</th>
                    <th className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.1em]">{t("colArtifact")}</th>
                    <th className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.1em]">{t("colStatus")}</th>
                    <th className="px-2 py-2 text-right font-mono text-[10px] uppercase tracking-[0.1em]">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((release) => {
                    const publishedAt = asText(release.publishedAt)
                    const notesText = asText(release.notes)
                    return (
                      <tr key={release.id} className="border-b border-line last:border-0">
                        <td className="px-2 py-3 align-top">
                          <div className="font-display text-[15px] font-bold text-txt">{release.version}</div>
                          <div className="mt-1 font-mono text-[10px] text-txt-dim">{release.target}</div>
                          {notesText && <p className="mt-2 max-w-[260px] text-[12px] leading-[1.4] text-txt-muted">{notesText}</p>}
                        </td>
                        <td className="px-2 py-3 align-top">
                          <div className="max-w-[260px] truncate font-mono text-[11px] text-txt" title={release.artifactName}>
                            {release.artifactName}
                          </div>
                          <div className="mt-1 text-[12px] text-txt-dim">{formatBytes(release.sizeBytes)}</div>
                          {/* El hash completo se publica en /launcher para que la
                              gente verifique su descarga, así que tiene que poder
                              copiarse entero: seleccionarlo a mano de un <code>
                              truncado no es copiarlo. */}
                          <button
                            type="button"
                            title={release.artifactSha512}
                            onClick={() => void copyHash(release.artifactSha512)}
                            className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-txt-dim transition-colors hover:text-accent"
                          >
                            <Icon name="copy" size={11} />
                            {release.artifactSha512.slice(0, 12)}…
                          </button>
                        </td>
                        <td className="px-2 py-3 align-top">
                          <AvPill tone={release.published ? "green" : "amber"} icon={release.published ? "check" : "bookmark"}>
                            {release.published ? t("publishedStatus") : t("draftStatus")}
                          </AvPill>
                          {publishedAt && <time className="mt-2 block text-[11px] text-txt-dim" dateTime={publishedAt}>{new Date(publishedAt).toLocaleString()}</time>}
                        </td>
                        <td className="px-2 py-3 text-right align-top">
                          <Button
                            size="sm"
                            variant={release.published ? "ghost" : "pri"}
                            icon={release.published ? "x" : "check"}
                            loading={busyId === release.id}
                            onClick={() => void togglePublished(release)}
                          >
                            {release.published ? t("unpublish") : t("publish")}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AvPanel>
      </div>
    </div>
  )
}
