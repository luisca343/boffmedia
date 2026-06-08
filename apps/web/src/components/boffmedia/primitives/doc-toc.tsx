"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DocTOCItem {
  id: string
  title: string
}

export interface DocTOCProps {
  items: DocTOCItem[]
  label?: string
}

export function DocTOC({ items, label = "En esta página" }: DocTOCProps) {
  const [active, setActive] = React.useState(items[0]?.id ?? "")

  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(e.target.id.replace("sec-", ""))
          }
        })
      },
      { rootMargin: "-30% 0px -60% 0px" },
    )
    items.forEach((s) => {
      const el = document.getElementById("sec-" + s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [items])

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById("sec-" + id)
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 100,
        behavior: "smooth",
      })
    }
  }

  return (
    <aside className="sticky top-24 max-[1000px]:relative max-[1000px]:top-0">
      <span className="font-mono text-[length:var(--t-xs)] tracking-[0.14em] uppercase text-[color:var(--text-dim)] block mb-4">
        {label}
      </span>
      <nav className="flex flex-col gap-[0.15rem] border-l-2 border-[var(--border)] max-[1000px]:flex-row max-[1000px]:flex-wrap max-[1000px]:border-l-0 max-[1000px]:gap-[0.4rem]">
        {items.map((s, i) => (
          <a
            key={s.id}
            href={"#sec-" + s.id}
            onClick={jump(s.id)}
            className={cn(
              "flex items-baseline gap-2.5 text-[length:var(--t-sm)] py-2 px-3.5 transition-[color,border-color] duration-[var(--dur)] ease-[var(--ease)]",
              "border-l-2 border-transparent -ml-[2px]",
              "max-[1000px]:border-l-0 max-[1000px]:ml-0 max-[1000px]:border max-[1000px]:rounded-[var(--radius-pill)]",
              active === s.id
                ? "text-[color:var(--orange-500)] font-semibold border-l-[color:var(--orange-500)] max-[1000px]:border-[color:var(--orange-500)]"
                : "text-[color:var(--text-muted)] hover:text-[var(--text)] max-[1000px]:border-[var(--border)]",
            )}
          >
            <span className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.title}
          </a>
        ))}
      </nav>
    </aside>
  )
}
