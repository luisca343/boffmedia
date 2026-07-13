"use client"

import { useEffect, useState } from "react"
import { useGetPerformance } from "@/hooks/_main/useGetPerformance"
import { Bar, Card, Icon, type IconName, PageHead, Skeleton } from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { TONES, type Tone } from "../../_utils/tones"

const POLL_MS = 4000
const HISTORY_MAX = 24

function tpsBand(tps: number): { tone: Tone; label: string } {
  if (tps < 10) return { tone: "danger", label: "Estado crítico" }
  if (tps < 18) return { tone: "warn", label: "Estado regular" }
  return { tone: "ok", label: "Estado óptimo" }
}

function StatCard({
  label,
  sub,
  icon,
  value,
  tone,
  pct,
}: {
  label: string
  sub: string
  icon: IconName
  value: string
  tone: Tone
  pct: number | null
}) {
  const t = TONES[tone]
  return (
    <Card dep={tone} className="min-w-0 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="font-gt-display text-base font-bold text-gt-ink-900">{label}</div>
          <div className="font-gt-mono text-[9.5px] text-gt-ink-400">{sub}</div>
        </div>
        <Icon name={icon} size={17} className={t.text} />
      </div>
      <div className={`font-gt-display text-[30px] font-bold leading-none tabular-nums ${t.text}`}>{value}</div>
      {pct !== null && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-[4px] bg-gt-paper-2">
          <div
            className={`h-full rounded-[4px] transition-[width] duration-500 ${t.solidBg}`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      )}
    </Card>
  )
}

export default function RendimientoPage() {
  const { performance, refetch } = useGetPerformance()
  const [hist, setHist] = useState<number[]>([])

  useEffect(() => {
    const iv = setInterval(() => refetch(), POLL_MS)
    return () => clearInterval(iv)
     
  }, [])

  useEffect(() => {
    if (!performance) return
    const tps = parseFloat(performance.tps)
    if (Number.isNaN(tps)) return
    setHist((h) => [...h.slice(-(HISTORY_MAX - 1)), tps])
  }, [performance])

  if (!performance) {
    return (
      <>
        <PageHead
          kicker="Administración · Infraestructura"
          dep="hacienda"
          title="Rendimiento del servidor"
          sub="Monitor en tiempo real de los recursos del servidor de Teras."
        />
        <Skeleton className="mb-4 h-[62px]" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          <Skeleton className="h-[112px]" />
          <Skeleton className="h-[112px]" />
          <Skeleton className="h-[112px]" />
        </div>
      </>
    )
  }

  const tps = parseFloat(performance.tps)
  const tpsSafe = Number.isNaN(tps) ? 0 : tps
  const band = tpsBand(tpsSafe)
  const maxH = Math.max(...hist, 20)

  return (
    <>
      <PageHead
        kicker="Administración · Infraestructura"
        dep="hacienda"
        title="Rendimiento del servidor"
        sub={`Monitor en tiempo real de los recursos del servidor de Teras. Actualiza cada ${POLL_MS / 1000} segundos.`}
      />
      <ConsolaHero
        title="Monitor de rendimiento"
        code="rendimiento"
        icon="server"
        dep="hacienda"
        status={band.label.toUpperCase()}
        statusTone={band.tone}
      />

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <StatCard
          label="TPS"
          sub="Ticks por segundo"
          icon="zap"
          value={tpsSafe.toFixed(2)}
          tone={band.tone}
          pct={(tpsSafe / 20) * 100}
        />
        <StatCard
          label="Memoria"
          sub="Uso de RAM"
          icon="signal"
          value={`${performance.memory.toFixed(1)}%`}
          tone={performance.memory > 85 ? "danger" : "seguridad"}
          pct={performance.memory}
        />
        <StatCard
          label="Jugadores"
          sub="Conectados ahora"
          icon="users"
          value={String(performance.players)}
          tone="poblacion"
          pct={null}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <Bar icon="signal" dep="hacienda">
            Historial de TPS · lecturas en vivo
          </Bar>
          <div className="p-4">
            {hist.length ? (
              <div className="flex h-[130px] items-end gap-[3px]">
                {hist.map((v, i) => (
                  <div
                    key={i}
                    title={v.toFixed(1)}
                    className={`min-h-[2px] flex-1 rounded-t-[2px] transition-[height] duration-500 ${
                      v < 10 ? TONES.danger.solidBg : v < 18 ? TONES.warn.solidBg : TONES.ok.solidBg
                    }`}
                    style={{ height: `${(v / maxH) * 100}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid h-[130px] place-items-center font-gt-mono text-xs text-gt-ink-400">
                Esperando la primera lectura…
              </div>
            )}
            <div className="mt-2 flex justify-between font-gt-mono text-[9.5px] tabular-nums text-gt-ink-400">
              <span>máx 20 TPS</span>
              <span>ahora {tpsSafe.toFixed(1)}</span>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Bar icon="server" dep="hacienda">
            Estado
          </Bar>
          <div className="p-[18px]">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className={`h-3 w-3 rounded-full ${TONES[band.tone].dot}`} />
              <span className={`font-gt-display text-lg font-bold ${TONES[band.tone].text}`}>{band.label}</span>
            </div>
            {[
              ["Tiempo activo", String(performance.uptime)],
              ["Intervalo de sondeo", `${POLL_MS / 1000} s`],
              ["Actualizado", new Date().toLocaleTimeString("es-ES")],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-gt-line-soft py-2 last:border-b-0">
                <span className="font-gt-mono text-[11.5px] text-gt-ink-500">{k}</span>
                <span className="font-gt-mono text-xs font-bold tabular-nums text-gt-ink-800">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
