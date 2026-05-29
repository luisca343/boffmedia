"use client"

import { useState, useEffect, useRef } from 'react'
import { List, Search, Download, Play, Square } from 'lucide-react'

type LogLevel = 'ALL' | 'INFO' | 'OK' | 'WARN' | 'ERROR' | 'DEBUG'

interface LogLine {
  id: number
  ts: string
  lv: Exclude<LogLevel, 'ALL'>
  src: string
  msg: string
}

const SOURCES = ['system', 'auth', 'api', 'mcef', 'ws', 'discord', 'db', 'notif']
const MSGS: Record<string, string[]> = {
  system:  ['Panel de control iniciado', 'Configuración recargada', 'Tarea programada ejecutada'],
  auth:    ['Sesión de administrador activa', 'Token JWT renovado', 'Intento de acceso denegado'],
  api:     ['GET /api/performance 200', 'POST /api/notifications 201', 'GET /api/users 200'],
  mcef:    ['Bridge conectado', 'sendChatMessage OK', 'Respuesta MCEF recibida'],
  ws:      ['Cliente SmartRotom conectado', 'Evento push enviado', 'Desconexión limpia'],
  discord: ['Bot listo', 'Comando /tps ejecutado', 'Embed enviado al canal'],
  db:      ['Consulta completada 4ms', 'Migración ejecutada', 'Pool reconectado'],
  notif:   ['Notificación enviada a player', 'Cola procesada', 'Badge actualizado'],
}
const LEVELS: Array<Exclude<LogLevel, 'ALL'>> = ['INFO', 'OK', 'WARN', 'ERROR', 'DEBUG']
const LEVEL_WEIGHTS = [0.4, 0.3, 0.15, 0.05, 0.1]

function randLog(id: number): LogLine {
  const r = Math.random()
  let li = 0
  let acc = 0
  for (let i = 0; i < LEVEL_WEIGHTS.length; i++) {
    acc += LEVEL_WEIGHTS[i]
    if (r < acc) { li = i; break }
  }
  const lv = LEVELS[li]
  const src = SOURCES[Math.floor(Math.random() * SOURCES.length)]
  const msgs = MSGS[src] || ['Evento interno']
  return {
    id,
    ts: new Date().toLocaleTimeString('es-ES', { hour12: false }),
    lv,
    src,
    msg: msgs[Math.floor(Math.random() * msgs.length)],
  }
}

const INITIAL_LOGS: LogLine[] = Array.from({ length: 40 }, (_, i) => randLog(i + 1))
let nextId = INITIAL_LOGS.length + 1

export default function LogsView() {
  const [logs, setLogs] = useState<LogLine[]>(INITIAL_LOGS)
  const [level, setLevel] = useState<LogLevel>('ALL')
  const [source, setSource] = useState('all')
  const [query, setQuery] = useState('')
  const [live, setLive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => {
      const newLog = randLog(nextId++)
      setLogs(prev => [...prev.slice(-200), newLog])
    }, 2200)
    return () => clearInterval(id)
  }, [live])

  useEffect(() => {
    if (live) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, live])

  const filtered = logs.filter(l => {
    if (level !== 'ALL' && l.lv !== level) return false
    if (source !== 'all' && l.src !== source) return false
    if (query && !l.msg.toLowerCase().includes(query.toLowerCase()) && !l.src.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const handleExport = () => {
    const text = filtered.map(l => `${l.ts} [${l.lv}] [${l.src}] ${l.msg}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'smartrotom-logs.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><List size={20} /> Actividad del sistema</h1>
        <p className="sr-page-sub">Registro de eventos en tiempo real — últimas 200 entradas</p>
      </div>

      <div className="sr-panel">
        <div className="sr-toolbar">
          <div className="sr-seg">
            {(['ALL', 'INFO', 'OK', 'WARN', 'ERROR', 'DEBUG'] as LogLevel[]).map(lv => (
              <button key={lv} className={level === lv ? 'sr-on' : ''} onClick={() => setLevel(lv)}>{lv}</button>
            ))}
          </div>
          <select className="sr-select" style={{ width: 120 }} value={source} onChange={e => setSource(e.target.value)}>
            <option value="all">Todos</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="sr-search" style={{ flex: 1 }}>
            <Search size={13} />
            <input placeholder="Buscar en mensajes…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button
            className={`sr-btn${live ? ' sr-danger' : ''}`}
            onClick={() => setLive(v => !v)}
            style={{ gap: 7 }}
          >
            {live ? <Square size={13} /> : <Play size={13} />}
            {live ? 'Detener' : 'Live'}
            {live && <span className="sr-live-dot" />}
          </button>
          <button className="sr-btn sr-ghost" onClick={handleExport}>
            <Download size={13} />
          </button>
        </div>

        <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div className="sr-empty" style={{ margin: 16 }}>
              <div className="sr-t">Sin entradas para estos filtros</div>
            </div>
          ) : (
            filtered.map(l => (
              <div key={l.id} className="sr-logline">
                <span className="sr-ts">{l.ts}</span>
                <span className={`sr-lv ${l.lv}`}>{l.lv}</span>
                <span className="sr-src">{l.src}</span>
                <span className="sr-msg">{l.msg}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  )
}
