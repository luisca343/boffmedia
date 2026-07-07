"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const fxReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.classList.contains("no-motion")

/* ---- scroll progress bar --------------------------------------------------- */
export function FxProgress() {
  const ref = React.useRef<HTMLElement>(null)
  React.useEffect(() => {
    let raf = 0
    let pend = false
    const on = () => {
      if (pend) return
      pend = true
      raf = requestAnimationFrame(() => {
        pend = false
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / max)) : 0
        if (ref.current) ref.current.style.transform = `scaleX(${p.toFixed(4)})`
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
  }, [])
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[640] h-[3px]" aria-hidden="true">
      <i
        ref={ref}
        className="block h-full origin-[0_50%] scale-x-0 shadow-[0_0_12px_rgba(255,92,10,0.5)] [background:linear-gradient(90deg,var(--accent),var(--accent-bright))]"
      />
    </div>
  )
}

/* ---- scanlines + orange sweep ---------------------------------------------- */
export function Scan({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-[2] overflow-hidden",
        "[background:repeating-linear-gradient(0deg,rgba(255,255,255,0.028)_0_1px,transparent_1px_3px)]",
        "[[data-theme=light]_&]:[background:repeating-linear-gradient(0deg,rgba(20,23,28,0.03)_0_1px,transparent_1px_3px)]",
        "after:absolute after:left-0 after:right-0 after:top-[-25%] after:h-[90px] after:content-['']",
        "after:[background:linear-gradient(180deg,transparent,rgba(255,92,10,0.10)_45%,rgba(255,255,255,0.05)_50%,transparent)]",
        "after:animate-[bm-scan_4.6s_cubic-bezier(0.4,0,0.6,1)_infinite]",
        "[.no-motion_&]:after:animate-none [.no-motion_&]:after:opacity-0",
        className,
      )}
    />
  )
}

/* ---- «tuning» decode text -------------------------------------------------- */
const SN_DECODE_CHARS = "▖▘▝▗0123456789/\\|<>#"
export function Decode({ text, dur = 900, className }: { text: string; dur?: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (fxReduced()) {
      el.textContent = text
      return
    }
    let raf = 0
    let started = false
    const run = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        const n = Math.floor(p * text.length)
        let out = text.slice(0, n)
        for (let i = n; i < text.length; i++) {
          const ch = text[i]
          out += ch === " " ? " " : SN_DECODE_CHARS[(Math.random() * SN_DECODE_CHARS.length) | 0]
        }
        el.textContent = out
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const off = () => {
      window.removeEventListener("scroll", check)
      window.clearInterval(poll)
    }
    const check = () => {
      if (started) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 800
      if (r.top < vh * 0.96 && r.bottom > 0) {
        started = true
        off()
        run()
      }
    }
    const poll = window.setInterval(check, 150)
    const failsafe = window.setTimeout(() => {
      if (!started) {
        started = true
        off()
        el.textContent = text
      }
    }, 5000)
    window.addEventListener("scroll", check, { passive: true })
    check()
    return () => {
      off()
      window.clearTimeout(failsafe)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [text, dur])
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
}

/* ---- pixel particle field (canvas fills its parent) ------------------------ */
export function FxParticles({ density = 90, className }: { density?: number; className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const cv = ref.current
    if (!cv || !cv.parentElement) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || density <= 0) return
    const host = cv.parentElement
    const ctx = cv.getContext("2d")
    if (!ctx) return
    let W = 0
    let H = 0
    let dpr = 1
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = host.offsetWidth
      H = host.offsetHeight
      cv.width = W * dpr
      cv.height = H * dpr
    }
    size()
    const pts: { x: number; y: number; z: number; tw: number; sp: number; warm: boolean }[] = []
    for (let i = 0; i < Math.round(density); i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: 0.25 + Math.random() * 0.75,
        tw: Math.random() * Math.PI * 2,
        sp: 0.06 + Math.random() * 0.16,
        warm: Math.random() < 0.3,
      })
    }
    let pmx = 0
    let pmy = 0
    let smx = 0
    let smy = 0
    const fine = window.matchMedia("(pointer: fine)").matches
    const onP = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      pmx = (e.clientX - r.left) / r.width - 0.5
      pmy = (e.clientY - r.top) / r.height - 0.5
    }
    if (fine) host.addEventListener("pointermove", onP, { passive: true })
    let run = false
    let raf = 0
    let t = Math.random() * 100
    let visible = true
    const noM = () => document.documentElement.classList.contains("no-motion")
    const draw = () => {
      if (!visible || noM()) {
        run = false
        if (noM()) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.clearRect(0, 0, W, H)
        }
        return
      }
      t += 0.016
      smx += (pmx - smx) * 0.04
      smy += (pmy - smy) * 0.04
      const light = document.documentElement.getAttribute("data-theme") === "light"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < pts.length; i++) {
        const s = pts[i]
        s.y -= s.sp * s.z
        if (s.y < -6) {
          s.y = H + 6
          s.x = Math.random() * W
        }
        const a = ((0.14 + 0.5 * Math.abs(Math.sin(t * 1.1 + s.tw))) * s.z * (light ? 0.55 : 1)).toFixed(3)
        const x = s.x + smx * 26 * s.z
        const y = s.y + smy * 18 * s.z
        const sz = 1 + s.z * 1.8
        ctx.fillStyle = s.warm
          ? light
            ? `rgba(240,78,0,${a})`
            : `rgba(255,122,51,${a})`
          : light
            ? `rgba(20,23,28,${a})`
            : `rgba(238,240,248,${a})`
        ctx.fillRect(x, y, sz, sz)
      }
      raf = requestAnimationFrame(draw)
    }
    const kick = () => {
      if (!run && visible) {
        run = true
        raf = requestAnimationFrame(draw)
      }
    }
    const vio = new IntersectionObserver((es) => {
      es.forEach((e2) => {
        visible = e2.isIntersecting
        if (visible) kick()
      })
    })
    vio.observe(host)
    const reKick = () => kick()
    window.addEventListener("scroll", reKick, { passive: true })
    window.addEventListener("resize", size, { passive: true })
    kick()
    return () => {
      vio.disconnect()
      if (raf) cancelAnimationFrame(raf)
      if (fine) host.removeEventListener("pointermove", onP)
      window.removeEventListener("scroll", reKick)
      window.removeEventListener("resize", size)
    }
  }, [density])
  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-0 h-full w-full", className)} />
}

/* ---- reticle cursor -------------------------------------------------------- */
export function FxCursor({
  scope = "main",
  hot = "a,button,[data-btn],[data-glare]",
}: {
  scope?: string
  hot?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const cur = ref.current
    if (!cur) return
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) return
    const dot = cur.querySelector<HTMLElement>(".d")
    const ring = cur.querySelector<HTMLElement>(".r")
    let cx = -100
    let cy = -100
    let rx = -100
    let ry = -100
    let run = false
    let raf = 0
    const tick = () => {
      rx += (cx - rx) * 0.16
      ry += (cy - ry) * 0.16
      if (dot) dot.style.transform = `translate(${cx}px,${cy}px)`
      if (ring) ring.style.transform = `translate(${rx.toFixed(1)}px,${ry.toFixed(1)}px)`
      if (Math.abs(cx - rx) > 0.25 || Math.abs(cy - ry) > 0.25) raf = requestAnimationFrame(tick)
      else run = false
    }
    const kick = () => {
      if (!run) {
        run = true
        raf = requestAnimationFrame(tick)
      }
    }
    const onMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null
      const inside = target && target.closest(scope)
      if (!inside || document.documentElement.classList.contains("no-motion")) {
        cur.classList.remove("on")
        return
      }
      cur.classList.add("on")
      cur.classList.toggle("hot", !!target.closest(hot))
      cx = e.clientX
      cy = e.clientY
      kick()
    }
    const onLeave = () => cur.classList.remove("on")
    document.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    return () => {
      document.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [scope, hot])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-[9999] opacity-0 transition-opacity duration-[160ms] [&.on]:opacity-100",
        "[&.hot_.r]:after:scale-[1.4] [&.hot_.r]:after:border-accent [&.hot_.r]:after:bg-accent-soft",
      )}
    >
      <i className="d absolute left-0 top-0 block will-change-transform after:absolute after:left-0 after:top-0 after:-ml-[3.5px] after:-mt-[3.5px] after:h-[7px] after:w-[7px] after:rotate-45 after:bg-accent after:content-['']" />
      <i className="r absolute left-0 top-0 block will-change-transform after:absolute after:left-0 after:top-0 after:-ml-4 after:-mt-4 after:h-8 after:w-8 after:rotate-45 after:border-[1.5px] after:border-solid after:border-accent-line after:transition-[transform,border-color,background] after:duration-[180ms] after:content-['']" />
    </div>
  )
}

/* ---- glare + magnetic buttons + 3D tilt (orchestrated by level) ------------ */
export function useSignalFX(rootRef: React.RefObject<HTMLElement | null>, lvl = 3) {
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine) return
    const noM = () => document.documentElement.classList.contains("no-motion")
    const cleanups: (() => void)[] = []

    if (lvl >= 2) {
      const onGlare = (e: PointerEvent) => {
        const c = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-glare]") : null
        if (!c || !root.contains(c)) return
        const r = c.getBoundingClientRect()
        c.style.setProperty("--gx", `${(e.clientX - r.left).toFixed(1)}px`)
        c.style.setProperty("--gy", `${(e.clientY - r.top).toFixed(1)}px`)
      }
      root.addEventListener("pointermove", onGlare, { passive: true })
      cleanups.push(() => root.removeEventListener("pointermove", onGlare))
    }

    if (lvl >= 3 && !reduce) {
      let mag: HTMLElement | null = null
      const onMag = (e: PointerEvent) => {
        const b = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-btn]") : null
        if (b !== mag && mag) mag.style.transform = ""
        mag = b && root.contains(b) ? b : null
        if (mag && !noM()) {
          const r = mag.getBoundingClientRect()
          const dx = e.clientX - (r.left + r.width / 2)
          const dy = e.clientY - (r.top + r.height / 2)
          mag.style.transform = `translate(${(dx * 0.16).toFixed(1)}px,${(dy * 0.22).toFixed(1)}px)`
        }
      }
      const offMag = () => {
        if (mag) {
          mag.style.transform = ""
          mag = null
        }
      }
      root.addEventListener("pointermove", onMag, { passive: true })
      root.addEventListener("pointerleave", offMag)
      cleanups.push(() => {
        root.removeEventListener("pointermove", onMag)
        root.removeEventListener("pointerleave", offMag)
        offMag()
      })

      let tc: HTMLElement | null = null
      const onTilt = (e: PointerEvent) => {
        const c = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-tilt-fx]") : null
        if (c !== tc && tc) tc.style.transform = ""
        tc = c && root.contains(c) ? c : null
        if (tc && !noM()) {
          const r = tc.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          tc.style.transform = `perspective(900px) rotateY(${(px * 8).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg) translateY(-4px)`
        }
      }
      const offTilt = () => {
        if (tc) {
          tc.style.transform = ""
          tc = null
        }
      }
      root.addEventListener("pointermove", onTilt, { passive: true })
      root.addEventListener("pointerleave", offTilt)
      cleanups.push(() => {
        root.removeEventListener("pointermove", onTilt)
        root.removeEventListener("pointerleave", offTilt)
        offTilt()
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [rootRef, lvl])
}
