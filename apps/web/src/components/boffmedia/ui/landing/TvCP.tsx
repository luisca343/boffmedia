import * as React from "react"
import { cn } from "@/lib/utils"

export function TvCP({
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
  title: React.ReactNode
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
          {/* display treatment from data-ds base styles; zone-tinted em stroke kept local */}
          <h3 className="mb-2.5 mt-3 leading-[0.98] text-txt [font-size:clamp(30px,3.4vw,46px)] [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.5px_rgba(var(--zr),var(--zg),var(--zb),1)]">
            {title}
          </h3>
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
