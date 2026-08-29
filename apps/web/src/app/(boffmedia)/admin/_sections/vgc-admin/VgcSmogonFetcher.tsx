"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select, Icon, Spinner, toast, Table, ConfirmDialog } from "@boffmedia/ui"
import { AvPanel, AvAlert, formatAdminDate } from "../../_components/ui/av-kit"
import { ChampionsRegulation, SmogonSnapshot, VgcMetaService } from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

const CUTOFF_OPTIONS = [1760, 1630, 1500, 0]

export function VgcSmogonFetcher() {
  const t = useTranslations("admin.vgc")
  const tCrud = useTranslations("admin.crud")
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ""
  const [snapshots, setSnapshots] = useState<SmogonSnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SmogonSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])
  const [success, setSuccess] = useState<string | null>(null)

  const [format, setFormat] = useState("")
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [cutoff, setCutoff] = useState(1760)

  const loadSnapshots = () => {
    setLoading(true)
    VgcMetaService.getAvailableSnapshots()
      .then((res) => setSnapshots(res.data ?? []))
      .catch(() => setError(t("smogon.loadErr")))
      .finally(() => setLoading(false))
  }

  const loadRegulations = () => {
    VgcMetaService.getRegulations()
      .then((res) => {
        const regs = res.data ?? []
        setRegulations(regs)
        if (!format && regs.length > 0) setFormat(regs[0].formatId)
      })
      .catch(() => setError(t("smogon.loadRegErr")))
  }

  useEffect(() => {
    loadSnapshots()
    loadRegulations()
  }, [])

  useEffect(() => {
    const onRegulationsUpdated = () => loadRegulations()
    window.addEventListener("vgc-regulations-updated", onRegulationsUpdated)
    return () => window.removeEventListener("vgc-regulations-updated", onRegulationsUpdated)
  }, [])

  const handleFetch = async () => {
    setFetching(true)
    setError(null)
    if (!token) {
      setError(t("invalidSession"))
      setFetching(false)
      return
    }
    if (!format) {
      setError(t("smogon.noFormat"))
      setFetching(false)
      return
    }
    try {
      const res = await VgcMetaService.fetchSmogonSnapshot(format, month, cutoff, token)
      const msg = t("smogon.importOk", { count: res.data?.count ?? 0 })
      toast.success(msg)
      loadSnapshots()
    } catch {
      const msg = t("smogon.importErr")
      setError(msg)
      toast.error(msg)
    } finally {
      setFetching(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    setError(null)
    if (!token) {
      setError(t("invalidSession"))
      setDeletingId(null)
      return
    }
    try {
      await VgcMetaService.deleteSmogonSnapshot(deleteTarget.formatId, deleteTarget.month, deleteTarget.cutoff, token)
      const msg = t("smogon.deleteOk", { format: deleteTarget.formatId, month: deleteTarget.month, cutoff: deleteTarget.cutoff })
      toast.success(msg)
      loadSnapshots()
    } catch {
      const msg = t("smogon.deleteErr")
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingId(null)
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleDeleteRequest = (s: SmogonSnapshot) => {
    setDeleteTarget(s)
    setDeleteConfirmOpen(true)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-txt-muted">{t("smogon.intro")}</p>

      <AvPanel title={t("smogon.storedTitle")} icon="database" flush>
        <Table
          columns={[
            { label: t("smogon.colFormat"), key: "format" },
            { label: t("smogon.colMonth"), key: "month" },
            { label: t("smogon.colCutoff"), key: "cutoff" },
            { label: t("smogon.colPkm"), key: "pkm" },
            { label: t("smogon.colImported"), key: "imported" },
            { label: "", key: "actions", srOnly: true },
          ]}
          rows={snapshots.map((s) => ({
            format: <span className="font-mono text-xs">{s.formatId}</span>,
            month: <span className="text-txt-muted">{s.month}</span>,
            cutoff: <span className="text-txt-muted">{s.cutoff === 0 ? t("smogon.cutoffAll") : `${s.cutoff}+`}</span>,
            pkm: <span className="text-txt-muted">{s.pokemonCount}</span>,
            imported: <span className="text-txt-dim text-xs font-mono">{formatAdminDate(s.fetchedAt, { time: true })}</span>,
            actions: (
              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                loading={deletingId === s.id}
                disabled={deletingId === s.id}
                onClick={() => handleDeleteRequest(s)}
                aria-label={t("smogon.deleteTitle")}
              />
            ),
          }))}
          rowKey={(_, i) => i}
        />
      </AvPanel>

      <AvPanel title={t("smogon.importTitle")} icon="download">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label={t("smogon.format")}
            value={format}
            options={regulations.map((r) => ({ value: r.formatId, label: `${r.name} · ${r.formatId}` }))}
            onChange={setFormat}
          />
          <Field label={t("smogon.month")}>
            <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="2026-03" pattern="\d{4}-\d{2}" />
          </Field>
          <Select
            label={t("smogon.cutoff")}
            value={String(cutoff)}
            options={CUTOFF_OPTIONS.map((c) => ({ value: String(c), label: c === 0 ? t("smogon.cutoffAll") : `${c}+` }))}
            onChange={(v) => setCutoff(Number(v))}
          />
        </div>

        {error && <AvAlert tone="error" className="mt-3">{error}</AvAlert>}

        <div className="mt-4">
          <Button variant="pri" loading={fetching} disabled={fetching || !format} onClick={handleFetch}>
            {fetching ? t("smogon.importing") : t("smogon.import")}
          </Button>
        </div>
      </AvPanel>

      {deleteTarget && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          title={t("smogon.deleteTitle")}
          body={`${deleteTarget.formatId} ${deleteTarget.month} (${deleteTarget.cutoff === 0 ? t("smogon.cutoffAll") : `${deleteTarget.cutoff}+`})`}
          tone="error"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirmOpen(false)}
          confirmLabel={tCrud("deleteAction")}
        />
      )}
    </div>
  )
}
