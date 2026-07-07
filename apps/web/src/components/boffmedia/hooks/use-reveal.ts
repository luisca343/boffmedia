"use client"

import * as React from "react"

export function useReveal(deps: React.DependencyList = []) {
  React.useEffect(() => {
    const check = () => {
      const vH = window.innerHeight || document.documentElement.clientHeight
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < vH * 0.92 && r.bottom > 0) el.classList.add("in")
      })
    }
    check()
    let ticks = 0
    const poll = window.setInterval(() => {
      check()
      if (++ticks > 25) window.clearInterval(poll)
    }, 120)
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    const all = window.setTimeout(() => document.documentElement.classList.add("reveal-all"), 2800)
    return () => {
      window.clearInterval(poll)
      window.clearTimeout(all)
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
