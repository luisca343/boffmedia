"use client"

import * as React from "react"
import { Icon } from "../primitives/boffmedia/icon"
import { BoffButton as Button } from "../primitives/boffmedia/button"
import { BoffCard as Card } from "../primitives/boffmedia/card"
import { BoffBadge as Badge } from "../primitives/boffmedia/badge"

// =============================================================================
// Metric — big number + label
// size: sm | md | lg  ·  tone: text | orange | accent  ·  mono · boxed
// =============================================================================
interface MetricProps {
  value: React.ReactNode
  label: React.ReactNode
  size?: "sm" | "md" | "lg"
  tone?: "text" | "orange" | "accent"
  mono?: boolean
  boxed?: boolean
  className?: string
}

export function Metric({ value, label, size = "md", tone = "text", mono = false, boxed = false, className = "" }: MetricProps) {
  const valueSize = size === "sm" ? "var(--t-xl)" : size === "lg" ? "var(--t-3xl)" : "var(--t-2xl)"
  const valueWeight = size === "lg" ? 900 : 800
  const valueColor = tone === "orange" ? "var(--orange-500)" : tone === "accent" ? "var(--accent-bright)" : "var(--text)"
  const cls = ["flex flex-col gap-[0.2rem] min-w-0", boxed ? "p-[1.1rem_1.2rem] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)]" : "", className].join(" ").trim()

  return (
    <div className={cls}>
      <span
        className="font-display leading-[1.05] whitespace-nowrap"
        style={{ fontSize: valueSize, fontWeight: valueWeight, color: valueColor }}
      >
        {value}
      </span>
      <span
        className={mono ? "font-mono text-xs tracking-[0.1em] uppercase text-[color:var(--text-dim)] mt-1" : "text-sm text-[color:var(--text-dim)]"}
      >
        {label}
      </span>
    </div>
  )
}

// =============================================================================
// Stat — stats panel item (icon + value + label + sub)
// Used in profile stats grid
// =============================================================================
interface StatProps {
  icon: string
  value: string
  label: string
  sub?: string
}

export function Stat({ icon, value, label, sub }: StatProps) {
  return (
    <div
      className="flex flex-col gap-[0.15rem] p-[1.1rem] rounded-[var(--radius)] bg-[var(--surface-2)]"
      style={{ border: "var(--hairline) solid var(--border)" }}
    >
      <span
        className="w-9 h-9 rounded-[var(--radius)] grid place-items-center mb-2"
        style={{
          color: "var(--orange-500)",
          background: "color-mix(in srgb, var(--orange-500) 12%, transparent)",
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="font-display font-extrabold text-[length:var(--t-2xl)] whitespace-nowrap leading-none">{value}</span>
      <span className="text-sm font-semibold mt-[0.1rem]">{label}</span>
      {sub && <span className="text-xs text-[var(--text-dim)] mt-[0.05rem]">{sub}</span>}
    </div>
  )
}

// =============================================================================
// IconButton — 38px square icon control
// dot = notification dot, bordered = border variant, active = active state
// =============================================================================
interface IconButtonProps {
  icon?: string
  label: string
  dot?: boolean
  bordered?: boolean
  active?: boolean
  href?: string
  onClick?: (e: React.MouseEvent) => void
  size?: number
  className?: string
  children?: React.ReactNode
}

export function IconButton({ icon, label, dot = false, bordered = false, active = false, href, onClick, size = 18, className = "", children, ...rest }: IconButtonProps) {
  const cls = [
    "inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius,var(--radius-pill,9999px))] cursor-pointer relative transition-all duration-[var(--dur,0.32s)] ease-[var(--ease,cubic-bezier(.22,1,.36,1))]",
    bordered ? "border border-[var(--border-strong)]" : "border border-transparent",
    active ? "text-[var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)]" : "text-[var(--text-muted)] bg-transparent hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]",
    bordered && !active ? "hover:border-[var(--orange-500)] hover:text-[var(--orange-500)]" : "",
    className,
  ].filter(Boolean).join(" ")

  const inner = (
    <>
      {children || (icon ? <Icon name={icon} size={size} /> : null)}
      {dot && <span className="absolute top-[8px] right-[9px] w-[6px] h-[6px] rounded-full bg-[var(--orange-500)] border-2 border-[var(--bg)]" />}
    </>
  )

  if (href !== undefined) {
    return <a className={cls} href={href} aria-label={label} onClick={onClick} {...rest}>{inner}</a>
  }
  return <button className={cls} aria-label={label} onClick={onClick} type="button" {...rest}>{inner}</button>
}

// =============================================================================
// CardTitle — icon + title heading inside a Card
// right prop adds an element aligned to the right
// =============================================================================
interface CardTitleProps {
  icon?: string
  children: React.ReactNode
  right?: React.ReactNode
  style?: React.CSSProperties
}

export function CardTitle({ icon, children, right, style }: CardTitleProps) {
  if (right !== undefined) {
    return (
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-[0.6rem] text-lg m-0" style={style}>
          {icon && <Icon name={icon} size={18} className="text-[var(--orange-500)]" />}
          {children}
        </h3>
        {right}
      </div>
    )
  }
  return (
    <h3 className="flex items-center gap-[0.6rem] text-lg m-0 mb-5" style={style}>
      {icon && <Icon name={icon} size={18} className="text-[var(--orange-500)]" />}
      {children}
    </h3>
  )
}

// =============================================================================
// ToolRow — compact horizontal tool list item (landing "Herramientas")
// =============================================================================
interface ToolRowTool {
  icon: string
  name: string
  cat: string
  desc: string
  status: string
}

interface ToolRowProps {
  tool: ToolRowTool
  onClick: () => void
  delay?: number
}

export function ToolRow({ tool, onClick, delay = 0 }: ToolRowProps) {
  const statusKind = tool.status === "live" ? "accent" : tool.status as "accent" | "new" | "soon"
  const statusLabel = tool.status === "live" ? "Disponible" : tool.status === "new" ? "Nuevo" : "Pronto"

  return (
    <button
      className="flex flex-col gap-4 p-6 text-left cursor-pointer bg-[var(--card-bg)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--card-shadow)] transition-all duration-[var(--dur)] ease-[var(--ease)] hover:border-[color-mix(in_srgb,var(--orange-500)_50%,var(--border))] hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-[3px]"
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-[46px] h-[46px] rounded-[var(--radius)] text-[var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] border border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)] shrink-0">
          <Icon name={tool.icon} size={22} />
        </span>
        <div className="flex flex-col gap-[0.35rem] flex-1 min-w-0">
          <span className="font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-dim)]">{tool.cat}</span>
          <span className="font-display font-bold text-lg">{tool.name}</span>
          <span className="text-sm text-[var(--text-muted)] leading-[1.55]">{tool.desc}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge kind={statusKind}>{statusLabel}</Badge>
        <Icon name="arrow" size={16} className="text-[var(--text-dim)]" />
      </div>
    </button>
  )
}

// =============================================================================
// EventCard — a tournament / event entry
// =============================================================================
interface EventData {
  date: string
  title: string
  game: string
  players: number
  status: string
}

interface EventCardProps {
  event: EventData
  go: (path: string) => void
  delay?: number
  action?: React.ReactNode
}

export function EventCard({ event, go, delay = 0, action }: EventCardProps) {
  const [day, mon] = event.date.split(" ")

  return (
    <Card
      hover
      className="flex items-center gap-5 p-[1.1rem_1.3rem]"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex flex-col items-center justify-center w-16 min-w-[64px] aspect-square rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] border border-[color-mix(in_srgb,var(--orange-500)_30%,transparent)]">
        <span className="font-display font-extrabold text-xl text-[var(--orange-500)] leading-none">{day}</span>
        <span className="font-mono text-[0.65rem] tracking-[0.12em] text-[var(--orange-400)] mt-[2px]">{mon}</span>
      </div>
      <div className="flex-1 flex flex-col gap-[0.35rem] min-w-0">
        <span className="font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-dim)]">{event.game}</span>
        <h3 className="text-lg m-0">{event.title}</h3>
        <div className="flex items-center gap-4 flex-wrap mt-[0.2rem]">
          <span className="inline-flex items-center gap-[0.4rem] text-sm text-[var(--text-muted)]">
            <Icon name="users" size={15} className="text-[var(--text-dim)]" />
            {event.players} plazas
          </span>
          <Badge kind={event.status === "open" ? "live" : "new"}>
            {event.status === "open" ? "Inscripción abierta" : "Casi lleno"}
          </Badge>
        </div>
      </div>
      {action || (
        <Button variant="primary" size="sm" iconRight="arrow" onClick={() => go("/eventos")} className="self-center shrink-0">
          Inscribirse
        </Button>
      )}
    </Card>
  )
}

// =============================================================================
// Leaderboard + LeaderRow — ranking table
// =============================================================================
interface LeaderEntry {
  rank: number
  name: string
  pts: number
  you?: boolean
}

interface LeaderRowProps {
  rank: number
  name: string
  pts: number
  you?: boolean
}

export function LeaderRow({ rank, name, pts, you }: LeaderRowProps) {
  const rankColor = rank === 1 ? "var(--orange-500)" : rank === 2 ? "var(--accent-bright)" : rank === 3 ? "var(--purple-400)" : "var(--text-dim)"
  const isTop = rank <= 3
  const rowCls = `flex items-center gap-[0.85rem] py-[0.7rem] border-b border-[var(--border)] last:border-b-0 ${you ? "bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] -mx-4 px-4 rounded-[var(--radius)]" : ""}`

  return (
    <li className={rowCls}>
      <span className="font-mono font-bold text-sm w-[1.7rem]" style={{ color: rankColor }}>
        {String(rank).padStart(2, "0")}
      </span>
      <span
        className="w-[34px] h-[34px] rounded-full grid place-items-center font-display font-bold text-sm shrink-0"
        style={
          isTop
            ? { color: "#fff", background: "linear-gradient(135deg, var(--orange-500), var(--orange-700))", borderColor: "transparent" }
            : { color: "var(--text)", background: "var(--surface-3)", border: "var(--hairline) solid var(--border-strong)" }
        }
      >
        {name[0]}
      </span>
      <span className="flex-1 font-semibold text-sm">{name}</span>
      <span className="font-mono font-bold text-sm">
        {pts.toLocaleString("es")} <span className="text-[var(--text-dim)]">pts</span>
      </span>
    </li>
  )
}

interface LeaderboardProps {
  leaders: LeaderEntry[]
  season?: string
  title?: string
  onViewAll?: () => void
}

export function Leaderboard({ leaders, season = "Temporada 3", title = "Top jugadores", onViewAll }: LeaderboardProps) {
  return (
    <Card ticks className="p-6 flex flex-col gap-[1.1rem]">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-xs tracking-[0.14em] uppercase text-[var(--text-dim)] block mb-[6px]">Clasificación</span>
          <h3 className="text-xl m-0">{title}</h3>
        </div>
        <Badge kind="accent">{season}</Badge>
      </div>
      <ul className="list-none m-0 p-0 flex flex-col">
        {leaders.map((p) => (
          <LeaderRow key={p.rank} rank={p.rank} name={p.name} pts={p.pts} you={p.you} />
        ))}
      </ul>
      {onViewAll && (
        <Button variant="ghost" block iconRight="arrow" onClick={onViewAll}>
          Ver clasificación completa
        </Button>
      )}
    </Card>
  )
}

// =============================================================================
// LinkedRow — a linked-account / settings row
// =============================================================================
interface LinkedRowProps {
  icon: string
  iconClass?: string
  name: string
  sub: string
  end: React.ReactNode
}

export function LinkedRow({ icon, iconClass, name, sub, end }: LinkedRowProps) {
  const iconBg = iconClass === "discord" ? "#5865f2" : iconClass === "mc" ? "linear-gradient(135deg, var(--emerald-500), #047857)" : iconClass === "steam" ? "linear-gradient(135deg, var(--cyan-500), var(--cyan-600))" : "var(--surface-3)"

  return (
    <div className="flex items-center gap-[0.9rem] p-[0.85rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]">
      <span
        className="w-[42px] h-[42px] rounded-[var(--radius)] grid place-items-center text-white shrink-0"
        style={{ background: iconBg }}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="flex-1 flex flex-col">
        <span className="font-semibold text-sm">{name}</span>
        <span className="text-xs text-[var(--text-muted)]">{sub}</span>
      </div>
      {end}
    </div>
  )
}

// =============================================================================
// ActivityItem — a timeline / activity-feed row
// =============================================================================
interface ActivityItemProps {
  icon: string
  text: string
  time: string
  color?: string
}

export function ActivityItem({ icon, text, time, color = "var(--orange-500)" }: ActivityItemProps) {
  return (
    <li className="flex items-center gap-[0.85rem] py-[0.8rem] border-b border-[var(--border)] last:border-b-0 last:pb-0">
      <span
        className="w-[34px] h-[34px] rounded-[var(--radius)] grid place-items-center border shrink-0"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        <Icon name={icon} size={16} />
      </span>
      <span className="flex-1 text-sm">{text}</span>
      <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{time}</span>
    </li>
  )
}

// =============================================================================
// AchievementTile — locked / unlocked achievement
// =============================================================================
interface AchievementTileProps {
  icon: string
  name: string
  done?: boolean
}

export function AchievementTile({ icon, name, done = false }: AchievementTileProps) {
  return (
    <div
      className="flex flex-col items-center gap-[0.5rem] text-center p-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]"
      style={{ opacity: done ? 1 : 0.5 }}
    >
      <span
        className="w-11 h-11 rounded-full grid place-items-center border"
        style={
          done
            ? { color: "var(--orange-500)", background: "color-mix(in srgb, var(--orange-500) 14%, transparent)", borderColor: "color-mix(in srgb, var(--orange-500) 35%, transparent)" }
            : { color: "var(--text-dim)", background: "var(--surface-3)", borderColor: "var(--border-strong)" }
        }
      >
        <Icon name={done ? icon : "shield"} size={20} />
      </span>
      <span className="text-xs font-semibold leading-[1.3]">{name}</span>
    </div>
  )
}

// =============================================================================
// Marquee — infinite scrolling strip of labels
// =============================================================================
interface MarqueeProps {
  items: string[]
  repeat?: number
  icon?: string
}

export function Marquee({ items, repeat = 2, icon = "bolt" }: MarqueeProps) {
  return (
    <div className="overflow-hidden border-y border-[var(--border)] py-[0.85rem] bg-[var(--surface)]" aria-hidden="true">
      <div className="flex w-max dsh-marquee-track">
        {Array.from({ length: repeat }).map((_, i) => (
          <span key={i} className="flex">
            {items.map((t) => (
              <span key={t} className="inline-flex items-center gap-[0.5rem] font-mono text-sm font-semibold tracking-[0.1em] text-[var(--text-muted)] px-7">
                {icon && <Icon name={icon} size={12} className="text-[var(--orange-500)]" />}
                {t}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Footer — global page footer (pixel-perfect port from handoff)
// =============================================================================
const FOOTER_COLS = [
  { title: "Plataforma", links: [["Juegos", "/herramientas"], ["Eventos", "/eventos"], ["Herramientas", "/herramientas"], ["Comunidad", "/comunidad"], ["Clasificación", "/eventos"]] },
  { title: "Recursos", links: [["Blog", "#"], ["Componentes", "/componentes"], ["Servidores", "#"], ["Estado", "#"], ["API", "#"]] },
  { title: "Compañía", links: [["Sobre nosotros", "#"], ["Contacto", "#"], ["Prensa", "#"], ["Discord", "#"]] },
]

interface FooterProps {
  go: (path: string) => void
}

export function Footer({ go }: FooterProps) {
  const year = new Date().getFullYear()
  const handle = (href: string) => (e: React.MouseEvent) => {
    if (href && href.startsWith("/")) { e.preventDefault(); go(href) }
  }

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
      <div className="grid grid-cols-[1.1fr_2fr] gap-14 py-16 px-8 max-[920px]:grid-cols-1 max-[920px]:gap-10">
        {/* Brand */}
        <div className="flex flex-col gap-[1.1rem] max-w-[30ch]">
          <a href="#" onClick={(e) => { e.preventDefault(); go("/") }} className="inline-flex items-center gap-[0.6rem]">
            <img src="/assets/boff-logo.webp" alt="" width={34} height={34} className="rounded-[6px]" />
            <span className="relative font-display font-extrabold text-[1.3rem] tracking-[0.01em] text-[var(--orange-500)] pr-[2.6rem]">
              BoffMedia
              <span className="absolute -top-[0.4rem] right-0 font-mono text-[0.5rem] font-bold tracking-[0.1em] px-[0.3rem] py-[0.12rem] text-[var(--on-accent)] bg-[var(--accent-bright)] rounded-[3px]">BETA</span>
            </span>
          </a>
          <p className="text-[length:var(--t-sm)] leading-[1.65] text-[var(--text-muted)] m-0">
            La plataforma para la comunidad de gaming, herramientas competitivas y eventos. Hecho por jugadores, para jugadores.
          </p>
          <div className="flex gap-[0.6rem]">
            <IconButton icon="discord" label="Discord" bordered href="#" />
            <IconButton icon="globe" label="Web" bordered href="#" />
            <IconButton icon="message" label="Foro" bordered href="#" />
            <IconButton icon="star" label="Reseñas" bordered href="#" />
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-[repeat(3,1fr)_1.4fr] gap-8 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[var(--label-spacing,0.1em)] text-[var(--text)] m-0 mb-[1.1rem]">{col.title}</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.7rem]">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href.startsWith("/") ? `#${href}` : href}
                      onClick={handle(href)}
                      className="text-[length:var(--t-sm)] text-[var(--text-muted)] transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* Newsletter */}
          <div>
            <h4 className="font-mono text-[length:var(--t-xs)] font-bold uppercase tracking-[var(--label-spacing,0.1em)] text-[var(--text)] m-0 mb-[1.1rem]">Newsletter</h4>
            <p className="text-[var(--text-muted)] text-[length:var(--t-sm)] mt-0 mb-0">Novedades, torneos y lanzamientos.</p>
            <form className="flex gap-[0.5rem] mt-[0.9rem]" onSubmit={(e) => e.preventDefault()}>
              <input
                className="flex-1 h-[46px] px-4 rounded-[var(--btn-radius,var(--radius-pill,9999px))] text-[length:var(--t-sm)] bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                type="email"
                placeholder="tu@correo.com"
                aria-label="Correo"
              />
              <Button variant="primary" iconRight="arrow" aria-label="Suscribirse" />
            </form>
          </div>
        </div>
      </div>

      {/* Legal bar */}
      <div className="flex items-center justify-between gap-4 py-[1.4rem] px-8 border-t border-[var(--border)] text-[length:var(--t-sm)] max-[560px]:flex-col max-[560px]:items-start">
        <span className="text-[var(--text-dim)]">© {year} BoffMedia. Todos los derechos reservados.</span>
        <div className="flex gap-6">
          {["Privacidad", "Términos", "Cookies"].map((label) => (
            <a
              key={label}
              href="#"
              onClick={(e) => { e.preventDefault(); go("/privacidad") }}
              className="text-[var(--text-muted)] transition-colors duration-[var(--dur)] hover:text-[var(--orange-500)]"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
