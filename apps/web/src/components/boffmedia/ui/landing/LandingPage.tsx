"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives/button"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Chip } from "@/components/boffmedia/primitives/chip"
import { Kicker } from "@/components/boffmedia/primitives/kicker"
import { CountUp } from "@/components/boffmedia/primitives/count-up"
import { Marquee } from "@/components/boffmedia/ui/layout/Marquee"
import { useReveal } from "@/components/boffmedia/hooks/use-reveal"
import { Decode, FxProgress, FxParticles, FxCursor, useSignalFX } from "./travesia-fx"

/* Inline styles are used only where TailwindCSS cannot express the value:
   dynamic CSS custom properties driven by JS (--zr/--zg/--zb zone color, --pulse,
   --l/--i stagger indexes, minimap rail height) and the SVG-noise data-URI
   background (its quotes/spaces break arbitrary-value syntax). Everything else is
   Tailwind. `tv-route`/`tv-cp`/`tv-node` and `near`/`past`/`in` are unstyled JS
   marker classes, consumed via group-[.near]/[&.near] variants. */

/* Journey palette — each stop tints the sky; color interpolates continuously
   between stops so there are no hard edges between sections. */
const TV3_ZONES: [number, number, number][] = [
  [255, 92, 10], // 0 · Hero — brand orange
  [255, 138, 34], // 1 · Herramientas — amber
  [77, 163, 255], // 2 · SmartRotom — blue
  [255, 84, 52], // 3 · Torneos — red-orange
  [52, 211, 119], // 4 · Juegos — green
  [255, 178, 36], // 5 · Comunidad — gold
  [255, 92, 10], // 6 · Meta — orange
]

const TV3_STOPS = [
  { id: "tv-hero", n: "00", t: "Inicio" },
  { id: "tv-cp1", n: "01", t: "Herramientas" },
  { id: "tv-cp2", n: "02", t: "SmartRotom" },
  { id: "tv-cp3", n: "03", t: "Torneos" },
  { id: "tv-cp4", n: "04", t: "Juegos" },
  { id: "tv-cp5", n: "05", t: "Comunidad" },
  { id: "tv-meta", n: "06", t: "Meta" },
]

const TV3_HUD = [
  { k: "Partida", big: "412", suf: "+", sub: "jugadores activos", live: true },
  { k: "Temporada", big: "04", sub: "en emisión" },
]

const TV3_TOOLS = [
  { ix: "01", n: "BattleSim", d: "Simulador de combates dobles VGC con daño previsto.", ic: "sword", href: "/herramientas/pokemon/battlesim" },
  { ix: "02", n: "Calculadora de daño", d: "Rangos VGC y singles al instante, con enlaces.", ic: "calc", href: "/herramientas/pokemon/calc" },
  { ix: "03", n: "VGC Tracker", d: "Registra partidas y analiza tu rendimiento.", ic: "chart", href: "/herramientas/pokemon/tracker" },
  { ix: "04", n: "Visor de Torneos", d: "Emparejamientos, clasificación y Top Cut en directo.", ic: "trophy", href: "/herramientas/pokemon/vgc/torneos" },
  { ix: "05", n: "Claves de Steam", d: "Catálogo de claves para sorteos y entregas.", ic: "key", href: "/herramientas/otros/keys" },
  { ix: "06", n: "Calendario", d: "Toda la agenda de lanzamientos en un vistazo.", ic: "calendar", href: "/herramientas/otros/calendario" },
]

const TV3_FEATS = ["Multiplataforma", "Pokédex viva", "Economía en vivo", "Mensajería"]

const TV3_EVENT = { title: "Torneo Regional — Wingull 2", date: "14 JUL 2026 · 18:00" }
const TV3_EVENT_TS = new Date("2026-07-14T18:00:00").getTime()

const TV3_GAMES = [
  { n: "Pixelmon Wingull 2", d: "La aventura Pokémon definitiva dentro de Minecraft.", tag: "Insignia — Temporada 04", img: "/img/personajes.webp" },
  { n: "Minecraft Bingo", d: "Carreras de objetivos por equipos, ediciones rápidas.", tag: "Competitivo — Semanal", ph: "Minecraft Bingo" },
  { n: "Project ZomBOFF", d: "Supervivencia cooperativa en un mundo infectado.", tag: "Survival — Noches especiales", ph: "Project ZomBOFF" },
]

const TV3_FEED = [
  { k: "win", t: "AxelCraft ganó un combate ranked", ln: "border-l-ok", tp: "bg-ok" },
  { k: "gift", t: "Key entregada a NovaPixel en el sorteo", ln: "border-l-warn", tp: "bg-warn" },
  { k: "join", t: "Kira_07 se unió al Equipo Volt", ln: "border-l-signal", tp: "bg-signal" },
  { k: "win", t: "MintLeaf entró al top 5 de la temporada", ln: "border-l-ok", tp: "bg-ok" },
]

const DISCORD = "https://discord.gg/TWqjNHQz7d"

/* ---------- shared class fragments (scanned literally by Tailwind) ---------- */

/* fx2 primary-button glow, applied per-instance on the landing's pri buttons */
const PRI_GLOW = "shadow-[0_6px_26px_rgba(255,92,10,0.32)] hover:shadow-[0_10px_38px_rgba(255,92,10,0.5)]"

/* pointer glare — --gx/--gy set by useSignalFX on [data-glare] */
const GLARE =
  "before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:opacity-0 before:transition-opacity before:duration-[220ms] before:content-[''] before:[background:radial-gradient(240px_circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.07),transparent_65%)] hover:before:opacity-100 [[data-theme=light]_&]:before:[background:radial-gradient(240px_circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,92,10,0.07),transparent_65%)]"

/* HUD identity frame for the route's hero panels: top scanner sweep (::after)
   that scales in on approach + zone-tinted border on .near. No corner brackets —
   in the handoff these panels are `.sn-glare`, whose ::before (higher specificity)
   overrides the bracket background, so brackets never actually render. The glare
   lives on ::before via `GLARE` + `data-glare`; this frame only uses ::after. */
const HUD_FRAME =
  "after:pointer-events-none after:absolute after:left-0 after:right-0 after:top-0 after:z-[6] after:h-[2px] after:origin-left after:scale-x-0 after:transition-transform after:duration-[600ms] after:ease-[cubic-bezier(0.16,1,0.3,1)] after:content-[''] after:[background:linear-gradient(90deg,transparent,rgba(var(--zr),var(--zg),var(--zb),0.9),transparent)] group-[.near]:after:scale-x-100 " +
  "group-[.near]:border-[rgba(var(--zr),var(--zg),var(--zb),0.4)]"

/* hero headline masked-line reveal */
const LINE_MASK = "block overflow-hidden pb-[0.10em] pr-[0.12em] -mb-[0.10em]"
const LINE_INNER =
  "inline-block translate-y-[115%] [transition:transform_720ms_cubic-bezier(0.16,1,0.3,1)] [transition-delay:calc(var(--l,0)*95ms)] group-[.in]:translate-y-0 [.reveal-all_&]:translate-y-0 [.no-motion_&]:translate-y-0 motion-reduce:translate-y-0 motion-reduce:transition-none"

/* rotating light beams (lv4-beams) */
const BEAMS =
  "absolute rounded-full blur-[8px] will-change-transform animate-[lv4-spin_70s_linear_infinite] [.no-motion_&]:animate-none [[data-theme=light]_&]:opacity-50 [background:conic-gradient(from_210deg_at_50%_50%,transparent,rgba(255,122,51,0.15),transparent_30%,transparent_60%,rgba(255,178,36,0.11),transparent_80%)]"

/* SVG-noise grain — data-URI kept as inline style (quotes/spaces break arbitrary values) */
const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E")`,
}

function Grain() {
  return (
    <i
      aria-hidden="true"
      style={GRAIN_STYLE}
      className="absolute inset-0 opacity-[0.06] mix-blend-overlay [[data-theme=light]_&]:opacity-[0.04] [[data-theme=light]_&]:mix-blend-multiply"
    />
  )
}

const tvGoTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" })
}

/* ---------- countdown ---------- */
function TvCountdown({ to = TV3_EVENT_TS, compact }: { to?: number; compact?: boolean }) {
  const [left, setLeft] = React.useState(() => Math.max(0, to - Date.now()))
  React.useEffect(() => {
    const iv = setInterval(() => setLeft(Math.max(0, to - Date.now())), 1000)
    return () => clearInterval(iv)
  }, [to])
  const s = Math.floor(left / 1000)
  const parts = [
    { n: Math.floor(s / 86400), l: "Días" },
    { n: Math.floor((s % 86400) / 3600), l: "Horas" },
    { n: Math.floor((s % 3600) / 60), l: "Min" },
    { n: s % 60, l: "Seg" },
  ]
  return (
    <div className={cn("flex", compact ? "gap-2" : "gap-3.5")} role="timer" aria-label="Cuenta atrás al próximo evento">
      {parts.map((p) => (
        <span
          key={p.l}
          className={cn(
            "relative border border-solid border-line text-center before:absolute before:left-0 before:right-0 before:top-0 before:h-[var(--bar,0px)] before:bg-accent before:content-['']",
            compact ? "min-w-[48px] bg-[#0d1015] px-1.5 pb-1.5 pt-2" : "min-w-[66px] bg-panel px-2.5 pb-2.5 pt-3",
          )}
        >
          <span
            className={cn("block font-display font-bold leading-none text-txt tabular-nums", compact ? "text-[22px]" : "text-[34px]")}
            suppressHydrationWarning
          >
            {String(p.n).padStart(2, "0")}
          </span>
          <span className="mt-[5px] block font-mono text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-txt-dim">{p.l}</span>
        </span>
      ))}
    </div>
  )
}

/* ---------- mouse parallax: exposes smoothed --mx/--my ---------- */
function useTvMouseVar(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let run = false
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    const tick = () => {
      if (document.documentElement.classList.contains("no-motion")) {
        run = false
        return
      }
      cx += (tx - cx) * 0.07
      cy += (ty - cy) * 0.07
      el.style.setProperty("--mx", cx.toFixed(4))
      el.style.setProperty("--my", cy.toFixed(4))
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick)
      else run = false
    }
    const on = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
      if (!run) {
        run = true
        raf = requestAnimationFrame(tick)
      }
    }
    el.addEventListener("pointermove", on, { passive: true })
    return () => {
      el.removeEventListener("pointermove", on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}

/* ---------- scroll parallax for the hero glows ---------- */
function useTvParallax(rootRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const els: { el: HTMLElement; sp: number }[] = []
    root.querySelectorAll<HTMLElement>("[data-pglow]").forEach((el) => {
      const big = Math.max(el.offsetWidth, el.offsetHeight) > 600
      els.push({ el, sp: big ? 0.05 : 0.085 })
    })
    if (!els.length) return
    let raf = 0
    let pend = false
    const on = () => {
      if (pend) return
      pend = true
      raf = requestAnimationFrame(() => {
        pend = false
        if (document.documentElement.classList.contains("no-motion")) return
        const vh = window.innerHeight || 800
        els.forEach(({ el, sp }) => {
          const sec = el.closest("section") || el.parentElement
          if (!sec) return
          const r = sec.getBoundingClientRect()
          if (r.bottom < -120 || r.top > vh + 120) return
          const c = r.top + r.height / 2 - vh / 2
          el.style.transform = `translate3d(0,${(-c * sp).toFixed(1)}px,0)`
        })
      })
    }
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on, { passive: true })
    on()
    return () => {
      window.removeEventListener("scroll", on)
      window.removeEventListener("resize", on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [rootRef])
}

/* ---------- journey hook: progress → sky color, pulse, stops ---------- */
function useJourney(rootRef: React.RefObject<HTMLElement | null>, setStop: (n: number) => void) {
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    let raf = 0
    let pend = false
    const on = () => {
      if (pend) return
      pend = true
      raf = requestAnimationFrame(() => {
        pend = false
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const p = max > 0 ? clamp((window.scrollY || 0) / max, 0, 1) : 0
        const segs = TV3_ZONES.length - 1
        const f = p * segs
        const i = Math.min(segs - 1, Math.floor(f))
        const tt = f - i
        const c0 = TV3_ZONES[i]
        const c1 = TV3_ZONES[i + 1]
        root.style.setProperty("--zr", String(Math.round(lerp(c0[0], c1[0], tt))))
        root.style.setProperty("--zg", String(Math.round(lerp(c0[1], c1[1], tt))))
        root.style.setProperty("--zb", String(Math.round(lerp(c0[2], c1[2], tt))))
        root.style.setProperty("--jp", `${(p * 100).toFixed(2)}%`)

        const route = root.querySelector<HTMLElement>(".tv-route")
        if (route) {
          const rr = route.getBoundingClientRect()
          const cy = clamp(window.innerHeight * 0.5 - rr.top, 0, rr.height)
          route.style.setProperty("--pulse", `${cy.toFixed(1)}px`)
          route.querySelectorAll<HTMLElement>(".tv-cp").forEach((cp) => {
            const nd = cp.querySelector<HTMLElement>(".tv-node")
            if (!nd) return
            const ncy = nd.getBoundingClientRect().top + nd.offsetHeight / 2 - rr.top
            cp.classList.toggle("past", cy >= ncy - 8)
            cp.classList.toggle("near", Math.abs(cy - ncy) < window.innerHeight * 0.34)
          })
        }

        const mid = window.innerHeight * 0.5
        let best = 0
        let bestD = Infinity
        TV3_STOPS.forEach((sp, ix) => {
          const el = document.getElementById(sp.id)
          if (!el) return
          const r = el.getBoundingClientRect()
          const c = r.top + r.height / 2
          const d = Math.abs(c - mid)
          if (d < bestD) {
            bestD = d
            best = ix
          }
        })
        setStop(best)
      })
    }
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on, { passive: true })
    on()
    return () => {
      window.removeEventListener("scroll", on)
      window.removeEventListener("resize", on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [rootRef, setStop])
}

/* ---------- side minimap ---------- */
function TvMinimap({ active }: { active: number }) {
  return (
    <aside
      className="group/map fixed left-[22px] top-1/2 z-[560] flex -translate-y-1/2 flex-col gap-[2px] py-1.5 max-[1120px]:hidden"
      aria-label="Mapa del recorrido"
    >
      <span className="absolute bottom-3.5 left-1.5 top-3.5 w-[2px] overflow-hidden bg-line" aria-hidden="true">
        <i
          className="block w-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_8px_rgba(var(--zr),var(--zg),var(--zb),0.6)] [transition:height_260ms_cubic-bezier(0.16,1,0.3,1),background_260ms_linear]"
          style={{ height: `${(active / (TV3_STOPS.length - 1)) * 100}%` }}
        />
      </span>
      {TV3_STOPS.map((s, ix) => {
        const on = ix === active
        const done = ix < active
        return (
          <button
            key={s.id}
            className="group/stop relative flex cursor-pointer items-center gap-3 py-1.5 pr-1.5 text-left"
            onClick={() => tvGoTo(s.id)}
            aria-current={on ? "true" : undefined}
            title={s.t}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative z-[2] h-3.5 w-3.5 flex-none rounded-full border-2 border-solid bg-base transition-all duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover/stop:border-[rgba(var(--zr),var(--zg),var(--zb),1)]",
                on
                  ? "border-[rgba(var(--zr),var(--zg),var(--zb),1)] bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_4px_rgba(var(--zr),var(--zg),var(--zb),0.16),0_0_16px_rgba(var(--zr),var(--zg),var(--zb),0.7)]"
                  : done
                    ? "border-[rgba(var(--zr),var(--zg),var(--zb),0.7)] bg-[rgba(var(--zr),var(--zg),var(--zb),0.35)]"
                    : "border-line-2",
              )}
            />
            <span
              className={cn(
                "pointer-events-none flex -translate-x-1.5 items-baseline gap-[7px] whitespace-nowrap font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] opacity-0 transition-[opacity,transform,color] duration-[140ms] group-hover/map:translate-x-0 group-hover/map:opacity-100",
                on ? "translate-x-0 text-txt opacity-100" : "text-txt-dim",
              )}
            >
              <b className={on ? "text-txt" : "text-txt-muted"}>{s.n}</b>
              {s.t}
            </span>
          </button>
        )
      })}
    </aside>
  )
}

/* ---------- HERO ---------- */
function TvHero({ lvl, density }: { lvl: number; density: number }) {
  const artRef = React.useRef<HTMLDivElement>(null)
  useTvMouseVar(artRef)
  return (
    <section className="relative z-[1] grid min-h-screen items-center overflow-hidden pb-24 pt-[118px]" id="tv-hero">
      {lvl >= 2 && <FxParticles density={density} />}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <i
          data-pglow
          className="absolute left-[-200px] top-[-160px] h-[760px] w-[760px] rounded-full blur-[110px] will-change-transform [background:radial-gradient(circle,rgba(255,92,10,0.16),transparent_66%)] [[data-theme=light]_&]:opacity-55"
        />
        <i
          data-pglow
          className="absolute right-[-150px] top-[90px] h-[620px] w-[620px] rounded-full blur-[110px] will-change-transform [background:radial-gradient(circle,rgba(255,138,34,0.14),transparent_68%)] [[data-theme=light]_&]:opacity-55"
        />
        <i className="absolute inset-0 opacity-50 [background-image:linear-gradient(var(--stripe)_1px,transparent_1px),linear-gradient(90deg,var(--stripe)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(110%_85%_at_50%_40%,#000_35%,transparent_75%)] [-webkit-mask-image:radial-gradient(110%_85%_at_50%_40%,#000_35%,transparent_75%)]" />
        <Grain />
      </div>
      <div className="relative z-[2] mx-auto grid max-w-[1280px] grid-cols-[1.08fr_0.92fr] items-center gap-[50px] px-5 max-[980px]:grid-cols-1 max-[980px]:gap-[30px] min-[640px]:px-10">
        <div>
          <Kicker>
            <Decode text="Comunidad Pixelmon · Un solo recorrido" />
          </Kicker>
          <h1
            data-reveal="lines"
            className="group mb-0 mt-4 font-display font-extrabold italic uppercase leading-[0.95] tracking-[-0.005em] text-txt !opacity-100 !transform-none [font-size:clamp(52px,6.4vw,104px)]"
          >
            <span className={LINE_MASK}>
              <span className={LINE_INNER} style={{ ["--l"]: 0 } as React.CSSProperties}>
                Empieza la
              </span>
            </span>
            <span className={LINE_MASK}>
              <span className={LINE_INNER} style={{ ["--l"]: 1 } as React.CSSProperties}>
                <em className="italic text-accent [-webkit-text-stroke:1.6px_var(--accent)] [text-shadow:0_0_38px_rgba(255,92,10,0.45)]">
                  travesía
                </em>{" "}
                gamer
              </span>
            </span>
          </h1>
          <p
            data-reveal
            style={{ ["--i"]: 1 } as React.CSSProperties}
            className="mb-0 mt-6 max-w-[500px] font-body text-[17px] font-normal leading-[1.65] text-txt-muted"
          >
            Herramientas, torneos, sorteos y comunidad enlazados en un único recorrido. Baja y déjate llevar: cada parada enciende la
            siguiente.
          </p>
          <div data-reveal style={{ ["--i"]: 2 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-3.5">
            <Button variant="pri" size="lg" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
              Comenzar el recorrido
            </Button>
            <Button size="lg" onClick={() => tvGoTo("tv-cp1")}>
              Ver el mapa
            </Button>
          </div>
          <div data-reveal style={{ ["--i"]: 3 } as React.CSSProperties} className="mt-10 flex gap-3.5 max-[820px]:flex-wrap">
            {TV3_HUD.map((h) => (
              <div
                key={h.k}
                className="relative min-w-[150px] border border-solid border-line px-4 pb-[13px] pt-3.5 backdrop-blur-[6px] [background:rgba(10,12,16,0.6)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_9px),calc(100%_-_9px)_100%,0_100%)] before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:bg-accent before:content-[''] [[data-theme=light]_&]:[background:rgba(255,255,255,0.6)]"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
                  {h.live && <i className="h-1.5 w-1.5 rounded-full bg-ok animate-[lv4-blink_1.6s_infinite]" aria-hidden="true" />}
                  {h.k}
                </span>
                <span className="mb-[3px] mt-2 block font-display text-[30px] font-extrabold leading-none text-txt tabular-nums">
                  <CountUp value={h.big} />
                  {h.suf && <b>{h.suf}</b>}
                </span>
                <span className="block font-body text-[12px] font-normal leading-[1.3] text-txt-muted">{h.sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative grid min-h-[500px] place-items-center max-[980px]:order-first max-[980px]:min-h-[360px]"
          ref={artRef}
          data-reveal="scale"
          style={{ ["--i"]: 2 } as React.CSSProperties}
        >
          <div
            className="absolute z-0 h-[460px] w-[460px] rounded-full blur-[60px] [background:radial-gradient(circle,rgba(255,92,10,0.32),transparent_66%)]"
            aria-hidden="true"
          />
          <i className={cn(BEAMS, "left-[calc(50%_-_360px)] top-[calc(50%_-_360px)] h-[720px] w-[720px]")} aria-hidden="true" />
          <i
            className="absolute left-[calc(50%_-_270px)] top-[calc(50%_-_270px)] h-[540px] w-[540px] rounded-full border border-dashed border-line-2 opacity-70 animate-[lv4-spin_90s_linear_infinite] [.no-motion_&]:animate-none"
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="relative z-[2] w-[min(100%,500px)] max-[980px]:w-[min(80%,360px)] [filter:drop-shadow(0_26px_44px_rgba(0,0,0,0.55))_drop-shadow(0_0_56px_rgba(255,92,10,0.30))] [[data-theme=light]_&]:[filter:drop-shadow(0_22px_38px_rgba(20,23,28,0.28))_drop-shadow(0_0_46px_rgba(240,78,0,0.22))] [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:will-change-transform [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:[transform:perspective(950px)_rotateY(calc(var(--mx,0)*9deg))_rotateX(calc(var(--my,0)*-7deg))] opacity-[0.67]" src="/img/boff-logo.webp" alt="" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}

          <div className="absolute left-[-6%] top-[12%] z-[3] inline-flex items-center gap-2 border border-solid border-line-2 border-l-[3px] border-l-accent px-3 py-2 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#f2f4f8] [background:rgba(0,0,0,0.82)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_7px),calc(100%_-_7px)_100%,0_100%)] animate-[tv-bob_5s_ease-in-out_infinite] [.no-motion_&]:animate-none [[data-theme=light]_&]:[background:rgba(16,19,24,0.9)] max-[980px]:left-0">
            <i className="h-1.5 w-1.5 rounded-full bg-ok animate-[lv4-blink_1.6s_infinite]" />
            Recorrido activo
          </div>
          <div className="absolute bottom-[16%] right-[-4%] z-[3] inline-flex items-center gap-2 border border-solid border-line-2 border-l-[3px] border-l-accent px-3 py-2 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#f2f4f8] [animation-delay:-2.5s] [background:rgba(0,0,0,0.82)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_7px),calc(100%_-_7px)_100%,0_100%)] animate-[tv-bob_5s_ease-in-out_infinite] [.no-motion_&]:animate-none [[data-theme=light]_&]:[background:rgba(16,19,24,0.9)] max-[980px]:right-0">
            7 paradas · 1 comunidad
          </div>
        </div>
      </div>
      <button
        onClick={() => tvGoTo("tv-cp1")}
        aria-label="Empezar el recorrido"
        className="absolute bottom-[-2px] left-1/2 z-[4] inline-flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-txt-muted transition-colors duration-[140ms] hover:text-txt max-[820px]:left-[18px] max-[820px]:translate-x-0 max-[820px]:items-start"
      >
        <span>Baja para empezar</span>
        <i
          aria-hidden="true"
          className="relative block h-[120px] w-[3px] shadow-[0_0_18px_rgba(255,92,10,0.65)] [background:linear-gradient(rgba(255,92,10,0),var(--accent)_55%,var(--accent))] before:absolute before:bottom-[-3px] before:left-1/2 before:h-[30px] before:w-[30px] before:-translate-x-1/2 before:rounded-full before:blur-[2px] before:content-[''] before:[background:radial-gradient(circle,rgba(255,92,10,0.6),transparent_70%)] after:absolute after:left-[-1.5px] after:top-0 after:h-4 after:w-1.5 after:rounded-[3px] after:bg-white after:shadow-[0_0_14px_var(--accent)] after:content-[''] after:animate-[tv-drop_1.9s_ease-in-out_infinite] [.no-motion_&]:after:animate-none"
        />
      </button>
    </section>
  )
}

/* ---------- one checkpoint ---------- */
function TvCP({
  id,
  n,
  side,
  kick,
  title,
  lead,
  children,
}: {
  id: string
  n: string
  side: "l" | "r"
  kick: React.ReactNode
  title: string
  lead?: string
  children: React.ReactNode
}) {
  return (
    <article
      id={id}
      className={cn(
        "tv-cp group relative grid grid-cols-2 items-center gap-x-[120px] gap-y-[30px] py-[56px]",
        "max-[820px]:grid-cols-1 max-[820px]:gap-[22px] max-[820px]:py-[46px] max-[820px]:pl-[44px]",
        /* horizontal branch wiring the body to the spine; lights up on approach */
        "after:absolute after:top-1/2 after:z-[2] after:h-[2px] after:w-[78px] after:-translate-y-1/2 after:opacity-45 after:transition-[opacity,background] after:duration-[260ms] after:content-[''] [&.near]:after:opacity-100 max-[820px]:after:hidden",
        side === "l"
          ? "after:left-1/2 after:[background:linear-gradient(90deg,var(--line-2),transparent)] [&.near]:after:[background:linear-gradient(90deg,rgba(var(--zr),var(--zg),var(--zb),0.9),transparent)]"
          : "after:right-1/2 after:[background:linear-gradient(270deg,var(--line-2),transparent)] [&.near]:after:[background:linear-gradient(270deg,rgba(var(--zr),var(--zg),var(--zb),0.9),transparent)]",
      )}
    >
      <span
        className="tv-node absolute left-1/2 top-1/2 z-[5] grid h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 place-items-center max-[820px]:left-[18px] max-[820px]:top-10"
        aria-hidden="true"
      >
        <i className="h-3.5 w-3.5 rounded-full border-2 border-solid border-line-2 bg-base transition-[border-color,background,box-shadow] duration-[260ms] group-[.past]:border-[rgba(var(--zr),var(--zg),var(--zb),1)] group-[.past]:bg-[rgba(var(--zr),var(--zg),var(--zb),1)] group-[.past]:shadow-[0_0_0_5px_rgba(var(--zr),var(--zg),var(--zb),0.15),0_0_20px_rgba(var(--zr),var(--zg),var(--zb),0.7)]" />
      </span>
      <div
        data-reveal={side === "l" ? "left" : "right"}
        className={cn(
          "flex items-start gap-[18px] max-[820px]:col-start-1 max-[820px]:row-start-1",
          side === "l" ? "col-start-1 row-start-1" : "col-start-2 row-start-1",
        )}
      >
        <span className="flex-none font-display font-extrabold italic leading-[0.8] text-transparent [-webkit-text-stroke:1.5px_var(--line-2)] [font-size:clamp(40px,5vw,72px)] [transition:-webkit-text-stroke-color_260ms_cubic-bezier(0.2,0.7,0.3,1)] group-[.near]:[-webkit-text-stroke-color:rgba(var(--zr),var(--zg),var(--zb),0.85)]">
          {n}
        </span>
        <div>
          <span className="inline-flex items-center gap-[9px] font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-colors duration-[260ms] ease-linear before:h-[2px] before:w-5 before:bg-current before:content-['']">
            {kick}
          </span>
          <h3
            className="mb-2.5 mt-3 font-display font-extrabold italic uppercase leading-[0.98] tracking-[-0.005em] text-txt [font-size:clamp(30px,3.4vw,46px)] [&_em]:italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.5px_rgba(var(--zr),var(--zg),var(--zb),1)]"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          {lead && (
            <p className="max-w-[42ch] font-body text-[15.5px] font-normal leading-[1.62] text-txt-muted [text-wrap:pretty]">{lead}</p>
          )}
        </div>
      </div>
      <div
        data-reveal={side === "l" ? "right" : "left"}
        className={cn(
          "max-[820px]:col-start-1 max-[820px]:row-start-2",
          side === "l" ? "col-start-2 row-start-1" : "col-start-1 row-start-1",
        )}
      >
        {children}
      </div>
    </article>
  )
}

const CTA_ROW = "mt-[22px] flex flex-wrap items-center gap-3.5"
const CTA_MONO = "font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim"

/* ================================ LANDING ==================================== */
export function LandingPage() {
  const lvl = 3
  const density = 90
  const rootRef = React.useRef<HTMLElement>(null)
  const [stop, setStop] = React.useState(0)

  useReveal([])
  useSignalFX(rootRef, lvl)
  useTvParallax(rootRef)
  useJourney(rootRef, setStop)

  return (
    <main
      ref={rootRef}
      className="tv-landing [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:cursor-none [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:[&_:is(a,button,input)]:cursor-none [.no-motion_&]:cursor-auto [.no-motion_&_:is(a,button,input)]:cursor-auto"
      style={{ ["--zr"]: 255, ["--zg"]: 92, ["--zb"]: 10, ["--jp"]: "0%", ["--pulse"]: "0px" } as React.CSSProperties}
    >
      <FxProgress />
      {/* continuous sky: fixed lighting that mutates color with scroll */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <i className="absolute left-[-16vw] top-[-12vw] h-[74vw] w-[74vw] rounded-full blur-[120px] transition-[background] duration-[260ms] ease-linear will-change-[background] [background:radial-gradient(circle,rgba(var(--zr),var(--zg),var(--zb),0.17),transparent_66%)] [[data-theme=light]_&]:opacity-70" />
        <i className="absolute bottom-[-14vw] right-[-16vw] h-[64vw] w-[64vw] rounded-full blur-[120px] transition-[background] duration-[260ms] ease-linear will-change-[background] [background:radial-gradient(circle,rgba(var(--zr),var(--zg),var(--zb),0.12),transparent_66%)] [[data-theme=light]_&]:opacity-55" />
        <i className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--stripe)_1px,transparent_1px),linear-gradient(90deg,var(--stripe)_1px,transparent_1px)] [background-size:68px_68px] [mask-image:radial-gradient(120%_100%_at_50%_30%,#000_30%,transparent_80%)] [-webkit-mask-image:radial-gradient(120%_100%_at_50%_30%,#000_30%,transparent_80%)]" />
      </div>

      <TvMinimap active={stop} />

      {/* clip content horizontally so the fixed sky isn't clipped */}
      <div className="overflow-x-clip">
        <TvHero lvl={lvl} density={density} />

      <div className="relative z-[1]">
        <Marquee items={["BoffMedia", "Pixelmon Wingull 2", "SmartRotom", "BattleSim", "Torneos", "Sorteos", "Comunidad"]} speed={30} />
      </div>

      {/* ============ THE JOURNEY ============ */}
      <section
        className={cn(
          "tv-route relative z-[1]",
          /* central spine, zone-tinted at both ends */
          "before:absolute before:bottom-0 before:left-1/2 before:top-0 before:z-[1] before:w-[2px] before:-translate-x-1/2 before:content-[''] before:[background:linear-gradient(180deg,rgba(var(--zr),var(--zg),var(--zb),0.95),var(--line-2)_4%,var(--line-2)_97%,rgba(var(--zr),var(--zg),var(--zb),0.95))] max-[820px]:before:left-[18px]",
          /* route → meta light pool centred on the finish star */
          "after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:z-0 after:h-[420px] after:w-[min(860px,96vw)] after:-translate-x-1/2 after:translate-y-1/2 after:content-[''] after:[background:radial-gradient(50%_50%_at_50%_50%,rgba(var(--zr),var(--zg),var(--zb),0.12),transparent_70%)] [[data-theme=light]_&]:after:opacity-60",
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-[2] w-[2px] -translate-x-1/2 opacity-50 [background-size:2px_36px] [background:repeating-linear-gradient(180deg,rgba(var(--zr),var(--zg),var(--zb),0)_0_14px,rgba(var(--zr),var(--zg),var(--zb),0.55)_14px_22px)] [mask-image:linear-gradient(180deg,transparent,#000_5%,#000_95%,transparent)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_5%,#000_95%,transparent)] animate-[tv-flow_1.5s_linear_infinite] [.no-motion_&]:animate-none max-[820px]:left-[18px]"
        />
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 z-[3] w-[2px] -translate-x-1/2 shadow-[0_0_16px_rgba(var(--zr),var(--zg),var(--zb),0.5)] [background:linear-gradient(180deg,rgba(var(--zr),var(--zg),var(--zb),0.15),rgba(var(--zr),var(--zg),var(--zb),1))] [height:var(--pulse)] max-[820px]:left-[18px]"
        />
        <span
          aria-hidden="true"
          className="absolute left-1/2 z-[4] -translate-x-1/2 -translate-y-1/2 [top:var(--pulse)] before:absolute before:left-1/2 before:top-1/2 before:h-10 before:w-10 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border before:border-solid before:border-[rgba(var(--zr),var(--zg),var(--zb),0.5)] before:content-[''] before:animate-[tv-ping_2.4s_ease-out_infinite] [.no-motion_&]:before:animate-none max-[820px]:left-[18px]"
        >
          <i className="block h-3 w-3 rounded-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_5px_rgba(var(--zr),var(--zg),var(--zb),0.16),0_0_22px_4px_rgba(var(--zr),var(--zg),var(--zb),0.8)]" />
        </span>
        <div className="relative z-[3] mx-auto max-w-[1280px] px-5 min-[640px]:px-10">
          {/* CP01 · HERRAMIENTAS */}
          <TvCP
            id="tv-cp1"
            n="01"
            side="l"
            kick={<Decode text="Parada 01 · Tu equipo" />}
            title="Caja de <em>herramientas</em>"
            lead="Calculadoras, simuladores y trackers hechos por y para la comunidad. Afina antes de cada combate."
          >
            <div className="overflow-hidden border border-solid border-line backdrop-blur-[6px] [background:rgba(10,12,16,0.5)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_12px),calc(100%_-_12px)_100%,0_100%)] [[data-theme=light]_&]:[background:rgba(255,255,255,0.55)]">
              <div className="flex items-center gap-2.5 border-b border-solid border-line bg-base-deep px-3.5 py-[11px]" aria-hidden="true">
                <span className="flex gap-[5px]">
                  <i className="h-[9px] w-[9px] rounded-full bg-line-2" />
                  <i className="h-[9px] w-[9px] rounded-full bg-line-2" />
                  <i className="h-[9px] w-[9px] rounded-full bg-line-2" />
                </span>
                <b className="font-mono text-[12px] font-semibold leading-none tracking-[0.05em] text-[#9aa3b2]">toolkit.boff</b>
                <span className="ml-auto inline-flex items-center gap-[7px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-colors duration-[260ms] ease-linear">
                  <i className="h-1.5 w-1.5 rounded-full bg-current animate-[lv4-blink_1.6s_infinite]" />6 módulos activos
                </span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-px bg-line max-[520px]:grid-cols-1">
                {TV3_TOOLS.map((t) => (
                  <Link
                    href={t.href}
                    key={t.ix}
                    data-glare
                    data-tilt-fx
                    className={cn(
                      "group/mod relative flex items-start gap-3.5 overflow-hidden bg-panel px-4 pb-[18px] pt-4 no-underline transition-[background] duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-panel-2",
                      GLARE,
                    )}
                  >
                    <span className="grid h-[42px] w-[42px] flex-none place-items-center border border-solid border-line-2 bg-[rgba(var(--zr),var(--zg),var(--zb),0.08)] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-[background,box-shadow] duration-[260ms] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_8px),calc(100%_-_8px)_100%,0_100%)] group-hover/mod:bg-[rgba(var(--zr),var(--zg),var(--zb),0.16)] group-hover/mod:shadow-[0_0_20px_rgba(var(--zr),var(--zg),var(--zb),0.3)]">
                      <Icon name={t.ic} size={20} />
                    </span>
                    <span className="flex min-w-0 flex-col gap-[5px]">
                      <span className="flex items-baseline gap-2">
                        <i className="font-mono text-[11px] font-bold not-italic leading-none text-[rgba(var(--zr),var(--zg),var(--zb),1)]">
                          {t.ix}
                        </i>
                        <b className="font-display text-[16px] font-bold uppercase leading-none tracking-[0.01em] text-txt">{t.n}</b>
                      </span>
                      <small className="font-body text-[12px] font-normal leading-[1.4] text-txt-muted">{t.d}</small>
                    </span>
                    <span className="absolute right-3.5 top-4 -translate-x-1 text-txt-muted opacity-0 transition-[opacity,transform,color] duration-[140ms] group-hover/mod:translate-x-0 group-hover/mod:opacity-100 group-hover/mod:text-[rgba(var(--zr),var(--zg),var(--zb),1)]">
                      <Icon name="arrow" size={15} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className={CTA_ROW}>
              <Button variant="pri" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
                Abrir la caja
              </Button>
              <span className={CTA_MONO}>32 utilidades activas</span>
            </div>
          </TvCP>

          {/* CP02 · SMARTROTOM */}
          <TvCP
            id="tv-cp2"
            n="02"
            side="r"
            kick={<Decode text="Parada 02 · Producto destacado" />}
            title="Smart<em>Rotom</em>"
            lead="Tu smartphone del juego, también en el navegador. Pokédex, mapas, economía y mensajes sincronizados en vivo con tu partida."
          >
            <div className="relative grid justify-items-start gap-[22px] max-[980px]:justify-items-center max-[980px]:text-center">
              <video
                data-tilt-fx
                autoPlay
                muted
                loop
                playsInline
                poster="/img/smartrotom.png"
                aria-label="Demo de SmartRotom"
                className="relative z-[2] aspect-square w-full max-w-[540px] object-cover"
              >
                <source src="/img/rotom_demo3.webm" type="video/webm" />
              </video>
              <div className="relative z-[2] flex flex-wrap gap-x-[18px] gap-y-2.5 max-[980px]:justify-center">
                {TV3_FEATS.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-[9px] font-body text-[13.5px] font-medium leading-[1.3] text-txt max-[980px]:justify-center"
                  >
                    <i
                      className="h-2 w-2 flex-none rotate-45 bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_10px_rgba(var(--zr),var(--zg),var(--zb),0.6)] transition-[background] duration-[260ms] ease-linear"
                      aria-hidden="true"
                    />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className={CTA_ROW}>
              <Button variant="pri" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
                Ver SmartRotom
              </Button>
              <Button icon="bell">Avisadme</Button>
            </div>
          </TvCP>

          {/* CP03 · TORNEOS */}
          <TvCP
            id="tv-cp3"
            n="03"
            side="l"
            kick={<Decode text="Parada 03 · Competición" />}
            title="Torneos cada <em>semana</em>"
            lead="Brackets en directo, ranking por temporada y una gran final regional con 96 plazas. La gloria se gana en el servidor."
          >
            <div
              data-glare
              className={cn(
                "relative overflow-hidden border border-solid border-line-2 bg-base-deep text-[#f2f4f8] [clip-path:polygon(0_0,calc(100%_-_14px)_0,100%_14px,100%_100%,0_100%)]",
                GLARE,
                HUD_FRAME,
              )}
            >
              <div className="flex items-center justify-between gap-3.5 border-b border-solid border-line px-[18px] py-3.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[#9aa3b2]">
                <span className="inline-flex items-center gap-[7px] text-[#ff4d5e]">
                  <i className="h-1.5 w-1.5 rounded-full bg-[#ff4d5e] animate-[lv4-blink_1.3s_infinite]" />
                  Gran final · Bo3
                </span>
                <span>{TV3_EVENT.title}</span>
              </div>
              <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-[30px] max-[520px]:grid-cols-1 max-[520px]:gap-5">
                <div className="grid justify-items-center gap-1.5 text-center">
                  <span className="grid h-[50px] w-[50px] place-items-center bg-accent font-display text-[22px] font-extrabold not-italic leading-none text-accent-ink shadow-[0_0_22px_rgba(255,92,10,0.45)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_10px),calc(100%_-_10px)_100%,0_100%)]">
                    V
                  </span>
                  <b className="font-display text-[16px] font-bold uppercase leading-none">Equipo Volt</b>
                  <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#5f6774]">Semilla #1</small>
                </div>
                <div className="grid justify-items-center gap-1.5">
                  <span className="font-display text-[44px] font-extrabold leading-none tabular-nums [text-shadow:0_0_26px_rgba(255,92,10,0.35)]">
                    <b className="text-accent">
                      <CountUp value="2" />
                    </b>
                    –<CountUp value="1" />
                  </span>
                  <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#9aa3b2]">Mapa 4 · En juego</small>
                </div>
                <div className="grid justify-items-center gap-1.5 text-center">
                  <span className="grid h-[50px] w-[50px] place-items-center bg-signal font-display text-[22px] font-extrabold not-italic leading-none text-accent-ink shadow-[0_0_22px_rgba(77,163,255,0.45)] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_10px),calc(100%_-_10px)_100%,0_100%)]">
                    A
                  </span>
                  <b className="font-display text-[16px] font-bold uppercase leading-none">Equipo Aqua</b>
                  <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#5f6774]">Semilla #2</small>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line px-5 py-4">
                <span className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#5f6774]">
                  Próxima emisión · {TV3_EVENT.date}
                </span>
                <TvCountdown compact />
              </div>
            </div>
            <div className={CTA_ROW}>
              <Button variant="pri" iconRight="arrow" href="/eventos" className={PRI_GLOW}>
                Inscribirme
              </Button>
              <Button href="/clasificacion">Ver ranking</Button>
            </div>
          </TvCP>

          {/* CP04 · JUEGOS */}
          <TvCP
            id="tv-cp4"
            n="04"
            side="r"
            kick={<Decode text="Parada 04 · Servidores" />}
            title="Elige tu <em>partida</em>"
            lead="Tres mundos, una misma comunidad. Tu próxima aventura empieza en una de estas paradas."
          >
            <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              {TV3_GAMES.map((g, i) => (
                <Link
                  key={g.n}
                  href="/juegos"
                  data-glare
                  className={cn(
                    "group/game relative flex cursor-pointer flex-col overflow-hidden border border-solid border-line bg-panel transition-[border-color,transform,box-shadow] duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--zr),var(--zg),var(--zb),0.6)] hover:shadow-[0_22px_44px_rgba(0,0,0,0.42)]",
                    /* zone-colored energy sweep confirming arrival */
                    "after:absolute after:left-0 after:top-0 after:z-[4] after:h-[3px] after:w-0 after:bg-[rgba(var(--zr),var(--zg),var(--zb),1)] after:shadow-[0_0_12px_rgba(var(--zr),var(--zg),var(--zb),0.6)] after:transition-[width] after:duration-[600ms] after:ease-[cubic-bezier(0.16,1,0.3,1)] after:content-[''] hover:after:w-full",
                    GLARE,
                    i === 0 && "col-span-full",
                  )}
                >
                  <div className={cn("relative overflow-hidden bg-base-2", i === 0 ? "aspect-[16/7] max-[520px]:aspect-[16/9]" : "aspect-[4/3]")}>
                    {g.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.img}
                        alt={g.n}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/game:scale-[1.06]"
                      />
                    ) : (
                      <div className="relative grid h-full w-full min-h-[120px] place-items-center outline-1 outline-dashed outline-line-2 [outline-offset:-6px] [background:repeating-linear-gradient(-45deg,var(--stripe)_0_10px,transparent_10px_20px)]">
                        <span className="px-3.5 text-center font-mono text-[12px]/[1.5] font-medium text-txt-muted">{g.ph}</span>
                      </div>
                    )}
                    <span
                      className="absolute inset-0 [background:linear-gradient(to_top,rgba(5,7,10,0.94)_2%,rgba(5,7,10,0.25)_46%,transparent_72%)]"
                      aria-hidden="true"
                    />
                    <span
                      className="absolute right-2.5 top-2 z-[2] font-display text-[24px] font-extrabold italic leading-[0.8] text-transparent [-webkit-text-stroke:1.4px_rgba(255,255,255,0.5)]"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="absolute bottom-[13px] left-[15px] right-[15px] z-[2]">
                      <span className="mb-[9px] inline-block bg-[rgba(var(--zr),var(--zg),var(--zb),0.92)] px-[9px] py-[5px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.1em] text-white transition-[background] duration-[260ms] ease-linear">
                        {g.tag}
                      </span>
                      <h4 className="font-display font-extrabold italic uppercase leading-[0.94] tracking-[0.02em] text-white [font-size:clamp(20px,2.3vw,30px)] [text-shadow:0_2px_22px_rgba(0,0,0,0.6)]">
                        {g.n}
                      </h4>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
                    <p className="font-body text-[13px] font-normal leading-[1.5] text-txt-muted">{g.d}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-[color,gap] duration-[140ms] group-hover/game:gap-2.5 group-hover/game:text-[rgba(var(--zr),var(--zg),var(--zb),1)]">
                      Entrar al mundo <Icon name="arrow" size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </TvCP>

          {/* CP05 · COMUNIDAD */}
          <TvCP
            id="tv-cp5"
            n="05"
            side="l"
            kick={<Decode text="Parada 05 · Más que un servidor" />}
            title="Una comunidad <em>viva</em>"
            lead="Equipos, clanes, sorteos y eventos especiales. 412 jugadores ya compiten esta temporada; solo falta tu nombre en el ranking."
          >
            <div
              data-glare
              className={cn(
                "relative overflow-hidden border border-solid border-line px-6 pb-6 pt-[22px] backdrop-blur-[6px] [background:rgba(10,12,16,0.5)] [clip-path:polygon(0_0,100%_0,100%_100%,16px_100%,0_calc(100%_-_16px))] [[data-theme=light]_&]:[background:rgba(255,255,255,0.55)]",
                GLARE,
                HUD_FRAME,
              )}
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-solid border-line pb-4">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.1em] text-ok">
                  <i className="h-[7px] w-[7px] rounded-full bg-ok shadow-[0_0_8px_var(--ok)] animate-[lv4-blink_1.6s_infinite]" aria-hidden="true" />
                  En línea ahora
                </span>
                <b className="font-display text-[30px] font-extrabold italic leading-none text-txt tabular-nums">
                  <CountUp value="128" />
                </b>
              </div>
              <div className="my-[18px] flex" aria-hidden="true">
                {["AX", "NV", "K7", "ZN", "ML"].map((a) => (
                  <i
                    key={a}
                    className="-ml-2.5 grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-solid border-panel bg-panel-2 font-mono text-[12px] font-bold not-italic leading-none text-txt-muted first:ml-0"
                  >
                    {a}
                  </i>
                ))}
                <i className="-ml-2.5 grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-solid border-panel bg-accent font-mono text-[12px] font-bold not-italic leading-none text-accent-ink">
                  +123
                </i>
              </div>
              <div className="mb-[18px] grid gap-2" aria-hidden="true">
                {TV3_FEED.map((f, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex items-center gap-2.5 border-l-2 border-solid bg-panel px-3 py-[9px] font-body text-[13px] font-medium leading-[1.3] text-txt",
                      f.ln,
                    )}
                    style={{ ["--i"]: i } as React.CSSProperties}
                  >
                    <i className={cn("h-[7px] w-[7px] flex-none rounded-full animate-[lv4-blink_2s_infinite]", f.tp)} />
                    {f.t}
                  </span>
                ))}
              </div>
              <div className="mb-[18px] flex flex-wrap gap-2">
                <Chip>Foro 24/7</Chip>
                <Chip>Sorteos semanales</Chip>
                <Chip>Equipos y clanes</Chip>
              </div>
              <div className={CTA_ROW}>
                <Button variant="pri" iconRight="arrow" href="/comunidad" className={PRI_GLOW}>
                  Unirme
                </Button>
                <Button href={DISCORD}>Discord</Button>
              </div>
            </div>
          </TvCP>
        </div>
      </section>

      {/* ============ META · FINAL CTA ============ */}
      <section className="relative z-[1] overflow-hidden pb-[150px] pt-32 text-center" id="tv-meta">
        {lvl >= 2 && (
          <FxParticles
            density={Math.round(density * 0.6)}
            className="[mask-image:linear-gradient(180deg,transparent,#000_300px)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_300px)]"
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_300px)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_300px)]"
          aria-hidden="true"
        >
          {/* finish star: the single terminal where the spine ends */}
          <i className="absolute left-1/2 top-0 h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_9px_rgba(var(--zr),var(--zg),var(--zb),0.12),0_0_0_18px_rgba(var(--zr),var(--zg),var(--zb),0.06),0_0_56px_16px_rgba(var(--zr),var(--zg),var(--zb),0.75)] before:absolute before:left-1/2 before:top-full before:h-[118px] before:w-[2px] before:-translate-x-1/2 before:content-[''] before:[background:linear-gradient(rgba(var(--zr),var(--zg),var(--zb),1),transparent)] after:absolute after:left-1/2 after:top-1/2 after:h-[46px] after:w-[46px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border after:border-solid after:border-[rgba(var(--zr),var(--zg),var(--zb),0.55)] after:content-[''] after:animate-[tv-ping_2.6s_ease-out_infinite] [.no-motion_&]:after:animate-none max-[820px]:left-[18px]" />
          <i className={cn(BEAMS, "left-[calc(50%_-_550px)] top-[calc(50%_-_640px)] h-[1100px] w-[1100px] opacity-70")} />
          <Grain />
        </div>
        <div className="relative z-[2] mx-auto max-w-[1280px] px-5 min-[640px]:px-10">
          <span
            data-reveal
            className="inline-flex items-center gap-[9px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.16em] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-colors duration-[260ms] ease-linear"
          >
            <i className="h-[7px] w-[7px] rounded-full bg-current shadow-[0_0_10px_currentColor]" aria-hidden="true" />
            Fin del recorrido · Principio de todo
          </span>
          <h2
            data-reveal
            style={{ ["--i"]: 1 } as React.CSSProperties}
            className="mb-4 mt-[22px] font-display font-extrabold italic uppercase leading-[0.88] tracking-[-0.005em] text-txt [font-size:clamp(58px,8vw,132px)]"
          >
            Únete a la{" "}
            <em className="italic text-transparent [-webkit-text-stroke:2px_rgba(var(--zr),var(--zg),var(--zb),1)] [text-shadow:0_0_44px_rgba(var(--zr),var(--zg),var(--zb),0.4)] [[data-theme=light]_&]:[text-shadow:0_0_28px_rgba(var(--zr),var(--zg),var(--zb),0.22)]">
              comunidad
            </em>
          </h2>
          <p
            data-reveal
            style={{ ["--i"]: 2 } as React.CSSProperties}
            className="mx-auto max-w-[52ch] font-body text-[17px] font-normal leading-[1.6] text-txt-muted"
          >
            Crea tu cuenta, entra al Discord y empieza tu propio recorrido junto a la comunidad Pixelmon.
          </p>
          <div data-reveal style={{ ["--i"]: 3 } as React.CSSProperties} className="mt-[34px] flex flex-wrap justify-center gap-3.5">
            <Button variant="pri" size="lg" iconRight="arrow" href="/comunidad" className={PRI_GLOW}>
              Crear cuenta gratis
            </Button>
            <Button size="lg" href={DISCORD}>
              Entrar al Discord
            </Button>
          </div>
        </div>
      </section>
      </div>

      {lvl >= 3 && <FxCursor scope="main" />}
    </main>
  )
}
