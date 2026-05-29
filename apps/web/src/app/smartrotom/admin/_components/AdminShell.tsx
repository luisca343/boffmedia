"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Terminal, Activity, List, Users, LayoutGrid, MessageSquare, Bell,
  MapPin, Image as ImageIcon, Sliders, Search, Menu, X, ChevronRight,
  Cpu, HardDrive, Clock, Server, Gauge, Zap, Database,
  RotateCw, ShieldAlert, Check, AlertTriangle, Info,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Navigation tree                                                      */
/* ------------------------------------------------------------------ */
type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  sub?: boolean
}
type NavGroup = { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: "Sistema",
    items: [
      { id: "dashboard",    label: "Panel Principal",  icon: <Terminal size={16} />,    href: "/smartrotom/admin" },
      { id: "rendimiento",  label: "Rendimiento",      icon: <Gauge size={16} />,       href: "/smartrotom/admin/rendimiento" },
      { id: "logs",         label: "Actividad",        icon: <List size={16} />,         href: "/smartrotom/admin/logs" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { id: "usuarios", label: "Usuarios",       icon: <Users size={16} />,       href: "/smartrotom/admin/usuarios" },
      { id: "apps",     label: "Gestor de Apps", icon: <LayoutGrid size={16} />,  href: "/smartrotom/admin/apps" },
    ],
  },
  {
    label: "Comunicación",
    items: [
      { id: "arceuspeak",    label: "ArceuSpeak",  icon: <MessageSquare size={16} />,  href: "/smartrotom/admin/arceuspeak" },
      { id: "notifications", label: "NotifyBell",  icon: <Bell size={16} />,           href: "/smartrotom/admin/notifications" },
    ],
  },
  {
    label: "Contenido",
    items: [
      { id: "carteles", label: "OGT Explorer",  icon: <MapPin size={16} />,     href: "/smartrotom/admin/carteles" },
      { id: "skins",    label: "NPC Skins",     icon: <ImageIcon size={16} />,      href: "/smartrotom/admin/skins" },
      { id: "tuner",    label: "Camera Tuner",  icon: <Sliders size={16} />,    href: "/smartrotom/admin/skins/tuner", sub: true },
    ],
  },
]

const CRUMBS: Record<string, string> = {
  dashboard:     "Panel Principal",
  rendimiento:   "Rendimiento",
  logs:          "Actividad",
  usuarios:      "Usuarios",
  apps:          "Gestor de Apps",
  arceuspeak:    "ArceuSpeak",
  notifications: "NotifyBell",
  carteles:      "OGT Explorer",
  skins:         "NPC Skins",
  tuner:         "Camera Tuner",
}

function pathToId(pathname: string): string {
  if (pathname === "/smartrotom/admin") return "dashboard"
  const seg = pathname.split("/").pop() ?? ""
  return seg
}

/* ------------------------------------------------------------------ */
/* Boot screen                                                          */
/* ------------------------------------------------------------------ */
const BOOT_LINES = [
  "SmartRotom Control Center v3.2.0",
  "Inicializando sistema…",
  "[OK] Base de datos conectada",
  "[OK] Módulo de usuarios cargado",
  "[OK] Sistema de notificaciones activo",
  "[OK] Módulo MCEF enlazado",
  "Acceso concedido ──────────────────",
]

function BootScreen({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let i = 0
    const tick = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i]])
        i++
      } else {
        clearInterval(tick)
        setTimeout(() => {
          setExiting(true)
          setTimeout(onDone, 320)
        }, 380)
      }
    }, 140)
    return () => clearInterval(tick)
  }, [onDone])

  return (
    <div className={`sr-boot${exiting ? " sr-boot-out" : ""}`}>
      <div style={{ maxWidth: 480, width: "100%", padding: 28, fontFamily: "var(--mono)" }}>
        <div style={{ color: "var(--fg)", fontSize: 11, marginBottom: 14, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          SmartRotom Admin
        </div>
        {lines.map((l, idx) => (
          <div key={idx} style={{
            fontSize: 13, color: l.startsWith("[OK]") ? "var(--ok)" : l.startsWith("Acceso") ? "var(--fg-strong)" : "var(--fg-muted)",
            marginBottom: 4, fontWeight: l.startsWith("Acceso") ? 700 : 400,
          }}>
            {l.startsWith("[OK]") ? (
              <><span style={{ color: "var(--ok)" }}>[OK]</span>{l.slice(4)}</>
            ) : l}
          </div>
        ))}
        {lines.length < BOOT_LINES.length && (
          <span style={{ display: "inline-block", width: 10, height: 14, background: "var(--fg)", opacity: 0.9, marginTop: 4, animation: "sr-blip 0.8s infinite" }} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Command palette                                                      */
/* ------------------------------------------------------------------ */
type CmdItem = { id: string; icon: React.ReactNode; label: string; desc?: string; action: () => void }

function CommandPalette({ onClose, commands }: { onClose: () => void; commands: CmdItem[] }) {
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc?.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  useEffect(() => { setCursor(0) }, [query])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === "Enter") { filtered[cursor]?.action(); onClose() }
  }, [cursor, filtered, onClose])

  return (
    <div className="sr-cmdk-overlay" onClick={onClose}>
      <div className="sr-cmdk" onClick={e => e.stopPropagation()}>
        <div className="sr-cmdk-input">
          <span className="sr-ps">$</span>
          <Search size={15} style={{ color: "var(--fg-muted)" }} />
          <input
            ref={inputRef}
            placeholder="Buscar comando o sección…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <div className="sr-cmdk-list">
          {filtered.length === 0 && (
            <div style={{ padding: "24px 16px", color: "var(--fg-faint)", fontSize: 13, textAlign: "center" }}>Sin resultados</div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={`sr-cmdk-item${i === cursor ? " sr-active" : ""}`}
              onClick={() => { item.action(); onClose() }}
              onMouseEnter={() => setCursor(i)}
            >
              <span className="sr-ci-ic">{item.icon}</span>
              <span className="sr-ci-t">{item.label}</span>
              {item.desc && <span className="sr-ci-d">{item.desc}</span>}
            </div>
          ))}
        </div>
        <div className="sr-cmdk-foot">
          <span><span className="sr-kbd">↑↓</span> navegar</span>
          <span><span className="sr-kbd">↵</span> abrir</span>
          <span><span className="sr-kbd">Esc</span> cerrar</span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toast system                                                         */
/* ------------------------------------------------------------------ */
type ToastItem = { id: number; msg: string; type?: "ok" | "crit" }
export const toastRef: React.MutableRefObject<((msg: string, type?: "ok" | "crit") => void) | null> = { current: null }

/* ------------------------------------------------------------------ */
/* AdminShell                                                           */
/* ------------------------------------------------------------------ */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeId = pathToId(pathname)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showBoot, setShowBoot] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [clock, setClock] = useState("")
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(0)

  /* Boot screen — show once per session */
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("sr_booted")) {
        setShowBoot(true)
      }
    } catch { /* ignore */ }
  }, [])

  const handleBootDone = useCallback(() => {
    setShowBoot(false)
    try { sessionStorage.setItem("sr_booted", "1") } catch { /* ignore */ }
  }, [])

  /* Clock */
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      setClock(d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }))
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])

  /* Global ⌘K / Ctrl+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen(v => !v)
      }
      if (e.key === "Escape" && cmdOpen) setCmdOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [cmdOpen])

  /* Toast API */
  const addToast = useCallback((msg: string, type: "ok" | "crit" = "ok") => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])
  toastRef.current = addToast

  /* Command palette commands */
  const navCommands: CmdItem[] = NAV.flatMap(g =>
    g.items.map(item => ({
      id: item.id,
      icon: item.icon,
      label: item.label,
      desc: "Navegar",
      action: () => router.push(item.href),
    }))
  )
  const actionCommands: CmdItem[] = [
    { id: "toggle-sidebar", icon: <Menu size={16} />, label: "Toggle sidebar", desc: "Acción", action: () => setCollapsed(v => !v) },
    { id: "refresh", icon: <RotateCw size={16} />, label: "Recargar página", desc: "Acción", action: () => window.location.reload() },
  ]

  const crumbLabel = CRUMBS[activeId] ?? activeId

  return (
    <div
      className={`sr-admin sr-app${collapsed ? " sr-collapsed" : ""}${mobileOpen ? " sr-mobile-open" : ""}`}
      style={{ height: "100dvh" }}
    >
      {/* FX background */}
      <div className="sr-fx-root" aria-hidden>
        <div className="sr-fx-grid" />
        <div className="sr-fx-scan" />
        <div className="sr-fx-sweep" />
        <div className="sr-fx-vignette" />
      </div>

      {/* Boot screen */}
      {showBoot && <BootScreen onDone={handleBootDone} />}

      {/* Sidebar */}
      <aside className="sr-sidebar">
        <div className="sr-sb-brand">
          <div className="sr-sb-logo"><Terminal size={16} /></div>
          <div className="sr-sb-word">
            SmartRotom
            <small>PANEL DE CONTROL</small>
          </div>
        </div>
        <nav className="sr-sb-nav">
          {NAV.map(group => (
            <React.Fragment key={group.label}>
              <div className="sr-sb-sec-label">{group.label}</div>
              {group.items.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`sr-nav-item${item.sub ? " sr-nav-sub" : ""}${activeId === item.id ? " sr-active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div className="sr-sb-foot">
          <Link href="/smartrotom" className="sr-nav-item" title={collapsed ? "Volver" : undefined}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
            <span className="sr-sb-foot-text">Salir del panel</span>
          </Link>
        </div>
      </aside>

      {/* Mobile scrim */}
      {mobileOpen && (
        <div className="sr-scrim" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main column */}
      <div className="sr-main">
        {/* Topbar */}
        <header className="sr-topbar">
          <button
            className="sr-iconbtn sr-menu-btn"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menú"
          >
            <Menu size={16} />
          </button>
          <button
            className="sr-iconbtn"
            onClick={() => setCollapsed(v => !v)}
            aria-label="Toggle sidebar"
            style={{ display: "none" }}
            id="sr-collapse-btn"
          >
            <Menu size={16} />
          </button>
          <div className="sr-crumb">
            <span>admin</span>
            <span className="sr-sep">/</span>
            <b>{crumbLabel}</b>
          </div>
          <div className="sr-topbar-spacer" />
          <button
            className="sr-cmd-trigger"
            onClick={() => setCmdOpen(true)}
            aria-label="Abrir paleta de comandos"
          >
            <Search size={14} />
            <span className="sr-ph">Buscar…</span>
            <span className="sr-kbd">Ctrl K</span>
          </button>
          <div className="sr-status-chip">
            <Cpu size={13} />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>--</span>
          </div>
          <div className="sr-status-chip">
            <HardDrive size={13} />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>--</span>
          </div>
          <div className="sr-status-chip" style={{ gap: 7, minWidth: 86 }}>
            <Clock size={13} />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{clock}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="sr-content">{children}</main>
      </div>

      {/* Command palette */}
      {cmdOpen && (
        <CommandPalette
          onClose={() => setCmdOpen(false)}
          commands={[...navCommands, ...actionCommands]}
        />
      )}

      {/* Toasts */}
      <div
        style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}
        aria-live="polite"
      >
        {toasts.map(t => (
          <div key={t.id} className={`sr-toast${t.type === "crit" ? " sr-crit" : " sr-ok"}`}>
            {t.type === "crit"
              ? <AlertTriangle size={14} style={{ color: "var(--crit)", flexShrink: 0 }} />
              : <Check size={14} style={{ color: "var(--ok)", flexShrink: 0 }} />
            }
            {t.msg}
          </div>
        ))}
      </div>

      {/* Desktop collapse toggle — via CSS to show on md+ */}
      <style>{`
        @media (min-width: 861px) {
          #sr-collapse-btn { display: grid !important; }
        }
      `}</style>
    </div>
  )
}
