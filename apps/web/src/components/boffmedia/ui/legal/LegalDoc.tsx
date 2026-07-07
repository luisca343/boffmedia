"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"

export interface LegalSection {
  id: string
  title: string
  /** Each entry is a paragraph (string) or a bullet list (string[]). */
  body: (string | string[])[]
}

export interface LegalDocProps {
  kicker: string
  title: string
  lead: string
  updated?: string
  tocLabel?: string
  sections: LegalSection[]
}

export function LegalDoc({ kicker, title, lead, updated, tocLabel = "Contenido", sections }: LegalDocProps) {
  const [active, setActive] = React.useState(sections[0]?.id)

  React.useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-100px 0px -66% 0px" },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [sections])

  return (
    <main data-ds="boffmedia" className="wrap pb-[90px] pt-[34px]">
      <div className="mb-[34px] max-w-[66ch]">
        <span className="mono-label">{kicker}</span>
        <h1 className="mb-4 mt-3 text-[clamp(46px,5.4vw,66px)]">{title}</h1>
        <p className="font-body text-[18px]/[1.65] text-txt-muted text-pretty">{lead}</p>
        {updated && (
          <div className="mt-5 inline-flex items-center gap-2 font-mono text-[11px]/none font-medium uppercase tracking-[0.1em] text-txt-muted">
            <Icon name="clock" size={14} className="text-accent" />
            {updated}
          </div>
        )}
      </div>

      <div className="grid items-start gap-10 [grid-template-columns:236px_1fr] max-[900px]:grid-cols-1 max-[900px]:gap-6">
        {/* sticky TOC */}
        <aside className="sticky top-[92px] max-[900px]:static">
          <span className="mb-3.5 block pl-3.5 font-mono text-[10px]/none font-semibold uppercase tracking-[0.16em] text-txt-dim">
            {tocLabel}
          </span>
          <nav className="grid border-l border-line max-[900px]:auto-cols-max max-[900px]:grid-flow-col max-[900px]:overflow-x-auto max-[900px]:border-l-0 max-[900px]:border-b max-[900px]:border-line">
            {sections.map((s, i) => {
              const on = active === s.id
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "-ml-px flex items-baseline gap-2.5 border-l-2 border-transparent px-3.5 py-2.5 font-body text-[13px]/[1.35] no-underline transition-colors duration-[140ms]",
                    "max-[900px]:ml-0 max-[900px]:whitespace-nowrap max-[900px]:border-l-0 max-[900px]:border-b-2",
                    on ? "border-accent text-txt max-[900px]:border-b-accent" : "text-txt-muted hover:text-txt",
                  )}
                >
                  <span className={cn("flex-none font-mono text-[10px]/none font-semibold", on ? "text-accent" : "text-txt-dim")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </a>
              )
            })}
          </nav>
        </aside>

        {/* body */}
        <div className="min-w-0 max-w-[74ch]">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className="mb-10 scroll-mt-[100px] border-b border-line pb-10 last-of-type:mb-0 last-of-type:border-b-0"
            >
              <div className="mb-[18px] flex items-center gap-4">
                <span className="grid h-11 w-11 flex-none place-items-center border border-solid border-accent-line bg-accent-soft font-display text-[20px]/none font-extrabold italic text-accent cut [--cut:9px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[clamp(22px,3vw,27px)]/[1.02]">{s.title}</h2>
              </div>
              <div className="[&>*+*]:mt-4">
                {s.body.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="grid gap-[11px]">
                      {b.map((li, k) => (
                        <li key={k} className="relative pl-[30px] font-body text-[16px]/[1.6] text-txt text-pretty">
                          <span className="absolute left-0 top-[3px] grid h-[19px] w-[19px] place-items-center border border-solid border-accent-line bg-accent-soft text-accent cut [--cut:4px]">
                            <Icon name="check" size={12} />
                          </span>
                          {li}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j} className="font-body text-[17px]/[1.7] text-txt text-pretty">
                      {b}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
