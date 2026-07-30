"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Select, Icon, Spinner } from "@boffmedia/ui"
import { AvPanel, AvAlert } from "../ui/av-kit"
import { ChampionsRegulation, SmogonSnapshot, VgcMetaService } from "@/services/api/boffmedia/vgcService"
import { useBoffSession } from "@/services/useBoffSession"

const CUTOFF_OPTIONS = [1760, 1630, 1500, 0]
const TH = "text-left font-mono text-[10px] uppercase tracking-[0.08em] text-txt-muted font-semibold py-2.5 px-4 border-b border-solid border-line"

export function VgcSmogonFetcher() {
  const t = useTranslations("admin.vgc")
  const { session } = useBoffSession()
  const token = session?.user?.accessToken ?? ""
  const [snapshots, setSnapshots] = useState<SmogonSnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([])

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
    VgcMetaService.getAvailableChampionsRegulations()
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
    setSuccess(null)
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
      setSuccess(t("smogon.importOk", { count: res.data?.count ?? 0 }))
      loadSnapshots()
    } catch {
      setError(t("smogon.importErr"))
    } finally {
      setFetching(false)
    }
  }

  const handleDelete = async (s: SmogonSnapshot) => {
    setDeletingId(s.id)
    setError(null)
    setSuccess(null)
    if (!token) {
      setError(t("invalidSession"))
      setDeletingId(null)
      return
    }
    try {
      await VgcMetaService.deleteSmogonSnapshot(s.formatId, s.month, s.cutoff, token)
      setSuccess(t("smogon.deleteOk", { format: s.formatId, month: s.month, cutoff: s.cutoff }))
      loadSnapshots()
    } catch {
      setError(t("smogon.deleteErr"))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-txt-muted">{t("smogon.intro")}</p>

      <AvPanel
        title={t("smogon.storedTitle")}
        icon="database"
        aside={
          <button onClick={loadSnapshots} aria-label={t("reload")} className="text-txt-dim hover:text-txt transition-colors">
            <Icon name="refresh" size={14} />
          </button>
        }
        flush
      >
        {loading ? (
          <div className="py-8 flex justify-center">
            <Spinner size={16} className="text-accent" />
          </div>
        ) : snapshots.length === 0 ? (
          <p className="py-6 text-center text-xs text-txt-dim">{t("smogon.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-panel-2">
                  <th className={TH}>{t("smogon.colFormat")}</th>
                  <th className={TH}>{t("smogon.colMonth")}</th>
                  <th className={TH}>{t("smogon.colCutoff")}</th>
                  <th className={TH}>{t("smogon.colPkm")}</th>
                  <th className={TH}>{t("smogon.colImported")}</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id} className="border-b border-solid border-line last:border-b-0 hover:bg-panel-2 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{s.formatId}</td>
                    <td className="px-4 py-2 text-txt-muted">{s.month}</td>
                    <td className="px-4 py-2 text-txt-muted">{s.cutoff === 0 ? t("smogon.cutoffAll") : `${s.cutoff}+`}</td>
                    <td className="px-4 py-2 text-txt-muted">{s.pokemonCount}</td>
                    <td className="px-4 py-2 text-txt-dim text-xs font-mono">{new Date(s.fetchedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={deletingId === s.id}
                        className="text-txt-dim hover:text-bad disabled:opacity-40 transition-colors"
                        aria-label={t("smogon.deleteTitle")}
                      >
                        {deletingId === s.id ? <Spinner size={14} /> : <Icon name="trash" size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        {success && <AvAlert tone="success" className="mt-3">{success}</AvAlert>}

        <div className="mt-4">
          <Button variant="pri" loading={fetching} disabled={fetching || !format} onClick={handleFetch}>
            {fetching ? t("smogon.importing") : t("smogon.import")}
          </Button>
        </div>
      </AvPanel>
    </div>
  )
}
