"use client"

import { useEffect } from 'react'
import { Activity, Users, Server, Gauge, Cpu, HardDrive, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { useGetPerformance } from '@/hooks/_main/useGetPerformance'

function tpsColor(tps: number) {
  if (tps < 10) return 'var(--crit)'
  if (tps < 15) return 'var(--warn)'
  if (tps < 18) return 'var(--warn)'
  return 'var(--ok)'
}

function tpsLabel(tps: number) {
  if (tps < 10) return 'Crítico'
  if (tps < 15) return 'Degradado'
  if (tps < 17) return 'Bajo'
  if (tps < 18) return 'Regular'
  if (tps < 19) return 'Bueno'
  return 'Óptimo'
}

export default function ServerPerformanceMonitor() {
  const { performance, refetch } = useGetPerformance()

  useEffect(() => {
    if (!performance) return
    const interval = setInterval(() => { refetch() }, 5000)
    return () => clearInterval(interval)
  }, [performance, refetch])

  if (!performance) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="sr-spin" style={{ width: 28, height: 28, margin: '0 auto 12px', borderWidth: 3 }} />
          <div className="sr-faint">Inicializando sistema de monitoreo…</div>
        </div>
      </div>
    )
  }

  const tps = parseFloat(performance.tps)
  const tpsPct = Math.min((tps / 20) * 100, 100)
  const memPct = performance.memory

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><Gauge size={20} /> Monitor de Rendimiento</h1>
        <p className="sr-page-sub">Actualización automática cada 5 segundos</p>
      </div>

      <div className="sr-tiles" style={{ marginBottom: 'var(--gap)' }}>
        <div className="sr-tile">
          <div className="sr-lbl"><Activity size={13} /> TPS</div>
          <div className="sr-val" style={{ color: tpsColor(tps) }}>
            {tps.toFixed(2)}<small> / 20</small>
          </div>
          <div className="sr-meter" style={{ marginTop: 8 }}>
            <i style={{ width: tpsPct + '%', background: tpsColor(tps) }} />
          </div>
          <div className="sr-foot" style={{ color: tpsColor(tps) }}>{tpsLabel(tps)}</div>
        </div>
        <div className="sr-tile">
          <div className="sr-lbl"><HardDrive size={13} /> Memoria</div>
          <div className="sr-val">{memPct.toFixed(1)}<small>%</small></div>
          <div className="sr-meter" style={{ marginTop: 8 }}>
            <i style={{ width: memPct + '%', background: memPct > 85 ? 'var(--crit)' : memPct > 70 ? 'var(--warn)' : undefined }} />
          </div>
        </div>
        <div className="sr-tile">
          <div className="sr-lbl"><Users size={13} /> Jugadores</div>
          <div className="sr-val">{performance.players}</div>
          <div className="sr-foot sr-faint">en línea</div>
        </div>
        <div className="sr-tile">
          <div className="sr-lbl"><Clock size={13} /> Tiempo activo</div>
          <div className="sr-val" style={{ fontSize: 20 }}>{performance.uptime}</div>
        </div>
      </div>

      <div className="sr-panel">
        <div className="sr-panel-head">
          <span className="sr-ttl"><Server size={14} /> Diagnóstico</span>
          <span className="sr-meta">
            <span className="sr-live-dot" /> Intervalo 5s
          </span>
        </div>
        <div className="sr-panel-body">
          <div className="sr-grid2">
            <div className="sr-col" style={{ gap: 12 }}>
              <div className="sr-kv">
                <div className="sr-kv-k">TPS</div>
                <div className="sr-kv-v" style={{ color: tpsColor(tps) }}>{tps.toFixed(2)} ({tpsLabel(tps)})</div>
              </div>
              <div className="sr-kv">
                <div className="sr-kv-k">Memoria</div>
                <div className="sr-kv-v">{memPct.toFixed(1)}%</div>
              </div>
              <div className="sr-kv">
                <div className="sr-kv-k">Jugadores</div>
                <div className="sr-kv-v">{performance.players}</div>
              </div>
              <div className="sr-kv">
                <div className="sr-kv-k">Uptime</div>
                <div className="sr-kv-v">{performance.uptime}</div>
              </div>
            </div>
            <div>
              <div className="sr-faint" style={{ marginBottom: 8, fontSize: 11 }}>// Estado general</div>
              <div className="sr-badge" style={{ borderColor: tpsColor(tps), color: tpsColor(tps), background: 'transparent' }}>
                <span className="sr-ledot" style={{ background: tpsColor(tps) }} />
                {tpsLabel(tps)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
