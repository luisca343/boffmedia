import * as React from "react"
import { Kicker } from "@/components/boffmedia/primitives/kicker"

export interface SectionHeadProps {
  kicker?: React.ReactNode
  title: string
  lead?: string
  children?: React.ReactNode
}

export function SectionHead({ kicker, title, lead, children }: SectionHeadProps) {
  return (
    <div className="mb-10">
      {kicker && <Kicker>{kicker}</Kicker>}
      <h2
        data-reveal
        className="my-[14px] font-display text-[clamp(44px,5vw,64px)] font-extrabold italic uppercase leading-[0.92] tracking-[-0.005em] [&_em]:italic [&_em]:text-transparent [&_em]:[-webkit-text-stroke:1.6px_var(--accent)]"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {lead && (
        <p data-reveal style={{ ["--i"]: 1 } as React.CSSProperties} className="max-w-[60ch] text-[17px] text-txt-muted [text-wrap:pretty]">
          {lead}
        </p>
      )}
      {children}
    </div>
  )
}
