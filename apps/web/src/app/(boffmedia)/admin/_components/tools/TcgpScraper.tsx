"use client"

import { useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { ToolPanel } from "@/components/boffmedia/primitives/tool-panel"
import { PtcgpService } from "@/services/api/boffmedia/ptcgpService"

type Step = "idle" | "series" | "sets" | "cards" | "done" | "error"

interface ProgressState {
  step: Step
  totalSets?: number
  doneSets?: number
  failedSets?: number
  message?: string
}

export function TcgpScraper() {
  const [progress, setProgress] = useState<ProgressState>({ step: "idle" })

  const triggerFetch = async () => {
    setProgress({ step: "series", message: "Obteniendo series…" })
    try {
      await PtcgpService.fetchAndStoreSeries()
      setProgress({ step: "sets", message: "Obteniendo colecciones…" })
      await PtcgpService.fetchAndStoreSetsForSeries("tcgp")
      setProgress({ step: "cards", message: "Obteniendo cartas…" })
      const results = await PtcgpService.fetchAndStoreAllCardsForSeries("tcgp")
      const successful = results.data?.filter(r => !r.error) ?? []
      const failed = results.data?.filter(r => r.error) ?? []
      setProgress({
        step: "done",
        totalSets: results.data?.length ?? 0,
        doneSets: successful.length,
        failedSets: failed.length,
        message: `${successful.length} colecciones actualizadas${failed.length > 0 ? `, ${failed.length} fallidas` : ""}`,
      })
    } catch (error) {
      setProgress({ step: "error", message: error instanceof Error ? error.message : "Error desconocido" })
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-lg font-bold text-ink">TCG Pocket Scraper</h3>
        <p className="text-sm text-ink-muted mt-1">
          Obtiene cartas de Pokémon TCG Pocket desde la API externa y las almacena en la base de datos.
        </p>
      </div>

      <ToolPanel title="Scraping">
        {progress.step === "idle" ? (
          <p className="text-sm text-ink-muted">
            Pulsa el botón para empezar. El proceso descarga series, colecciones y cartas secuencialmente.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {(progress.step === "series" || progress.step === "sets" || progress.step === "cards") && (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              )}
              {progress.step === "done" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              )}
              {progress.step === "error" && (
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              )}
              <span className={`text-sm font-medium ${
                progress.step === "done" ? "text-emerald-400" :
                progress.step === "error" ? "text-red-400" :
                "text-amber-400"
              }`}>
                {progress.step === "series" ? "Obteniendo series…" :
                 progress.step === "sets"   ? "Obteniendo colecciones…" :
                 progress.step === "cards"  ? "Obteniendo cartas…" :
                 progress.step === "done"   ? "Actualización completada" :
                 "Error"}
              </span>
            </div>
            {progress.message && (
              <p className="text-sm text-ink-muted">{progress.message}</p>
            )}
            {progress.step === "done" && progress.totalSets != null && (
              <p className="text-xs text-ink-dim">
                {progress.doneSets}/{progress.totalSets} colecciones procesadas
                {progress.failedSets && progress.failedSets > 0
                  ? ` (${progress.failedSets} con errores)`
                  : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <BoffButton
            onClick={triggerFetch}
            disabled={progress.step === "series" || progress.step === "sets" || progress.step === "cards"}
          >
            {(progress.step === "series" || progress.step === "sets" || progress.step === "cards") ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando…</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" />Cargar datos</>
            )}
          </BoffButton>

          {progress.step === "done" && (
            <BoffButton variant="outline" onClick={() => setProgress({ step: "idle" })}>
              Reiniciar
            </BoffButton>
          )}
        </div>
      </ToolPanel>
    </div>
  )
}
