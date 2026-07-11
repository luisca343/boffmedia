import * as React from "react"
import { Kicker } from "@/components/boffmedia/primitives"

export interface SectionHeadProps {
  kicker?: React.ReactNode
  title: string
  lead?: string
  children?: React.ReactNode
}

export function SectionHead({ kicker, title, lead, children }: SectionHeadProps) {
  return (
    <div data-ds="boffmedia" className="mb-10">
      {kicker && <Kicker>{kicker}</Kicker>}
      {/* display treatment (800 italic uppercase + em stroke) comes from the
          data-ds base styles in tailwind.config.ts */}
      <h2 data-reveal className="my-[14px] text-[clamp(44px,5vw,64px)]" dangerouslySetInnerHTML={{ __html: title }} />
      {lead && (
        <p data-reveal style={{ ["--i"]: 1 } as React.CSSProperties} className="max-w-[60ch] text-[17px] text-txt-muted [text-wrap:pretty]">
          {lead}
        </p>
      )}
      {children}
    </div>
  )
}
