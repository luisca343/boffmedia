"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, Kicker, ToastStack } from "@/components/boffmedia/primitives"
import { CHAPTERS, DOMAINS } from "./showcase-data"
import { DISPLAY, DISPLAY_EM, MONO_LABEL, GRP_KEY, norm, sideLink } from "./showcase-shared"
import { BasesChapter } from "./_chapters/BasesChapter"
import { PrimitivasChapter } from "./_chapters/PrimitivasChapter"
import { PatronesChapter } from "./_chapters/PatronesChapter"
import { MovimientoChapter } from "./_chapters/MovimientoChapter"
import { HubChapter } from "./_chapters/HubChapter"
import { DatosChapter } from "./_chapters/DatosChapter"
import { JuegosChapter } from "./_chapters/JuegosChapter"
import { TorneosChapter } from "./_chapters/TorneosChapter"
import { PerfilChapter } from "./_chapters/PerfilChapter"
import { AdminChapter } from "./_chapters/AdminChapter"
import { ComunidadChapter } from "./_chapters/ComunidadChapter"
import { SorteosChapter } from "./_chapters/SorteosChapter"
import { CalendarioChapter } from "./_chapters/CalendarioChapter"
import { ArmeriaMhChapter } from "./_chapters/ArmeriaMhChapter"
import { MhShellChapter } from "./_chapters/MhShellChapter"
import { SchematicChapter } from "./_chapters/SchematicChapter"
import { MewgenicsChapter } from "./_chapters/MewgenicsChapter"
import { SorteoRapidoChapter } from "./_chapters/SorteoRapidoChapter"
import { BattlesimChapter } from "./_chapters/BattlesimChapter"
import { TcgPocketChapter } from "./_chapters/TcgPocketChapter"
import { WonderMailChapter } from "./_chapters/WonderMailChapter"
import { PlanificadorMhChapter } from "./_chapters/PlanificadorMhChapter"
import { BestiarioChapter } from "./_chapters/BestiarioChapter"
import { KeysChapter } from "./_chapters/KeysChapter"
import { CatalogoChapter } from "./_chapters/CatalogoChapter"
import { CalculadoraChapter } from "./_chapters/CalculadoraChapter"
import { LegalChapter } from "./_chapters/LegalChapter"

const CHAPTER_VIEWS: Record<string, React.ComponentType> = {
  Bases: BasesChapter,
  Primitivas: PrimitivasChapter,
  Patrones: PatronesChapter,
  Movimiento: MovimientoChapter,
  "Hub de herramientas": HubChapter,
  "Datos en vivo": DatosChapter,
  "Juegos y Eventos": JuegosChapter,
  Torneos: TorneosChapter,
  Perfil: PerfilChapter,
  Admin: AdminChapter,
  Comunidad: ComunidadChapter,
  Sorteos: SorteosChapter,
  Calendario: CalendarioChapter,
  "Sorteo rápido": SorteoRapidoChapter,
  Battlesim: BattlesimChapter,
  "TCG Pocket": TcgPocketChapter,
  "Wonder Mail": WonderMailChapter,
  Planificador: PlanificadorMhChapter,
  Bestiario: BestiarioChapter,
  "Herramientas MH": MhShellChapter,
  Armería: ArmeriaMhChapter,
  "Schematic Compat": SchematicChapter,
  Mewgenics: MewgenicsChapter,
  Catálogo: CatalogoChapter,
  "Claves de Steam": KeysChapter,
  Calculadora: CalculadoraChapter,
  Legal: LegalChapter,
}

export default function ComponentsShowcase() {
  const [grpName, setGrpName] = React.useState(CHAPTERS[0].name)
  const [q, setQ] = React.useState("")
  const [active, setActive] = React.useState(CHAPTERS[0].sections[0].id)
  const [openDoms, setOpenDoms] = React.useState<Set<string>>(new Set(["Sistema"]))
  const findRef = React.useRef<HTMLInputElement>(null)
  const firstGrp = React.useRef(true)

  const chapters = CHAPTERS
  const gi = chapters.findIndex((g) => g.name === grpName)
  const chapter = chapters[gi]
  const ActiveView = CHAPTER_VIEWS[chapter.name]

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

  return (
    <main className="wrap">
      <div className="pt-[34px]">
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
          <ActiveView />

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
