"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Terminal, Gauge, List, Users, LayoutGrid, MessageSquare,
  Bell, MapPin, ChevronRight, Activity,
  Server, Cpu, HardDrive,
} from 'lucide-react'

const LAUNCH_ITEMS = [
  { id: 'arceuspeak',    icon: 'MessageSquare', label: 'ArceuSpeak',      desc: 'Mensajes al chat',         href: '/smartrotom/admin/arceuspeak' },
  { id: 'carteles',     icon: 'MapPin',        label: 'OGT Explorer',    desc: 'Carteles de autopista',    href: '/smartrotom/admin/carteles' },
  { id: 'rendimiento',  icon: 'Gauge',         label: 'Rendimiento',     desc: 'Monitor del servidor',     href: '/smartrotom/admin/rendimiento' },
  { id: 'apps',         icon: 'LayoutGrid',    label: 'Gestor de Apps',  desc: 'Apps del jugador',         href: '/smartrotom/admin/apps' },
  { id: 'notifications',icon: 'Bell',          label: 'NotifyBell',      desc: 'Push notifications',       href: '/smartrotom/admin/notifications' },
  { id: 'usuarios',     icon: 'Users',         label: 'Usuarios',        desc: 'Gestión de jugadores',     href: '/smartrotom/admin/usuarios' },
]

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  MessageSquare, MapPin, Gauge, LayoutGrid, Bell, Users,
}

const SERVICES = [
  { name: 'NestJS API',    status: 'ok', lat: '12ms' },
  { name: 'MySQL',         status: 'ok', lat: '4ms' },
  { name: 'MCEF Bridge',   status: 'ok', lat: 'local' },
  { name: 'SmartRotom WS', status: 'ok', lat: '2ms' },
  { name: 'NextAuth',      status: 'ok', lat: '8ms' },
]

const LOG_INIT = [
  { ts: '--:--:--', lv: 'OK',   src: 'system', msg: 'Panel de control iniciado' },
  { ts: '--:--:--', lv: 'INFO', src: 'auth',   msg: 'Sesión de administrador activa' },
  { ts: '--:--:--', lv: 'INFO', src: 'api',    msg: 'Conexión al servidor establecida' },
]

export default function PanelControlAdmin() {
  const [stats, setStats] = useState({ cpu: 0, mem: 0, net: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 60 + 20),
        mem: Math.floor(Math.random() * 40 + 30),
        net: Math.floor(Math.random() * 800 + 100),
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><Terminal size={20} /> Terminal de Acceso Restringido</h1>
        <p className="sr-page-sub">Panel de control administrativo — SmartRotom v3</p>
      </div>

      <div className="sr-tiles" style={{ marginBottom: 'var(--gap)' }}>
        <div className="sr-tile">
          <div className="sr-lbl"><Cpu size={13} /> CPU (simulado)</div>
          <div className="sr-val">{stats.cpu}<small>%</small></div>
          <div className="sr-meter">
            <i style={{ width: stats.cpu + '%', background: stats.cpu > 80 ? 'var(--crit)' : undefined }} />
          </div>
        </div>
        <div className="sr-tile">
          <div className="sr-lbl"><HardDrive size={13} /> Memoria (simulada)</div>
          <div className="sr-val">{stats.mem}<small>%</small></div>
          <div className="sr-meter"><i style={{ width: stats.mem + '%' }} /></div>
        </div>
        <div className="sr-tile">
          <div className="sr-lbl"><Activity size={13} /> Red</div>
          <div className="sr-val">{stats.net}<small>kb/s</small></div>
          <div className="sr-meter"><i style={{ width: Math.min(stats.net / 10, 100) + '%' }} /></div>
        </div>
        <div className="sr-tile">
          <div className="sr-lbl"><Server size={13} /> Servicios</div>
          <div className="sr-val">5<small>/5</small></div>
          <div className="sr-foot"><span className="sr-live-dot" /> Todos activos</div>
        </div>
      </div>

      <div className="sr-panel" style={{ marginBottom: 'var(--gap)' }}>
        <div className="sr-panel-head">
          <span className="sr-ttl"><LayoutGrid size={14} /> Herramientas del panel</span>
        </div>
        <div className="sr-panel-body">
          <div className="sr-launch-grid">
            {LAUNCH_ITEMS.map(item => {
              const Icon = ICONS[item.icon]
              return (
                <Link key={item.id} href={item.href} className="sr-launch-card">
                  <div className="sr-lc-ic">{Icon && <Icon size={18} />}</div>
                  <div>
                    <div className="sr-lc-t">{item.label}</div>
                    <div className="sr-lc-d">{item.desc}</div>
                  </div>
                  <ChevronRight size={14} className="sr-lc-go" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="sr-grid2">
        <div className="sr-panel">
          <div className="sr-panel-head">
            <span className="sr-ttl"><List size={14} /> Actividad reciente</span>
            <span className="sr-meta"><span className="sr-live-dot" /> live</span>
          </div>
          <div className="sr-panel-body sr-flush">
            {LOG_INIT.map((l, i) => (
              <div key={i} className="sr-logline">
                <span className="sr-ts">{l.ts}</span>
                <span className={`sr-lv ${l.lv}`}>{l.lv}</span>
                <span className="sr-src">{l.src}</span>
                <span className="sr-msg">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sr-panel">
          <div className="sr-panel-head">
            <span className="sr-ttl"><Server size={14} /> Estado de servicios</span>
          </div>
          <div className="sr-panel-body sr-flush">
            {SERVICES.map(svc => (
              <div key={svc.name} className="sr-svc-row">
                <div className={`sr-svc-dot sr-${svc.status}`} />
                <span className="sr-svc-name">{svc.name}</span>
                <span className="sr-svc-lat">{svc.lat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
