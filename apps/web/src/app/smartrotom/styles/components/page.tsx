"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CHAPTERS, DOMAINS, DOMAIN_META, chapterKey } from "./showcase-data"
import { DISPLAY, DISPLAY_EM, GRP_KEY, Kicker, MONO_LABEL, norm, sideLink } from "./showcase-shared"
import { SrBasesChapter } from "./_chapters/SrBasesChapter"
import { SrPrimitivasChapter } from "./_chapters/SrPrimitivasChapter"
import { SbBasesChapter } from "./_chapters/SbBasesChapter"
import { SbPrimitivasChapter } from "./_chapters/SbPrimitivasChapter"
import { SbDatosChapter } from "./_chapters/SbDatosChapter"
import { CaBasesChapter } from "./_chapters/CaBasesChapter"
import { CaPrimitivasChapter } from "./_chapters/CaPrimitivasChapter"
import { CaMensajeriaChapter } from "./_chapters/CaMensajeriaChapter"
import { NtBasesChapter } from "./_chapters/NtBasesChapter"
import { NtPrimitivasChapter } from "./_chapters/NtPrimitivasChapter"
import { PkBasesChapter } from "./_chapters/PkBasesChapter"
import { PkPrimitivasChapter } from "./_chapters/PkPrimitivasChapter"
import { MwBasesChapter } from "./_chapters/MwBasesChapter"
import { MwPrimitivasChapter } from "./_chapters/MwPrimitivasChapter"
import { MwTarjetasChapter } from "./_chapters/MwTarjetasChapter"
import { TxBasesChapter } from "./_chapters/TxBasesChapter"
import { TxPrimitivasChapter } from "./_chapters/TxPrimitivasChapter"
import { TxViajeChapter } from "./_chapters/TxViajeChapter"
import { MsBasesChapter } from "./_chapters/MsBasesChapter"
import { MsPrimitivasChapter } from "./_chapters/MsPrimitivasChapter"
import { MsTableroChapter } from "./_chapters/MsTableroChapter"
import { ArBasesChapter } from "./_chapters/ArBasesChapter"
import { ArPrimitivasChapter } from "./_chapters/ArPrimitivasChapter"
import { ArCabinaChapter } from "./_chapters/ArCabinaChapter"

// Chapter names repeat across domains ("Bases" ×6), so views are keyed by `dom/name`.
const CHAPTER_VIEWS: Record<string, React.ComponentType> = {
  "Sistema/Bases": SrBasesChapter,
  "Sistema/Primitivas": SrPrimitivasChapter,
  "Starbank/Bases": SbBasesChapter,
  "Starbank/Primitivas": SbPrimitivasChapter,
  "Starbank/Datos": SbDatosChapter,
  "ChatApp/Bases": CaBasesChapter,
  "ChatApp/Primitivas": CaPrimitivasChapter,
  "ChatApp/Mensajería": CaMensajeriaChapter,
  "Notas/Bases": NtBasesChapter,
  "Notas/Primitivas": NtPrimitivasChapter,
  "Pokédex/Bases": PkBasesChapter,
  "Pokédex/Primitivas": PkPrimitivasChapter,
  "Media/Bases": MwBasesChapter,
  "Media/Primitivas": MwPrimitivasChapter,
  "Media/Tarjetas": MwTarjetasChapter,
  "Taxi/Bases": TxBasesChapter,
  "Taxi/Primitivas": TxPrimitivasChapter,
  "Taxi/Viaje": TxViajeChapter,
  "Misiones/Bases": MsBasesChapter,
  "Misiones/Primitivas": MsPrimitivasChapter,
  "Misiones/Tablón": MsTableroChapter,
  "Arcade/Bases": ArBasesChapter,
  "Arcade/Primitivas": ArPrimitivasChapter,
  "Arcade/Cabina": ArCabinaChapter,
}

export default function SmartRotomComponentsShowcase() {
  const [grpKey, setGrpKey] = React.useState(chapterKey(CHAPTERS[0]))
  const [q, setQ] = React.useState("")
  const [active, setActive] = React.useState(CHAPTERS[0].sections[0].id)
  const [openDoms, setOpenDoms] = React.useState<Set<string>>(new Set(["Sistema"]))
  const findRef = React.useRef<HTMLInputElement>(null)
  // SmartRotom's AppWrapper is fixed-height + `overflow-hidden`, so this page scrolls
  // INTERNALLY (SMARTROTOM_V3.md §2). Every scroll/spy calculation is relative to this
  // container, not the window — the Boffmedia showcase can use `window` because its
  // shell window-scrolls; here that would silently never fire.
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const firstGrp = React.useRef(true)

  const chapters = CHAPTERS
  const gi = chapters.findIndex((g) => chapterKey(g) === grpKey)
  const chapter = chapters[gi] ?? chapters[0]
  const ActiveView = CHAPTER_VIEWS[chapterKey(chapter)]

  // hydrate persisted chapter (client-only → avoids SSR mismatch)
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(GRP_KEY)
      if (v && chapters.some((g) => chapterKey(g) === v)) setGrpKey(v)
    } catch {
      /* noop */
    }
  }, [])

  // chapter switch → reset active section, persist, scroll the container to top
  React.useEffect(() => {
    setActive(chapter.sections[0].id)
    setOpenDoms((s) => (s.has(chapter.dom) ? s : new Set([...s, chapter.dom])))
    try {
      localStorage.setItem(GRP_KEY, grpKey)
    } catch {
      /* noop */
    }
    if (firstGrp.current) {
      firstGrp.current = false
      return
    }
    scrollRef.current?.scrollTo({ top: 0 })
  }, [grpKey])

  // scroll spy — against the internal container
  React.useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const ids = chapter.sections.map((s) => s.id)
    const spy = () => {
      const top = root.getBoundingClientRect().top
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - top < root.clientHeight * 0.35) cur = id
      }
      setActive(cur)
    }
    spy()
    root.addEventListener("scroll", spy, { passive: true })
    return () => root.removeEventListener("scroll", spy)
  }, [grpKey])

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
    const root = scrollRef.current
    const el = document.getElementById(id)
    if (!root || !el) return
    const offset = el.getBoundingClientRect().top - root.getBoundingClientRect().top
    root.scrollTo({ top: root.scrollTop + offset - 24, behavior: "smooth" })
  }

  const hits = q.trim()
    ? (() => {
        const nq = norm(q.trim())
        const out: { id: string; label: string; grp: string; dom: string; key: string }[] = []
        chapters.forEach((g) =>
          g.sections.forEach((s) => {
            if (norm(s.label).includes(nq) || norm(g.name).includes(nq) || norm(g.dom).includes(nq))
              out.push({ id: s.id, label: s.label, grp: g.name, dom: g.dom, key: chapterKey(g) })
          }),
        )
        return out
      })()
    : null

  const openHit = (h: { id: string; key: string }) => {
    setQ("")
    if (h.key !== grpKey) {
      setGrpKey(h.key)
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
    // Pin the shell to an explicit height instead of chaining `h-full` up through
    // AppWrapper's flex tree: the shell is `overflow-hidden`, so if the height fails to
    // resolve the content simply grows and gets clipped with nothing to scroll. Every
    // real SmartRotom app roots itself the same way (`100dvh` minus the 3rem Rotom nav).
    <div className="flex h-[calc(100dvh_-_3rem)] w-full min-w-0 overflow-hidden bg-sr-bg text-sr-txt">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto overscroll-contain">
        <main className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
        <div className="pt-[34px]">
          <Kicker>Sistema de diseño · SmartRotom</Kicker>
          <h1 className={cn(DISPLAY, DISPLAY_EM, "text-[clamp(40px,11vw,72px)]/[0.92] mt-[14px] mb-[10px] break-words")}>
            Componentes de <em>SmartRotom</em>
          </h1>
          {/* The count is read off DOMAINS, not written in prose — it has gone stale
              once per migration otherwise. */}
          <p className="text-sr-txt-muted max-w-[68ch]">
            SmartRotom no es un sistema, son <strong className="text-sr-txt">{DOMAINS.length}</strong>: el chrome{" "}
            <code className="font-mono text-[13px] text-sr-accent">sr-*</code> y un vocabulario de tokens por app (Mewtube
            y Mewtwitch comparten uno). Cada espécimen se monta dentro de su propia raíz de ámbito, así que se ve
            exactamente como en la app real.
          </p>
          <p className={cn(MONO_LABEL, "mt-3 text-sr-txt-dim normal-case tracking-[0.1em]")}>
            {DOMAINS.length} sistemas · {chapters.length} capítulos · {totalSections} secciones — navega por sistema o pulsa{" "}
            <kbd className="border border-solid border-sr-line px-[5px] py-px">/</kbd> para buscar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-8 lg:gap-12 items-start pt-10">
          {/* ── index ── */}
          <aside className="lg:sticky lg:top-0 max-h-[48vh] lg:max-h-[calc(100dvh_-_8rem)] overflow-hidden flex flex-col lg:pt-1">
            <div className="flex-none flex items-center gap-[9px] border border-solid border-sr-line bg-sr-panel py-[10px] px-3 mb-3 text-sr-txt-dim transition-[border-color] duration-[140ms] focus-within:border-sr-accent focus-within:text-sr-txt-muted">
              <SearchGlyph />
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
                className="flex-1 min-w-0 bg-transparent border-0 outline-0 text-sr-txt font-mono text-[12px] leading-[1.2] tracking-[0.04em] placeholder:text-sr-txt-dim"
              />
              {q ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setQ("")}
                  className="bg-transparent border-0 cursor-pointer text-sr-txt-muted text-[11px] px-1 py-[2px] hover:text-sr-txt"
                >
                  ✕
                </button>
              ) : (
                <kbd className="font-mono text-[10px] leading-none text-sr-txt-dim border border-solid border-sr-line px-[6px] py-[3px]">
                  /
                </kbd>
              )}
            </div>

            <div className="overflow-y-auto overscroll-contain grid content-start gap-[2px] min-h-0">
              {hits ? (
                hits.length ? (
                  hits.map((h) => (
                    <a
                      key={h.key + h.id}
                      onClick={() => openHit(h)}
                      className={cn(
                        sideLink,
                        "grid gap-[5px] border-sr-line text-sr-txt-muted normal-case tracking-[0.04em] leading-[1.2] hover:text-sr-txt hover:bg-sr-panel",
                      )}
                    >
                      {h.label}
                      <span className="text-[9px] tracking-[0.16em] uppercase text-sr-txt-dim">
                        {h.dom} · {h.grp}
                      </span>
                    </a>
                  ))
                ) : (
                  <span className="py-3 px-[14px] font-mono text-[11px] leading-[1.6] text-sr-txt-dim">
                    Sin resultados para «{q.trim()}»
                  </span>
                )
              ) : (
                DOMAINS.map((d) => {
                  const dOpen = openDoms.has(d.name)
                  const dCur = d.chapters.some((g) => chapterKey(g) === grpKey)
                  const meta = DOMAIN_META[d.name]
                  return (
                    <div key={d.name} className="grid gap-[2px] mt-[14px] first:mt-0">
                      <button
                        type="button"
                        aria-expanded={dOpen}
                        onClick={() => toggleDom(d.name)}
                        className={cn(
                          "flex items-center gap-[9px] w-full text-left bg-transparent border-0 cursor-pointer pt-[10px] pr-[14px] pb-2 pl-px font-mono text-[10px] font-bold leading-none tracking-[0.2em] uppercase transition-colors duration-[140ms]",
                          dCur ? "text-sr-txt-muted hover:text-sr-txt" : "text-sr-txt-dim hover:text-sr-txt",
                        )}
                      >
                        <span
                          className={cn(
                            "flex-none w-[7px] h-[7px] rotate-45 transition-colors duration-[140ms]",
                            dOpen ? "bg-sr-accent" : "bg-sr-line-2",
                          )}
                        />
                        {d.name}
                        <span className="ml-auto font-medium text-sr-txt-dim tracking-[0.06em]">{meta?.ns}</span>
                        <span
                          className={cn(
                            "flex-none w-0 h-0 border-l-[4px] border-l-current border-y-[3.5px] border-y-transparent opacity-60 transition-transform duration-[140ms]",
                            dOpen && "rotate-90",
                          )}
                        />
                      </button>
                      {dOpen &&
                        d.chapters.map((g) => {
                          const key = chapterKey(g)
                          const open = key === grpKey
                          return (
                            <div key={key} className="grid gap-[2px]">
                              <button
                                type="button"
                                aria-expanded={open}
                                onClick={() => (open ? jump(g.sections[0].id) : setGrpKey(key))}
                                className={cn(
                                  "flex items-center gap-[9px] w-full text-left bg-transparent border-0 border-l-[3px] border-solid cursor-pointer py-[10px] px-[14px] font-mono text-[11px] font-bold leading-none tracking-[0.14em] uppercase transition-[color,border-color,background] duration-[140ms]",
                                  open
                                    ? "text-sr-txt border-l-sr-accent bg-sr-panel"
                                    : "text-sr-txt-muted border-l-sr-line hover:text-sr-txt hover:bg-sr-panel",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex-none w-0 h-0 border-l-[4px] border-l-current border-y-[3.5px] border-y-transparent opacity-60 transition-transform duration-[140ms]",
                                    open && "rotate-90",
                                  )}
                                />
                                {g.name}
                                <span className="ml-auto font-medium text-[10px] text-sr-txt-dim">{g.sections.length}</span>
                              </button>
                              {open &&
                                g.sections.map((s) => (
                                  <a
                                    key={s.id}
                                    onClick={() => jump(s.id)}
                                    className={cn(
                                      sideLink,
                                      "pl-[27px]",
                                      active === s.id
                                        ? "text-sr-txt border-l-sr-accent bg-sr-panel"
                                        : "text-sr-txt-muted border-l-sr-line hover:text-sr-txt hover:bg-sr-panel",
                                    )}
                                  >
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
            {ActiveView ? <ActiveView /> : null}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-solid border-sr-line pt-6">
              {gi > 0 ? (
                <button
                  type="button"
                  onClick={() => setGrpKey(chapterKey(chapters[gi - 1]))}
                  className="grid gap-[7px] text-left bg-sr-panel border border-solid border-sr-line text-sr-txt cursor-pointer py-[14px] px-5 min-w-0 flex-1 sm:flex-none sm:min-w-[190px] transition-[border-color,background] duration-[140ms] hover:border-sr-accent hover:bg-sr-panel-2"
                >
                  <small className="font-mono text-[10px] leading-none tracking-[0.16em] uppercase text-sr-txt-dim">
                    Anterior
                  </small>
                  <b className="font-mono text-[13px] leading-none tracking-[0.1em] uppercase">
                    {chapters[gi - 1].dom} · {chapters[gi - 1].name}
                  </b>
                </button>
              ) : (
                <span />
              )}
              <span className="font-mono text-[11px] leading-none tracking-[0.12em] text-sr-txt-dim">
                {String(gi + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
              </span>
              {gi < chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setGrpKey(chapterKey(chapters[gi + 1]))}
                  className="grid gap-[7px] text-right bg-sr-panel border border-solid border-sr-line text-sr-txt cursor-pointer py-[14px] px-5 min-w-0 flex-1 sm:flex-none sm:min-w-[190px] transition-[border-color,background] duration-[140ms] hover:border-sr-accent hover:bg-sr-panel-2"
                >
                  <small className="font-mono text-[10px] leading-none tracking-[0.16em] uppercase text-sr-txt-dim text-right">
                    Siguiente
                  </small>
                  <b className="font-mono text-[13px] leading-none tracking-[0.1em] uppercase">
                    {chapters[gi + 1].dom} · {chapters[gi + 1].name}
                  </b>
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}

function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}
