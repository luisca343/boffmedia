"use client"

import * as React from "react"
import { TV3_STOPS, TV3_ZONES } from "./landing-data"

/* Mouse parallax — exposes smoothed --mx/--my on the element. */
export function useTvMouseVar(ref: React.RefObject<HTMLElement | null>) {
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

/* Scroll parallax for [data-pglow] glows. */
export function useTvParallax(rootRef: React.RefObject<HTMLElement | null>) {
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

/* Scroll progress → sky color, spine pulse, active stop. */
export function useJourney(rootRef: React.RefObject<HTMLElement | null>, setStop: (n: number) => void) {
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
