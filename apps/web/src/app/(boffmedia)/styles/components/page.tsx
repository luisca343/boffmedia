"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { Icon } from "@/components/boffmedia/primitives/icon"
import { Kicker } from "@/components/boffmedia/primitives/kicker"
import { Button } from "@/components/boffmedia/primitives/button"
import { IconButton } from "@/components/boffmedia/primitives/icon-button"
import { Chip } from "@/components/boffmedia/primitives/chip"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { Avatar, AvatarGroup } from "@/components/boffmedia/primitives/avatar"
import { IconBox } from "@/components/boffmedia/primitives/icon-box"
import { Field } from "@/components/boffmedia/primitives/field"
import { Input, Textarea } from "@/components/boffmedia/primitives/input"
import { Select } from "@/components/boffmedia/primitives/select"
import { SearchInput } from "@/components/boffmedia/primitives/search-input"
import { Toggle } from "@/components/boffmedia/primitives/toggle"
import { Checkbox } from "@/components/boffmedia/primitives/checkbox"
import { RadioGroup } from "@/components/boffmedia/primitives/radio-group"
import { Slider } from "@/components/boffmedia/primitives/slider"
import { Progress } from "@/components/boffmedia/primitives/progress"
import { Tabs } from "@/components/boffmedia/primitives/tabs"
import { Seg } from "@/components/boffmedia/primitives/seg"
import { Crumbs } from "@/components/boffmedia/primitives/crumbs"
import { Pagination } from "@/components/boffmedia/primitives/pagination"
import { Menu } from "@/components/boffmedia/primitives/menu"
import { ToastStack, toast } from "@/components/boffmedia/primitives/toast"
import { Modal } from "@/components/boffmedia/primitives/modal"
import { Popover } from "@/components/boffmedia/primitives/popover"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { Ring } from "@/components/boffmedia/primitives/ring"
import { Skeleton } from "@/components/boffmedia/primitives/skeleton"
import { Tooltip } from "@/components/boffmedia/primitives/tooltip"
import { Kbd } from "@/components/boffmedia/primitives/kbd"
import { Panel } from "@/components/boffmedia/primitives/panel"
import { Third } from "@/components/boffmedia/primitives/third"
import { Stats } from "@/components/boffmedia/primitives/stat"
import { Rank, RankRow } from "@/components/boffmedia/primitives/rank-row"
import { Table } from "@/components/boffmedia/primitives/table"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Ph } from "@/components/boffmedia/primitives/ph"
import { CountUp } from "@/components/boffmedia/primitives/count-up"
import { NavDropdown } from "@/components/boffmedia/ui/navigation/NavDropdown"
import { LangSwitcher } from "@/components/boffmedia/ui/navigation/LangSwitcher"
import { NotifMenu, type Notif } from "@/components/boffmedia/ui/navigation/NotifMenu"
import { buildToolsSections, buildComunidadSections } from "@/components/boffmedia/ui/navigation/nav-data"
import { useTranslations } from "next-intl"
import { Footer } from "@/components/boffmedia/ui/layout/Footer"
import { Marquee } from "@/components/boffmedia/ui/layout/Marquee"
import { Decode, useSignalFX } from "@/components/boffmedia/ui/landing/travesia-fx"
import { GLARE } from "@/components/boffmedia/ui/landing/landing-shared"
import { Divider } from "@/components/boffmedia/primitives/divider"
import { AuthProviderBtn } from "@/components/boffmedia/primitives/auth-provider-btn"
import { PasswordField } from "@/components/boffmedia/primitives/password-field"
import {
  ProfileHero,
  ProfileNote,
  RankStrip,
  TrophyCase,
  ActivityFeed,
  LinkedAccounts,
  LinkedAccountRow,
  AccountForm,
  TourLive,
  DEMO_STATS,
  DEMO_RANK,
  DEMO_TROPHIES,
  DEMO_ACTIVITY,
  DEMO_TOUR,
} from "@/components/boffmedia/ui/profile"

// ── index model ─────────────────────────────────────────────────────────────
interface SecMeta {
  id: string
  label: string
}
interface Chapter {
  name: string
  dom: string
  sections: SecMeta[]
}

const CHAPTERS: Chapter[] = [
  {
    name: "Bases",
    dom: "Sistema",
    sections: [
      { id: "color", label: "Color" },
      { id: "tipografia", label: "Tipografía" },
      { id: "geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Sistema",
    sections: [
      { id: "botones", label: "Botones" },
      { id: "chips", label: "Chips y badges" },
      { id: "formularios", label: "Formularios" },
      { id: "acceso", label: "Acceso" },
      { id: "seleccion", label: "Selección y rango" },
      { id: "navegacion", label: "Navegación" },
      { id: "navdrop", label: "Dropdown de nav" },
      { id: "navbar", label: "Sesión e idioma" },
      { id: "pie", label: "Pie de página" },
      { id: "menus", label: "Menús y avisos" },
      { id: "indicadores", label: "Anillo y carga" },
      { id: "ayudas", label: "Tooltip y teclas" },
      { id: "scrollbar", label: "Scrollbar" },
    ],
  },
  {
    name: "Patrones",
    dom: "Sistema",
    sections: [
      { id: "paneles", label: "Paneles" },
      { id: "datos", label: "Datos" },
      { id: "estados", label: "Estados" },
    ],
  },
  {
    name: "Movimiento",
    dom: "Sistema",
    sections: [
      { id: "fxniveles", label: "Niveles de FX" },
      { id: "marquesina", label: "Marquesina" },
      { id: "contador", label: "Contador y decode" },
      { id: "interaccion", label: "Cursor e imán" },
    ],
  },
  {
    name: "Perfil",
    dom: "Sistema",
    sections: [
      { id: "pf-identidad", label: "Identidad" },
      { id: "pf-rango", label: "Rango y stats" },
      { id: "pf-vitrina", label: "Vitrina" },
      { id: "pf-actividad", label: "Actividad" },
      { id: "pf-vinculadas", label: "Cuenta y enlaces" },
      { id: "pf-torneo", label: "Torneo en curso" },
    ],
  },
]

const DOMAINS = [{ name: "Sistema", chapters: CHAPTERS }]
const GRP_KEY = "bm-sc3-chapter"
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

// ── specimen wrapper ────────────────────────────────────────────────────────
function Sample({
  title,
  code,
  note,
  col,
  grid,
  children,
}: {
  title: React.ReactNode
  code?: React.ReactNode
  note?: React.ReactNode
  col?: boolean
  grid?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="border border-solid border-line bg-panel mb-[22px]">
      <div className="flex items-center gap-3 py-[10px] px-4 border-b border-solid border-line bg-panel-2">
        <h4 className={cn(HEAD4, "text-[14px]/[1.05] tracking-[0.08em]")}>{title}</h4>
        {code && <code className="ml-auto font-mono text-[11px] leading-none text-txt-dim">{code}</code>}
      </div>
      <div
        className={cn(
          "p-[26px] flex flex-wrap gap-4 items-center",
          col && "flex-col items-stretch flex-nowrap",
          grid && "grid grid-cols-1 sm:grid-cols-2",
        )}
      >
        {children}
      </div>
      {note && (
        <div className="font-body text-[13px] leading-[1.6] text-txt-muted py-3 px-4 border-t border-dashed border-line [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-accent">
          {note}
        </div>
      )}
    </div>
  )
}

function Section({ id, kicker, title, lead, children }: { id: string; kicker: string; title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-[74px] scroll-mt-[120px]">
      <Kicker>{kicker}</Kicker>
      <h2 className={cn(DISPLAY, "text-[clamp(30px,8vw,42px)]/[0.92] mt-[10px] mb-2")}>{title}</h2>
      {lead && <p className="text-txt-muted max-w-[66ch] mb-7 text-[15px] [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-accent">{lead}</p>}
      {children}
    </section>
  )
}

const MONO_LABEL = "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-txt-muted"

// Demo-only notifications — the real NotifMenu starts empty until a
// notifications API exists.
const DEMO_NOTIFS: Notif[] = [
  { id: 1, icon: "trophy", tone: "accent", text: "Tu equipo quedó 3.º en el Torneo Wingull 2.", time: "hace 2 min", read: false },
  { id: 2, icon: "gift", tone: "info", text: "Nuevo sorteo: clave de Steam disponible.", time: "hace 1 h", read: false },
  { id: 3, icon: "message", tone: "muted", text: "RotomChef respondió a tu hilo del foro.", time: "hace 3 h", read: false },
  { id: 4, icon: "star", tone: "muted", text: "Desbloqueaste el logro «Racha de 10».", time: "ayer", read: true },
]

// Display headings — «voz de la señal»: heavy italic uppercase, matching base.css
// (h1/h2/h3). Heading `em` becomes an accent-stroked outline.
const DISPLAY = "font-display font-extrabold italic uppercase leading-[0.92] tracking-[-0.005em]"
const DISPLAY_EM = "[&_em]:italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.6px_var(--accent)]"
const HEAD4 = "font-display font-bold uppercase tracking-[0.02em] leading-[1.05]"

// Live «directo» FX playground — owns its own useSignalFX so glare/tilt/magnet
// attach only while this section is mounted (the ref is null otherwise).
function FxPlayground() {
  const ref = React.useRef<HTMLDivElement>(null)
  useSignalFX(ref, 3)
  return (
    <div ref={ref} className="flex gap-[22px] items-center flex-wrap w-full p-7 border border-dashed border-line-2">
      <div
        data-glare
        data-tilt-fx
        className={cn("relative overflow-hidden w-[250px] max-w-full p-5 bg-panel border border-solid border-line cut-corner transition-transform duration-[140ms] will-change-transform", GLARE)}
      >
        <span className="font-mono text-[11px] text-txt-dim">01</span>
        <h4 className={cn(HEAD4, "text-[18px] mt-2")}>Tarjeta táctil</h4>
        <p className="mt-1 text-[13px] text-txt-muted">Tilt 3D + glare siguiendo el puntero.</p>
      </div>
      <Button variant="pri" iconRight="arrow">
        Botón magnético
      </Button>
    </div>
  )
}

export default function ComponentsShowcase() {
  const t = useTranslations()
  const toolsSections = React.useMemo(() => buildToolsSections(t), [t])
  const comunidadSections = React.useMemo(() => buildComunidadSections(t), [t])
  const [grpName, setGrpName] = React.useState(CHAPTERS[0].name)
  const [q, setQ] = React.useState("")
  const [active, setActive] = React.useState(CHAPTERS[0].sections[0].id)
  const [openDoms, setOpenDoms] = React.useState<Set<string>>(new Set(["Sistema"]))
  const findRef = React.useRef<HTMLInputElement>(null)
  const firstGrp = React.useRef(true)

  // demo state
  const [busy, setBusy] = React.useState(false)
  const [busy2, setBusy2] = React.useState(false)
  const [fchips, setFchips] = React.useState(["VGC", "Singles", "Clima", "Compartir"])
  const [tglA, setTglA] = React.useState(true)
  const [tglB, setTglB] = React.useState(false)
  const [sq, setSq] = React.useState("")
  const [ck1, setCk1] = React.useState(true)
  const [rad, setRad] = React.useState("dobles")
  const [rng, setRng] = React.useState(64)
  const [tab, setTab] = React.useState("uso")
  const [seg, setSeg] = React.useState("dia")
  const [pg, setPg] = React.useState(4)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [fxKey, setFxKey] = React.useState(0)

  const chapters = CHAPTERS
  const gi = chapters.findIndex((g) => g.name === grpName)
  const chapter = chapters[gi]

  // hydrate persisted chapter (client-only → avoids SSR mismatch)
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(GRP_KEY)
      if (v && chapters.some((g) => g.name === v)) setGrpName(v)
    } catch {
      /* noop */
    }

  }, [])

  // chapter switch → reset active section, persist, scroll to top of catalog
  React.useEffect(() => {
    setActive(chapter.sections[0].id)
    setOpenDoms((s) => (s.has(chapter.dom) ? s : new Set([...s, chapter.dom])))
    try {
      localStorage.setItem(GRP_KEY, grpName)
    } catch {
      /* noop */
    }
    if (firstGrp.current) {
      firstGrp.current = false
      return
    }
    const top = document.getElementById("sc3-top")
    if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 76 })

  }, [grpName])

  // scroll spy
  React.useEffect(() => {
    const ids = chapter.sections.map((s) => s.id)
    const spy = () => {
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) cur = id
      }
      setActive(cur)
    }
    spy()
    window.addEventListener("scroll", spy, { passive: true })
    return () => window.removeEventListener("scroll", spy)

  }, [grpName])

  // "/" focuses search
  React.useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const tag = (document.activeElement && document.activeElement.tagName) || ""
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
        e.preventDefault()
        findRef.current?.focus()
      }
    }
    window.addEventListener("keydown", kd)
    return () => window.removeEventListener("keydown", kd)
  }, [])

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" })
  }

  const hits = q.trim()
    ? (() => {
        const nq = norm(q.trim())
        const out: { id: string; label: string; grp: string; dom: string }[] = []
        chapters.forEach((g) =>
          g.sections.forEach((s) => {
            if (norm(s.label).includes(nq) || norm(g.name).includes(nq) || norm(g.dom).includes(nq))
              out.push({ id: s.id, label: s.label, grp: g.name, dom: g.dom })
          }),
        )
        return out
      })()
    : null

  const openHit = (h: { id: string; grp: string }) => {
    setQ("")
    if (h.grp !== grpName) {
      setGrpName(h.grp)
      setTimeout(() => jump(h.id), 90)
    } else jump(h.id)
  }

  const toggleDom = (name: string) =>
    setOpenDoms((s) => {
      const n = new Set(s)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })

  const totalSections = chapters.reduce((n, g) => n + g.sections.length, 0)

  const sideLink = "block font-mono text-[12px] font-semibold leading-none uppercase tracking-[0.1em] no-underline py-[10px] px-[14px] border-l-[3px] border-solid transition-[color,border-color,background] duration-[140ms] cursor-pointer"

  return (
    <main data-ds="boffmedia" className="wrap">
      <div className="pt-[34px]">
        <Kicker>Sistema de diseño · v3</Kicker>
        <h1 className={cn(DISPLAY, DISPLAY_EM, "text-[clamp(40px,11vw,72px)]/[0.92] mt-[14px] mb-[10px] break-words")}>
          Componentes de <em>Boffmedia</em>
        </h1>
        <p className="text-txt-muted max-w-[68ch]">
          Gráfica de retransmisión aplicada a producto: cortes diagonales, datos en mono, naranja de marca como señal en directo. Todo
          lo de esta página son los componentes reales del kit.
        </p>
        <p className={cn(MONO_LABEL, "mt-3 text-txt-dim normal-case tracking-[0.1em]")}>
          {DOMAINS.length} ámbitos · {chapters.length} capítulos · {totalSections} secciones — navega por ámbito o pulsa{" "}
          <kbd className="border border-solid border-line px-[5px] py-px">/</kbd> para buscar
        </p>
      </div>

      <div id="sc3-top" className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-8 lg:gap-12 items-start pt-10">
        {/* ── index ── */}
        <aside className="lg:sticky lg:top-[106px] max-h-[48vh] lg:max-h-[calc(100dvh_-_126px)] overflow-hidden flex flex-col">
          <div className="flex-none flex items-center gap-[9px] border border-solid border-line bg-panel py-[10px] px-3 mb-3 text-txt-dim transition-[border-color] duration-[140ms] focus-within:border-accent focus-within:text-txt-muted">
            <Icon name="search" size={14} />
            <input
              ref={findRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar componente…"
              aria-label="Buscar componente"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQ("")
                  ;(e.target as HTMLInputElement).blur()
                }
                if (e.key === "Enter" && hits && hits[0]) openHit(hits[0])
              }}
              className="flex-1 min-w-0 bg-transparent border-0 outline-0 text-txt font-mono text-[12px] leading-[1.2] tracking-[0.04em] placeholder:text-txt-dim"
            />
            {q ? (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQ("")} className="bg-transparent border-0 cursor-pointer text-txt-muted text-[11px] px-1 py-[2px] hover:text-txt">
                ✕
              </button>
            ) : (
              <kbd className="font-mono text-[10px] leading-none text-txt-dim border border-solid border-line px-[6px] py-[3px]">/</kbd>
            )}
          </div>

          <div className="overflow-y-auto overscroll-contain grid content-start gap-[2px] min-h-0">
            {hits ? (
              hits.length ? (
                hits.map((h) => (
                  <a key={h.id} onClick={() => openHit(h)} className={cn(sideLink, "grid gap-[5px] border-line text-txt-muted normal-case tracking-[0.04em] leading-[1.2] hover:text-txt hover:bg-panel")}>
                    {h.label}
                    <span className="text-[9px] tracking-[0.16em] uppercase text-txt-dim">
                      {h.dom} · {h.grp}
                    </span>
                  </a>
                ))
              ) : (
                <span className="py-3 px-[14px] font-mono text-[11px] leading-[1.6] text-txt-dim">Sin resultados para «{q.trim()}»</span>
              )
            ) : (
              DOMAINS.map((d) => {
                const dOpen = openDoms.has(d.name)
                const dCur = d.chapters.some((g) => g.name === grpName)
                return (
                  <div key={d.name} className="grid gap-[2px] mt-[14px] first:mt-0">
                    <button
                      type="button"
                      aria-expanded={dOpen}
                      onClick={() => toggleDom(d.name)}
                      className={cn(
                        "flex items-center gap-[9px] w-full text-left bg-transparent border-0 cursor-pointer pt-[10px] pr-[14px] pb-2 pl-px font-mono text-[10px] font-bold leading-none tracking-[0.2em] uppercase transition-colors duration-[140ms]",
                        dCur ? "text-txt-muted hover:text-txt" : "text-txt-dim hover:text-txt",
                      )}
                    >
                      <span className={cn("flex-none w-[7px] h-[7px] rotate-45 transition-colors duration-[140ms]", dOpen ? "bg-accent" : "bg-line-2")} />
                      {d.name}
                      <span className="ml-auto font-medium text-txt-dim tracking-[0.06em]">{d.chapters.length}</span>
                      <span className={cn("flex-none w-0 h-0 border-l-[4px] border-l-current border-y-[3.5px] border-y-transparent opacity-60 transition-transform duration-[140ms]", dOpen && "rotate-90")} />
                    </button>
                    {dOpen &&
                      d.chapters.map((g) => {
                        const open = g.name === grpName
                        return (
                          <div key={g.name} className="grid gap-[2px]">
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() => (open ? jump(g.sections[0].id) : setGrpName(g.name))}
                              className={cn(
                                "flex items-center gap-[9px] w-full text-left bg-transparent border-0 border-l-[3px] border-solid cursor-pointer py-[10px] px-[14px] font-mono text-[11px] font-bold leading-none tracking-[0.14em] uppercase transition-[color,border-color,background] duration-[140ms]",
                                open ? "text-txt border-l-accent bg-panel" : "text-txt-muted border-l-line hover:text-txt hover:bg-panel",
                              )}
                            >
                              <span className={cn("flex-none w-0 h-0 border-l-[4px] border-l-current border-y-[3.5px] border-y-transparent opacity-60 transition-transform duration-[140ms]", open && "rotate-90")} />
                              {g.name}
                              <span className="ml-auto font-medium text-[10px] text-txt-dim">{g.sections.length}</span>
                            </button>
                            {open &&
                              g.sections.map((s) => (
                                <a key={s.id} onClick={() => jump(s.id)} className={cn(sideLink, "pl-[27px]", active === s.id ? "text-txt border-l-accent bg-panel" : "text-txt-muted border-l-line hover:text-txt hover:bg-panel")}>
                                  {s.label}
                                </a>
                              ))}
                          </div>
                        )
                      })}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ── main ── */}
        <div className="min-w-0 pb-[90px]">
          {chapter.sections.some((s) => s.id === "color") && (
            <Section id="color" kicker="Bases" title="Color" lead="Grafito profundo con paneles de acero y un único acento: el naranja Boffmedia. Los tonos semánticos se reservan para estado, nunca para decorar.">
              <Sample title="Paleta" code="tokens">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full">
                  {(
                    [
                      ["--bg", "Fondo"],
                      ["--panel", "Panel"],
                      ["--line", "Línea"],
                      ["--text", "Texto"],
                      ["--muted", "Atenuado"],
                      ["--accent", "Naranja"],
                      ["--ok", "OK"],
                      ["--warn", "Aviso"],
                      ["--bad", "Error"],
                      ["--info", "Info"],
                    ] as const
                  ).map(([v, n]) => (
                    <div key={v} className="border border-solid border-line">
                      <i className="block h-16" style={{ background: `var(${v})` }} />
                      <div className="py-[9px] px-[11px] font-mono text-[10px] leading-[1.5] text-txt-muted">
                        <b className="block text-txt font-semibold">{n}</b>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </Sample>
              <Sample title="Temas" note="Oscuro es nativo. El claro conserva la barra superior negra de retransmisión y oscurece el naranja para contraste AA.">
                <Chip>data-theme=&quot;dark&quot;</Chip>
                <Chip>data-theme=&quot;light&quot;</Chip>
                <span className="text-txt-muted text-[14px]">← cambia con el interruptor de la barra</span>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "tipografia") && (
            <Section id="tipografia" kicker="Bases" title="Tipografía" lead="Tres voces: Saira Condensed Italic para titulares (la voz de la señal), Saira para lectura e IBM Plex Mono para datos, etiquetas y todo lo operativo.">
              <Sample title="Escala" code="Saira Condensed · Saira · IBM Plex Mono" col>
                <div className="grid gap-[18px] w-full">
                  {[
                    ["Display / 800 italic / 72–148px", <span key="a" className={cn(DISPLAY, DISPLAY_EM)} style={{ fontSize: 64 }}>Señal <em>en directo</em></span>],
                    ["Título / 800 italic / 42–64px", <span key="b" className={DISPLAY} style={{ fontSize: 40 }}>Eventos &amp; Ranking</span>],
                    ["Subtítulo / 700 / 19–26px", <h4 key="c" className={HEAD4} style={{ fontSize: 22 }}>Torneo Pixelmon Wingull 2</h4>],
                    ["Cuerpo / Saira 400 / 15–17px", <span key="d" className="max-w-[52ch]">Sumérgete en experiencias inmersivas y forma parte de una comunidad apasionada.</span>],
                    ["Dato / Mono 500–600 / 10–15px", <span key="e" className={MONO_LABEL}>Torneo · Servidor Wingull · 96 plazas</span>],
                  ].map(([meta, node], i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-2 sm:gap-[22px] items-baseline border-b border-dashed border-line pb-4 last:border-b-0 last:pb-0">
                      <span className="font-mono text-[11px] leading-[1.6] text-txt-dim">{meta as React.ReactNode}</span>
                      {node as React.ReactNode}
                    </div>
                  ))}
                </div>
              </Sample>
              <Sample title="Kicker" code="<Kicker>">
                <Kicker>Comunidad en acción</Kicker>
                <Kicker>Producto destacado · Próximamente</Kicker>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "geometria") && (
            <Section id="geometria" kicker="Bases" title="Geometría" lead="Nada de radios: la firma es el corte diagonal. Tres cortes fijos y una barra de acento de 4px. El corte siempre cae hacia la derecha, como un banner de retransmisión.">
              <Sample title="Cortes" code="cut · tag · corner">
                <div className="flex gap-[22px] flex-wrap">
                  {[
                    ["CUT 10px", "cut"],
                    ["TAG 8px", "cut-tag"],
                    ["CORNER 16px", "cut-corner"],
                  ].map(([l, clip]) => (
                    <div key={l} className={cn("w-[130px] h-[72px] bg-panel-2 border border-solid border-line-2 grid place-items-center font-mono text-[10px] leading-none text-txt-muted tracking-[0.08em]", clip)}>
                      {l}
                    </div>
                  ))}
                  <div className="w-[130px] h-[72px] bg-panel-2 border border-solid border-line-2 border-l-4 border-l-accent grid place-items-center font-mono text-[10px] leading-none text-txt-muted tracking-[0.08em]">
                    BARRA 4px
                  </div>
                </div>
              </Sample>
              <Sample title="Espaciado" code="ritmo 4px" col>
                <div className="w-full overflow-x-auto">
                <div className="grid gap-[10px] min-w-max">
                  {(
                    [
                      [4, "micro"],
                      [8, "chip"],
                      [16, "grupo"],
                      [24, "tarjeta"],
                      [40, "bloque"],
                      [84, "sección"],
                    ] as const
                  ).map(([n, l]) => (
                    <div key={n} className="flex items-center gap-4 whitespace-nowrap font-mono text-[11px] leading-none text-txt-muted">
                      <i className="h-[18px] bg-accent-soft border border-solid border-accent-line" style={{ width: n * 3 }} />
                      {n}px · {l}
                    </div>
                  ))}
                </div>
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "botones") && (
            <Section id="botones" kicker="Primitivas" title="Botones">
              <Sample title="Variantes" code="<Button variant size icon>">
                <Button variant="pri">Primario</Button>
                <Button>Secundario</Button>
                <Button variant="ghost">Fantasma</Button>
                <Button variant="danger">Peligro</Button>
                <Button variant="pri" disabled>
                  Deshabilitado
                </Button>
              </Sample>
              <Sample title="Tamaños e iconos">
                <Button variant="pri" size="lg" iconRight="arrow">
                  Explorar juegos
                </Button>
                <Button variant="pri" iconRight="arrow">
                  Inscribirse
                </Button>
                <Button size="sm" icon="download">
                  Exportar
                </Button>
                <IconButton name="search" label="Buscar" />
                <IconButton name="bell" label="Notificaciones" />
                <IconButton name="settings" label="Ajustes" />
              </Sample>
              <Sample
                title="Estado de carga"
                code="<Button loading>"
                note={
                  <>
                    Click → estado ocupado: el spinner sustituye la etiqueta sin cambiar el ancho, marca <code>aria-busy</code> y bloquea la interacción.
                  </>
                }
              >
                <Button
                  variant="pri"
                  icon="download"
                  loading={busy}
                  onClick={() => {
                    setBusy(true)
                    setTimeout(() => {
                      setBusy(false)
                      toast({ tone: "ok", title: "Exportado", msg: "El equipo se guardó en tu perfil." })
                    }, 1800)
                  }}
                >
                  {busy ? "Guardando…" : "Probar loading"}
                </Button>
                <Button icon="refresh" loading={busy2} onClick={() => { setBusy2(true); setTimeout(() => setBusy2(false), 1800) }}>
                  {busy2 ? "Sincronizando…" : "Sincronizar"}
                </Button>
                <Button variant="pri" loading>
                  Cargando
                </Button>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "chips") && (
            <Section id="chips" kicker="Primitivas" title="Chips y badges">
              <Sample title="Chips" code="<Chip on>" note={<>Chips filtran y etiquetan; con <code>on</code> se encienden en naranja.</>}>
                <Chip>Sincronización en vivo</Chip>
                <Chip>Multiplataforma</Chip>
                <Chip on>VGC</Chip>
                <Chip onClick={() => {}}>Minecraft</Chip>
              </Sample>
              <Sample title="Badges de estado" code="<Badge tone>">
                <Badge tone="live">En vivo</Badge>
                <Badge tone="new">Nuevo</Badge>
                <Badge>Próximo</Badge>
                <Badge tone="ok">Activo</Badge>
                <Badge tone="warn">Pendiente</Badge>
                <Badge tone="bad">Cerrado</Badge>
                <Badge tone="info">Beta</Badge>
              </Sample>
              <Sample title="Chips descartables" code="<Chip on onRemove>" note={<>Para filtros activos: la ✕ quita el chip sin disparar el chip entero.</>}>
                {fchips.map((t) => (
                  <Chip key={t} on onRemove={() => setFchips((a) => a.filter((x) => x !== t))}>
                    {t}
                  </Chip>
                ))}
                {fchips.length === 0 && (
                  <Button size="sm" variant="ghost" icon="refresh" onClick={() => setFchips(["VGC", "Singles", "Clima", "Compartir"])}>
                    Restaurar filtros
                  </Button>
                )}
              </Sample>
              <Sample title="Avatares" code="<Avatar> · <AvatarGroup items max>">
                <Avatar>AX</Avatar>
                <Avatar accent>NV</Avatar>
                <Avatar lg>KR</Avatar>
                <AvatarGroup items={["AX", { label: "NV", accent: true }, "KR", "JR", "MG", "CL", "ZZ"]} max={5} />
              </Sample>
              <Sample title="Caja de icono" code="<IconBox icon tone size>" note={<>El patrón «icono en caja tintada»; los tonos semánticos siguen reservados a estado.</>}>
                <IconBox icon="sword" size="lg" />
                <IconBox icon="cards" tone="info" />
                <IconBox icon="check" tone="ok" />
                <IconBox icon="alert" tone="warn" size="sm" />
                <IconBox icon="tree" tone="muted" />
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "formularios") && (
            <Section id="formularios" kicker="Primitivas" title="Formularios">
              <Sample title="Campos" code="<Field> + <Input>" col>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Nombre de invocador" hint="Como aparece en el servidor.">
                    <Input placeholder="AxelCraft" />
                  </Field>
                  <Field label="Juego">
                    <Select
                      value="vgc"
                      onChange={() => {}}
                      options={[
                        { value: "vgc", label: "Pokémon VGC" },
                        { value: "mc", label: "Minecraft" },
                        { value: "mh", label: "Monster Hunter Wilds" },
                      ]}
                    />
                  </Field>
                  <Field label="Código de equipo" error="Ese código ya está en uso.">
                    <Input defaultValue="ROT-2026" />
                  </Field>
                  <Field label="Buscar">
                    <SearchInput value={sq} onChange={setSq} placeholder="Buscar jugador, evento…" />
                  </Field>
                </div>
              </Sample>
              <Sample title="Área de texto" code="<Field> + <Textarea>" col note={<>Entrada multilínea con el mismo chasis; crece en vertical con <code>resize</code>.</>}>
                <div className="w-full max-w-[440px]">
                  <Field label="Notas del equipo" hint="Visible solo para ti.">
                    <Textarea rows={3} placeholder="Anota leads, coberturas, ideas de EV…" />
                  </Field>
                </div>
              </Sample>
              <Sample title="Interruptores" code="<Toggle>">
                <Toggle on={tglA} onChange={setTglA} label="Notificaciones" />
                <Toggle on={tglB} onChange={setTglB} label="Modo retransmisión" />
              </Sample>
              <Sample title="Búsqueda" code="<SearchInput value onChange size>" col note={<>Chasis con botón de limpiar cuando hay texto; variante <code>sm</code> para barras densas.</>}>
                <div className="grid gap-3 w-full max-w-[400px]">
                  <SearchInput value={sq} onChange={setSq} placeholder="Buscar jugador, evento…" />
                  <SearchInput value={sq} onChange={setSq} size="sm" placeholder="Variante sm" />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "acceso") && (
            <Section
              id="acceso"
              kicker="Primitivas"
              title="Acceso"
              lead={<>Las piezas de la pantalla de entrada, reutilizables sueltas: botones de proveedor (<code>AuthProviderBtn</code>), el campo de contraseña con mostrar/ocultar (<code>PasswordField</code>) y el separador con etiqueta (<code>Divider</code>). La pantalla completa vive en <code>/entrar</code>.</>}
            >
              <Sample title="Proveedores OAuth" code="<AuthProviderBtn>" note={<>Google queda neutro con la marca en el glifo; Discord y Steam llevan relleno de marca. Los proveedores aún sin conectar van en estado <code>soon</code> (atenuados, pero siguen avisando al pulsar).</>}>
                <div className="flex w-full max-w-[360px] flex-col gap-2.5">
                  <AuthProviderBtn provider="google" block>
                    Google
                  </AuthProviderBtn>
                  <div className="grid grid-cols-2 gap-2.5">
                    <AuthProviderBtn provider="discord" soon>
                      Discord
                    </AuthProviderBtn>
                    <AuthProviderBtn provider="steam" soon>
                      Steam
                    </AuthProviderBtn>
                  </div>
                </div>
              </Sample>

              <Sample title="Contraseña + separador" code="<PasswordField> · <Divider label>" col note={<>El ojo alterna la visibilidad (<code>aria-pressed</code>); el separador etiquetado divide proveedores del formulario.</>}>
                <Field label="Contraseña">
                  <PasswordField defaultValue="supersecreto" />
                </Field>
                <Divider label="o con tu correo" />
              </Sample>

              <Sample title="Pantalla de acceso" code="/entrar" note={<>Composición final: marca, proveedores, formulario y cambio entre iniciar sesión y crear cuenta. Conectada a NextAuth (credenciales + Google).</>}>
                <div className="flex w-full justify-center border border-solid border-line bg-base bg-[radial-gradient(100%_70%_at_50%_0%,var(--accent-soft),transparent_60%)] p-6">
                  <div className="flex w-full max-w-[380px] flex-col gap-[18px] border border-solid border-line-2 border-t-[3px] border-t-accent bg-panel px-7 pb-6 pt-7 [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%)]">
                    <span className="flex items-center gap-2.5 font-display text-[20px]/none font-extrabold italic uppercase text-txt">
                      BOFF<b className="text-accent">MEDIA</b>
                    </span>
                    <AuthProviderBtn provider="google" block>
                      Google
                    </AuthProviderBtn>
                    <Divider label="o con tu correo" />
                    <Field label="Usuario">
                      <Input placeholder="tu_usuario" />
                    </Field>
                    <Field label="Contraseña">
                      <PasswordField placeholder="••••••••" />
                    </Field>
                    <Button variant="pri" className="w-full">
                      Entrar
                    </Button>
                    <Button href="/entrar" variant="ghost" size="sm" iconRight="arrow" className="self-center">
                      Ver pantalla completa
                    </Button>
                  </div>
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "seleccion") && (
            <Section
              id="seleccion"
              kicker="Primitivas"
              title="Selección y rango"
              lead={<>Checkbox para selección múltiple, Radio para elección exclusiva con descripción y Slider para rango. Marcadores del sistema: cuadro con corte y diamante.</>}
            >
              <Sample title="Checkbox" code="<Checkbox checked onChange label>" col>
                <div className="grid gap-3">
                  <Checkbox checked={ck1} onChange={setCk1} label="Recibir novedades por correo" />
                  <Checkbox defaultChecked label="Mostrar mi actividad a la comunidad" />
                  <Checkbox disabled label="Opción no disponible" />
                </div>
              </Sample>
              <Sample title="Radio" code="<RadioGroup value onChange options>" col>
                <div className="w-full max-w-[440px]">
                  <RadioGroup
                    value={rad}
                    onChange={setRad}
                    ariaLabel="Formato de combate"
                    options={[
                      { value: "singles", label: "Singles", desc: "Combate 1v1 clásico." },
                      { value: "dobles", label: "Dobles / VGC", desc: "El formato oficial por equipos." },
                      { value: "draft", label: "Draft", desc: "Selección por turnos." },
                    ]}
                  />
                </div>
              </Sample>
              <Sample title="Slider" code="<Slider value min max unit onChange>" col note={<>El valor va en mono naranja; aquí alimenta al <code>Progress</code> de abajo.</>}>
                <div className="grid gap-[18px] w-full max-w-[440px]">
                  <Slider label="Volumen de la señal" value={rng} onChange={setRng} unit="%" />
                  <Progress value={rng} />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "navegacion") && (
            <Section id="navegacion" kicker="Primitivas" title="Navegación">
              <Sample title="Pestañas" code="<Tabs>" col>
                <Tabs
                  value={tab}
                  onChange={setTab}
                  tabs={[
                    { value: "uso", label: "Uso", count: 128 },
                    { value: "leads", label: "Leads", count: 64 },
                    { value: "cores", label: "Parejas", count: 32 },
                  ]}
                />
              </Sample>
              <Sample title="Segmentado" code="<Seg>">
                <Seg value={seg} onChange={setSeg} options={[{ value: "dia", label: "Día" }, { value: "semana", label: "Semana" }, { value: "mes", label: "Mes" }]} />
              </Sample>
              <Sample title="Miga de pan" code="<Crumbs>">
                <Crumbs items={[{ label: "Herramientas", href: "#" }, { label: "Pokémon", href: "#" }, { label: "Calculadora de daño" }]} />
              </Sample>
              <Sample title="Paginación" code="<Pagination page total onChange>" note={<>Trunca con elipsis alrededor de la actual; números en mono con cero a la izquierda.</>}>
                <Pagination page={pg} total={12} onChange={setPg} />
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "navdrop") && (
            <Section
              id="navdrop"
              kicker="Primitivas"
              title="Dropdown de nav"
              lead={<>El menú del navbar (<code>NavDropdown</code>): abre al pasar el cursor y el clic en el disparador navega al hub. Formato partido — carril de juegos a la izquierda; al pasar el cursor la hoja muestra sus herramientas agrupadas por categoría, con cabecera que navega a su hub. Se alimenta del registro de navegación (<code>buildToolsSections</code> deriva del registro <code>data/games</code>): añadir un juego o herramienta ahí lo hace aparecer aquí, en el hub y en la barra lateral sin tocar el navbar.</>}
            >
              <Sample title="Herramientas — juego → categorías" code="<NavDropdown demoOpen sections>" col note={<>Cada cabecera de categoría navega a su hub; la fila de juego navega a su página. Fijado abierto para la demo — arriba en la barra abre al pasar el cursor.</>}>
                <div className="relative min-h-[360px] w-full overflow-x-auto">
                  <NavDropdown demoOpen label="Herramientas" href="/herramientas" sections={toolsSections} />
                </div>
              </Sample>
              <Sample title="Comunidad — todo agrupado" code="buildComunidadSections" col note={<>Mismo formato para el menú de Comunidad.</>}>
                <div className="relative min-h-[300px] w-full overflow-x-auto">
                  <NavDropdown demoOpen label="Comunidad" href="/comunidad" sections={comunidadSections} />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "navbar") && (
            <Section
              id="navbar"
              kicker="Primitivas"
              title="Sesión e idioma"
              lead={<>Las piezas de la derecha del navbar, todas reutilizables: el conmutador de idioma (<code>LangSwitcher</code>), las notificaciones (<code>NotifMenu</code>) y los accesos de cuenta. Comparten el sistema de avisos <code>toast()</code>.</>}
            >
              <Sample title="Conmutador de idioma" code="<LangSwitcher>" note={<>Globo + segmentado ES/EN; el idioma activo se enciende en acento y persiste.</>}>
                <LangSwitcher />
              </Sample>
              <Sample title="Notificaciones" code="<NotifMenu>" note={<>Campana con contador de no leídas; el popover permite marcar leídas y limpiar, con estado vacío. Ábrela.</>}>
                <NotifMenu initialItems={DEMO_NOTIFS} />
              </Sample>
              <Sample title="Cuenta — sin sesión" code="<AccountNav>" note={<>Con sesión, <code>AccountNav</code> sustituye estos botones por el menú de cuenta (avatar + perfil + cerrar sesión) en la barra; sin sesión muestra Entrar / Crear cuenta, como aquí.</>}>
                <Button size="sm" variant="ghost" icon="user" href="/entrar">
                  Entrar
                </Button>
                <Button size="sm" variant="pri" icon="plus" href="/entrar?mode=register">
                  Crear cuenta
                </Button>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pie") && (
            <Section
              id="pie"
              kicker="Primitivas"
              title="Pie de página"
              lead={<>El <code>Footer</code> del shell: cierre de emisión con rejilla de columnas, enlaces sociales de corte diagonal y barra base con reloj en vivo. Todo con tokens, así que se adapta al tema claro/oscuro sin grises fijos.</>}
            >
              <Sample title="Pie completo" code="<Footer>" col note={<>Ancho completo del shell; marca con sociales, columnas theme-aware y barra base con reloj vivo y ubicación.</>}>
                <div className="w-full border border-solid border-line overflow-hidden [&_footer]:!mt-0">
                  <Footer />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "menus") && (
            <Section
              id="menus"
              kicker="Primitivas"
              title="Menús y avisos"
              lead={<>Cuatro capas de superposición: el menú de acciones (<code>Menu</code> / alias <code>Dropdown</code>), el <code>Popover</code> para filtros y detalles, el <code>Modal</code> para formularios y confirmaciones, y el <code>Toast</code> como aviso efímero. Todos comparten teclado completo, cierre con <code>Escape</code> y clic fuera.</>}
            >
              <Sample title="Menú de acciones" code="<Menu label items align>" note={<>Trigger con <code>aria-haspopup</code>; separadores y acción destructiva. Prueba a abrirlo con el teclado.</>}>
                <Menu
                  label="Acciones"
                  items={[
                    { label: "Editar equipo", icon: "edit", onSelect: () => toast("Abriendo editor…") },
                    { label: "Duplicar", icon: "copy", shortcut: "⌘D", onSelect: () => toast({ tone: "ok", msg: "Equipo duplicado." }) },
                    { label: "Compartir enlace", icon: "link", onSelect: () => toast({ tone: "info", msg: "Enlace copiado al portapapeles." }) },
                    { sep: true },
                    { label: "Archivar", icon: "inbox", disabled: true },
                    { label: "Eliminar", icon: "trash", danger: true, onSelect: () => toast({ tone: "bad", title: "Eliminado", msg: "El equipo se movió a la papelera." }) },
                  ]}
                />
                <Menu
                  variant="pri"
                  label="Exportar"
                  icon="download"
                  items={[
                    { label: "Como imagen (PNG)", icon: "eye", onSelect: () => toast("Exportando PNG…") },
                    { label: "Copiar Showdown", icon: "copy", onSelect: () => toast({ tone: "ok", msg: "Set copiado en formato Showdown." }) },
                    { label: "Enlace público", icon: "link", onSelect: () => toast({ tone: "info", msg: "Enlace público generado." }) },
                  ]}
                />
                <Menu
                  trigger={<IconButton name="settings" label="Opciones" />}
                  align="end"
                  ariaLabel="Opciones"
                  items={[
                    { label: "Ajustes", icon: "settings", onSelect: () => {} },
                    { label: "Ayuda", icon: "info", onSelect: () => {} },
                    { sep: true },
                    { label: "Cerrar sesión", icon: "back", onSelect: () => toast({ tone: "warn", msg: "Sesión cerrada." }) },
                  ]}
                />
              </Sample>
              <Sample
                title="Popover"
                code="<Popover trigger align side>"
                note={<>Contenedor flotante anclado al disparador; cierra con <code>Escape</code> o clic fuera. A diferencia del <code>Menu</code>, admite cualquier contenido — filtros, un detalle, un mini formulario.</>}
              >
                <Popover
                  ariaLabel="Filtros"
                  trigger={
                    <Button size="sm" icon="filter" iconRight="chevronDown">
                      Filtros
                    </Button>
                  }
                >
                  {({ close }) => (
                    <div className="grid gap-[14px]">
                      <span className={cn(MONO_LABEL, "text-txt-dim")}>Formato</span>
                      <div className="grid gap-[10px]">
                        <Checkbox defaultChecked label="VGC" />
                        <Checkbox label="Singles" />
                        <Checkbox label="Draft" />
                      </div>
                      <Button size="sm" variant="pri" onClick={close}>
                        Aplicar
                      </Button>
                    </div>
                  )}
                </Popover>
                <Popover align="end" ariaLabel="Detalle de jugador" trigger={<IconButton name="info" label="Detalle" />}>
                  <div className="grid gap-[6px] min-w-[220px]">
                    <b className="font-display text-[15px] not-italic uppercase tracking-[0.02em]">AxelCraft</b>
                    <span className="text-txt-muted text-[13px]">Equipo Volt · 12 480 pts · 3 logros</span>
                  </div>
                </Popover>
              </Sample>
              <Sample
                title="Diálogo modal"
                code="<Modal open onClose title footer>"
                note={<>Para formularios y confirmaciones: foco atrapado, <code>Escape</code> y clic en el velo cierran, y el scroll del fondo se bloquea. La esquina superior lleva el corte de 16px.</>}
              >
                <Button variant="pri" icon="edit" onClick={() => setModalOpen(true)}>
                  Abrir diálogo
                </Button>
                <Modal
                  open={modalOpen}
                  onClose={() => setModalOpen(false)}
                  title="Nuevo equipo"
                  footer={
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="pri"
                        size="sm"
                        icon="check"
                        onClick={() => {
                          setModalOpen(false)
                          toast({ tone: "ok", title: "Equipo creado", msg: "El equipo se añadió a tu perfil." })
                        }}
                      >
                        Guardar
                      </Button>
                    </>
                  }
                >
                  <div className="grid gap-4">
                    <Field label="Nombre del equipo" hint="Visible en tu perfil público.">
                      <Input placeholder="Volt Turno" />
                    </Field>
                    <Field label="Formato">
                      <Select
                        value="vgc"
                        onChange={() => {}}
                        options={[
                          { value: "vgc", label: "Pokémon VGC" },
                          { value: "singles", label: "Singles" },
                          { value: "draft", label: "Draft" },
                        ]}
                      />
                    </Field>
                  </div>
                </Modal>
              </Sample>
              <Sample title="Avisos (toast)" code="toast({ tone, title, msg, action })" note={<>Se apilan abajo-derecha y se autodescartan; máximo cuatro en pantalla. El tono tiñe el borde y el icono.</>}>
                <Button size="sm" onClick={() => toast({ tone: "ok", title: "Guardado", msg: "Tus cambios están seguros." })}>
                  Éxito
                </Button>
                <Button size="sm" onClick={() => toast({ tone: "bad", title: "Error", msg: "No se pudo conectar con el servidor." })}>
                  Error
                </Button>
                <Button size="sm" onClick={() => toast({ tone: "warn", msg: "Tu sesión caduca en 2 minutos." })}>
                  Aviso
                </Button>
                <Button size="sm" onClick={() => toast({ tone: "info", msg: "Nueva regulación disponible.", action: { label: "Ver", onClick: () => {} } })}>
                  Con acción
                </Button>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "indicadores") && (
            <Section
              id="indicadores"
              kicker="Primitivas"
              title="Anillo y carga"
              lead={<><code>Ring</code> es el progreso radial (logros, colecciones); <code>Spinner</code> es la carga indeterminada; <code>Skeleton</code> es la base genérica de carga que cada herramienta especializa. Complementan al <code>Progress</code> lineal de «Selección y rango».</>}
            >
              <Sample title="Anillo de progreso" code="<Ring value size>">
                <Ring value={rng} size={92}>
                  {rng}%
                </Ring>
                <Ring value={100} size={92}>
                  <Icon name="check" size={26} />
                </Ring>
                <Ring value={38} size={72}>
                  38%
                </Ring>
              </Sample>
              <Sample title="Spinner" code="<Spinner size>" note={<>Hereda <code>currentColor</code>, así que se tiñe según el contexto (aquí, naranja de acento). Con <code>reduce-motion</code> late en vez de girar. Es el mismo que sustituye la etiqueta de un <code>Button loading</code>.</>}>
                <Spinner size={16} />
                <Spinner size={22} />
                <Spinner size={30} className="text-accent" />
                <span className="inline-flex items-center gap-[10px] text-txt-muted text-[14px] ml-2">
                  <Spinner size={14} /> Cargando datos…
                </span>
              </Sample>
              <Sample title="Skeleton" code="<Skeleton w h avatar>" col note={<>Se detiene con <code>reduce-motion</code>. Aquí, el esqueleto de una fila de jugador.</>}>
                <div className="flex gap-[14px] items-center w-full max-w-[420px]">
                  <Skeleton w={48} h={48} avatar />
                  <div className="flex-1 grid gap-2">
                    <Skeleton w="60%" h={13} />
                    <Skeleton w="92%" h={9} />
                    <Skeleton w="40%" h={9} />
                  </div>
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "ayudas") && (
            <Section
              id="ayudas"
              kicker="Primitivas"
              title="Tooltip y teclas"
              lead={<>Ayuda contextual al pasar el cursor o enfocar (<code>Tooltip</code>) y teclas físicas (<code>Kbd</code>) para documentar atajos. El tooltip es solo texto — nunca lleva acciones dentro.</>}
            >
              <Sample title="Tooltip" code="<Tooltip label side>" note={<>Aparece con retardo en hover y foco de teclado; se coloca con <code>side</code>: top · bottom · left · right.</>}>
                <Tooltip label="Añadir al equipo">
                  <Button size="sm" icon="plus">
                    Pasa el cursor
                  </Button>
                </Tooltip>
                <Tooltip label="Notificaciones" side="bottom">
                  <IconButton name="bell" label="Notificaciones" />
                </Tooltip>
                <Tooltip label="Sincronizado hace 2 min" side="right">
                  <Badge tone="ok">Activo</Badge>
                </Tooltip>
              </Sample>
              <Sample title="Teclas" code="<Kbd>">
                <span className="inline-flex gap-[6px] items-center">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
                <span className={cn(MONO_LABEL, "text-txt-dim normal-case tracking-[0.08em]")}>abre la paleta</span>
                <span className="inline-flex gap-[6px] items-center ml-[18px]">
                  <Kbd>/</Kbd>
                </span>
                <span className={cn(MONO_LABEL, "text-txt-dim normal-case tracking-[0.08em]")}>busca en componentes</span>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "scrollbar") && (
            <Section
              id="scrollbar"
              kicker="Primitivas"
              title="Scrollbar"
              lead={<>Sistema global con tokens <code>--sb-*</code>: pista transparente y pulgar rectangular que se aviva al pasar el ratón o mientras hay scroll activo, y se enciende en naranja al arrastrarlo. Funciona en WebKit y Firefox, respeta ambos temas y no necesita clases — para regiones internas usa la clase <code>bm-scroll</code>.</>}
            >
              <Sample title="Región vertical" code="overflow-y-auto · bm-scroll" col note={<>Haz scroll dentro: el pulgar se aviva mientras te desplazas y vuelve a apagarse al parar.</>}>
                <div className="bm-scroll max-h-[200px] w-full overflow-y-auto border border-solid border-line bg-panel" aria-label="Registro de cambios">
                  {[
                    ["v3.4", "Calculadora de daño: soporte de teracristal"],
                    ["v3.3", "Clasificación: filtros por temporada"],
                    ["v3.2", "Perfil: vitrina de logros"],
                    ["v3.1", "Eventos: cuenta atrás en tarjetas"],
                    ["v3.0", "Rediseño «Señal»: lanzamiento"],
                    ["v2.9", "Foro: votos y menciones"],
                    ["v2.8", "Calendario: vista mensual"],
                    ["v2.7", "BattleSim: modo entrenamiento"],
                  ].map(([v, t]) => (
                    <div key={v} className="flex items-baseline gap-[14px] border-b border-solid border-line px-4 py-[11px] last:border-b-0">
                      <span className={cn(MONO_LABEL, "text-accent")}>{v}</span>
                      <span className="text-[14px] text-txt-muted">{t}</span>
                    </div>
                  ))}
                </div>
              </Sample>
              <Sample title="Región horizontal" code="overflow-x-auto · bm-scroll" col>
                <div className="bm-scroll w-full overflow-x-auto border border-solid border-line bg-panel px-4 pt-[14px] pb-[10px]" aria-label="Juegos">
                  <div className="flex w-max gap-2">
                    {["Pokémon VGC", "Minecraft", "Monster Hunter Wilds", "Pixelmon", "PMD: Sky", "Smash Ultimate", "Mario Kart", "Splatoon 3"].map((g) => (
                      <Chip key={g}>{g}</Chip>
                    ))}
                  </div>
                </div>
              </Sample>
              <Sample title="Estados del pulgar" code="--sb-idle · --sb-hover · --sb-drag" col note={<>Los tres tonos van pegados en contraste para que el paso reposo → hover no resulte brusco.</>}>
                <div className="grid w-full max-w-[420px] gap-3">
                  {[
                    ["var(--sb-idle)", "Reposo — discreto sobre el contenido"],
                    ["var(--sb-hover)", "Hover / scroll activo"],
                    ["var(--sb-drag)", "Arrastre — señal naranja"],
                  ].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-[14px]">
                      <span className="h-1.5 w-16 flex-none" style={{ background: c }} />
                      <span className={MONO_LABEL}>{l}</span>
                    </div>
                  ))}
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "paneles") && (
            <Section id="paneles" kicker="Patrones" title="Paneles">
              <Sample title="Panel con cabecera" code="<Panel title aside>" col>
                <Panel title="Próximos eventos" aside={<Badge tone="live">En vivo</Badge>}>
                  <p className="text-txt-muted text-[14px]">El contenido vive aquí. La esquina superior derecha lleva el corte de 16px — la firma del sistema.</p>
                </Panel>
              </Sample>
              <Sample title="Tercio inferior (fila de evento)" code="<Third>" col>
                <div className="grid gap-3">
                  <Third date="14" month="Jun" title="Torneo Pixelmon Wingull 2" meta="Torneo · Servidor Wingull" side={<Badge tone="new">Inscripción</Badge>} onClick={() => {}} />
                  <Third date="21" month="Jun" title="Minecraft Bingo · Edición rápida" meta="Competitivo · Servidor Bingo" side={<Badge>Próximo</Badge>} muted />
                </div>
              </Sample>
              <Sample title="Bloque de estadísticas" code="<Stats>">
                <div className="w-full overflow-x-auto">
                  <Stats
                    items={[
                      { n: <>412<b>+</b></>, l: "Jugadores" },
                      { n: "96", l: "Plazas" },
                      { n: "03", l: "Eventos" },
                    ]}
                  />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "datos") && (
            <Section id="datos" kicker="Patrones" title="Datos">
              <Sample title="Ranking" code="<Rank> + <RankRow>" col>
                <Rank>
                  <RankRow rank="1" name="AxelCraft" team="Equipo Volt" pts="12 480" unit="pts" top3 />
                  <RankRow rank="2" name="NovaPixel" team="Equipo Aqua" pts="11 920" unit="pts" top3 />
                  <RankRow rank="4" name="Zenor" team="Equipo Volt" pts="9 815" unit="pts" />
                </Rank>
              </Sample>
              <Sample title="Tabla" code="<Table>" col>
                <Table
                  columns={[
                    { key: "player", label: "Jugador" },
                    { key: "game", label: "Juego" },
                    { key: "ach", label: "Logros" },
                    { key: "pts", label: "Puntos", numeric: true },
                  ]}
                  rows={[
                    { player: "RotomChef", game: "VGC", ach: <Badge tone="ok">31</Badge>, pts: "4 820" },
                    { player: "EnderQueen", game: "Minecraft", ach: <Badge tone="ok">28</Badge>, pts: "4 510" },
                    { player: "TeraBlast", game: "VGC", ach: <Badge tone="ok">26</Badge>, pts: "4 180" },
                  ]}
                />
              </Sample>
              <Sample title="Progreso" code="<Progress>" col>
                <div className="grid gap-[14px]">
                  <Progress value={62} />
                  <Progress value={28} />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "estados") && (
            <Section id="estados" kicker="Patrones" title="Estados">
              <Sample title="Estado vacío" code="<Empty>" col>
                <div className="border border-dashed border-line-2">
                  <Empty icon="calendar" title="Sin eventos" lead="Cuando haya eventos programados aparecerán aquí, con inscripción y cuenta atrás.">
                    <Button variant="pri" size="sm">
                      Sugerir un evento
                    </Button>
                  </Empty>
                </div>
              </Sample>
              <Sample title="Placeholder de imagen" code="<Ph>">
                <Ph label="key art — personajes wingull 2" style={{ width: 300, height: 140 }} />
              </Sample>
              <Sample title="Skeleton" code="<Skeleton w h avatar>" col note={<>La base genérica de carga que las herramientas especializan (listas, carátulas, huecos de equipo). Se detiene con reduce-motion.</>}>
                <div className="flex gap-[14px] items-center w-full max-w-[420px]">
                  <Skeleton w={48} h={48} avatar />
                  <div className="flex-1 grid gap-2">
                    <Skeleton w="60%" h={13} />
                    <Skeleton w="92%" h={9} />
                    <Skeleton w="40%" h={9} />
                  </div>
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "fxniveles") && (
            <Section
              id="fxniveles"
              kicker="Movimiento"
              title="Niveles de FX"
              lead={<>La capa de movimiento es acumulativa: <strong>base</strong> (reveals, progreso de scroll, contadores, <code>Decode</code>), <strong>emisión</strong> (añade partículas y glare) y <strong>directo</strong> (añade cursor reticular, botones magnéticos y tilt 3D). Todo respeta <code>prefers-reduced-motion</code> y el interruptor global de animaciones.</>}
            >
              <Sample title="Niveles" code="useSignalFX(ref, lvl)" note={<>Reutilizables sobre cualquier contenedor con <code>useSignalFX</code>: el reveal por scroll (<code>useReveal</code> / <code>data-reveal</code>), el glare, el imán (<code>data-btn</code>) y el tilt 3D. Ligados a la landing: la barra de progreso (<code>FxProgress</code>), el cursor reticular (<code>FxCursor</code>) y los haces de luz (<code>beams</code>).</>}>
                <Chip>1 · Base</Chip>
                <Chip>2 · Emisión</Chip>
                <Chip on>3 · Directo</Chip>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "marquesina") && (
            <Section
              id="marquesina"
              kicker="Movimiento"
              title="Marquesina"
              lead={<>Cinta de titulares en display italic que alterna relleno y contorno, separada por diamantes. Divide bloques largos en la landing.</>}
            >
              <Sample title="Marquesina" code="<Marquee items speed>" col>
                <div className="w-full">
                  <Marquee items={["BoffMedia", "Wingull 2", "SmartRotom", "Torneos"]} speed={16} />
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "contador") && (
            <Section
              id="contador"
              kicker="Movimiento"
              title="Contador y decode"
              lead={<><code>CountUp</code> anima cifras al entrar en pantalla respetando prefijos, sufijos y agrupación («12 480», «412+», «03»). <code>Decode</code> «sintoniza» el texto de los kickers con caracteres de interferencia.</>}
            >
              <Sample title="En vivo" code="<CountUp value> · <Decode text>" col note={<>Pulsa reproducir para volver a lanzarlos.</>}>
                <div key={fxKey} className="flex flex-wrap items-center gap-[34px]">
                  <span className={cn(DISPLAY, "text-[54px] leading-none")}>
                    <CountUp value="12 480" />
                  </span>
                  <span className={cn(DISPLAY, "text-[54px] leading-none text-accent")}>
                    <CountUp value="412+" />
                  </span>
                  <Kicker>
                    <Decode text="Comunidad Pixelmon · En vivo" />
                  </Kicker>
                </div>
                <div>
                  <Button size="sm" icon="play" onClick={() => setFxKey((k) => k + 1)}>
                    Reproducir
                  </Button>
                </div>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "interaccion") && (
            <Section
              id="interaccion"
              kicker="Movimiento"
              title="Cursor e imán"
              lead={<>Nivel «directo»: cursor reticular propio en la landing, botones magnéticos (<code>data-btn</code>) y tilt 3D con glare en tarjetas (<code>data-tilt-fx</code>, <code>data-glare</code>). Solo con puntero fino y sin <code>prefers-reduced-motion</code>.</>}
            >
              <Sample title="Área de prueba" code="useSignalFX · data-glare · data-tilt-fx" col note={<>Mueve el puntero por encima: la tarjeta se inclina y brilla, y el botón se imanta hacia el cursor.</>}>
                <FxPlayground />
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pf-identidad") && (
            <Section
              id="pf-identidad"
              kicker="Perfil"
              title="Identidad"
              lead={<>La cabecera de perfil (<code>ProfileHero</code>): banda de portada con textura de retransmisión, lower-third con avatar biselado, identidad y métricas rápidas. En <code>/perfil</code> se muestra sin las métricas de ejemplo y con subida de avatar real.</>}
            >
              <Sample title="Cabecera" code="<ProfileHero>" col note={<>Con <code>editable</code> aparecen los botones de cámara; <code>live</code> enciende la bandera «EN VIVO». El avatar cae a la inicial cuando no hay imagen.</>}>
                <ProfileHero
                  name="RotomChef"
                  handle={<>@<b>rotomchef</b> · Miembro desde 2023</>}
                  initial="R"
                  live
                  editable
                  metrics={[{ v: "#42", l: "Ranking" }, { v: "4 180", l: "Puntos" }]}
                  tags={<><Badge tone="new">Admin</Badge><Badge tone="live">Minecraft</Badge></>}
                />
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pf-rango") && (
            <Section
              id="pf-rango"
              kicker="Perfil"
              title="Rango y stats"
              lead={<>Insignia de rango (<code>RankInsignia</code>) con barra de progreso y rejilla de <code>StatTile</code>, combinadas en <code>RankStrip</code>. Datos de ejemplo: aún sin API de estadísticas por usuario.</>}
            >
              <Sample title="Tira de rango" code="<RankStrip>" col>
                <RankStrip rank={DEMO_RANK} stats={DEMO_STATS} />
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pf-vitrina") && (
            <Section
              id="pf-vitrina"
              kicker="Perfil"
              title="Vitrina de logros"
              lead={<>Rejilla de trofeos (<code>TrophyCase</code> / <code>TrophyCard</code>) con estados conseguido y bloqueado, y sello de rareza.</>}
            >
              <Sample title="Trofeos" code="<TrophyCase>" col>
                <TrophyCase trophies={DEMO_TROPHIES} />
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pf-actividad") && (
            <Section
              id="pf-actividad"
              kicker="Perfil"
              title="Actividad"
              lead={<>Línea temporal de actividad (<code>ActivityFeed</code> / <code>ActivityRow</code>) con conector vertical entre hitos.</>}
            >
              <Sample title="Feed" code="<ActivityFeed>" col>
                <Panel title="Actividad reciente">
                  <ActivityFeed items={DEMO_ACTIVITY} />
                </Panel>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pf-vinculadas") && (
            <Section
              id="pf-vinculadas"
              kicker="Perfil"
              title="Cuenta y enlaces"
              lead={<>Formulario de cuenta (<code>AccountForm</code>) y cuentas vinculadas (<code>LinkedAccounts</code> / <code>LinkedAccountRow</code>). En <code>/perfil</code> se rellenan con la sesión real.</>}
            >
              <Sample title="Datos de la cuenta" code="<AccountForm>" col note={<>Controlado; deshabilitado salvo en modo edición. La biografía es solo demostración (sin API).</>}>
                <Panel title="Datos de la cuenta">
                  <AccountForm
                    editing
                    showBio
                    values={{ name: "RotomChef", email: "rotom@boffmedia.es", bio: "Entrenador de VGC y cazador a tiempo parcial." }}
                  />
                </Panel>
              </Sample>
              <Sample title="Cuentas vinculadas" code="<LinkedAccounts>" col>
                <Panel title="Cuentas vinculadas">
                  <LinkedAccounts>
                    <LinkedAccountRow icon="google" name="Google" hue="#ea4335" linked sub="rotom@gmail.com" end={<Badge tone="ok">Vinculado</Badge>} />
                    <LinkedAccountRow icon="discord" name="Discord" hue="#5865F2" sub="Sin vincular" end={<Button size="sm" icon="link">Vincular</Button>} />
                    <LinkedAccountRow icon="gamepad" name="Minecraft" hue="#3fbf5f" linked sub="RotomChef" end={<Badge tone="ok">Vinculado</Badge>} />
                  </LinkedAccounts>
                </Panel>
              </Sample>
            </Section>
          )}

          {chapter.sections.some((s) => s.id === "pf-torneo") && (
            <Section
              id="pf-torneo"
              kicker="Perfil"
              title="Torneo en curso"
              lead={<>Banner de torneo en directo (<code>TourLive</code>) y la nota de vista pública (<code>ProfileNote</code>).</>}
            >
              <Sample title="Torneo en directo" code="<TourLive>" col>
                <TourLive {...DEMO_TOUR} />
              </Sample>
              <Sample title="Nota de vista pública" code="<ProfileNote>" col>
                <ProfileNote>Estás viendo el perfil público de un usuario.</ProfileNote>
              </Sample>
            </Section>
          )}

          {/* chapter pager */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-solid border-line pt-6">
            {gi > 0 ? (
              <button type="button" onClick={() => setGrpName(chapters[gi - 1].name)} className="grid gap-[7px] text-left bg-panel border border-solid border-line text-txt cursor-pointer py-[14px] px-5 min-w-0 flex-1 sm:flex-none sm:min-w-[190px] transition-[border-color,background] duration-[140ms] hover:border-accent hover:bg-panel-2">
                <small className="font-mono text-[10px] leading-none tracking-[0.16em] uppercase text-txt-dim">Anterior</small>
                <b className="font-mono text-[13px] leading-none tracking-[0.1em] uppercase">{chapters[gi - 1].name}</b>
              </button>
            ) : (
              <span />
            )}
            <span className="font-mono text-[11px] leading-none tracking-[0.12em] text-txt-dim">
              {String(gi + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
            </span>
            {gi < chapters.length - 1 ? (
              <button type="button" onClick={() => setGrpName(chapters[gi + 1].name)} className="grid gap-[7px] text-right bg-panel border border-solid border-line text-txt cursor-pointer py-[14px] px-5 min-w-0 flex-1 sm:flex-none sm:min-w-[190px] transition-[border-color,background] duration-[140ms] hover:border-accent hover:bg-panel-2">
                <small className="font-mono text-[10px] leading-none tracking-[0.16em] uppercase text-txt-dim text-right">Siguiente</small>
                <b className="font-mono text-[13px] leading-none tracking-[0.1em] uppercase">{chapters[gi + 1].name}</b>
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>

      <ToastStack />
    </main>
  )
}
