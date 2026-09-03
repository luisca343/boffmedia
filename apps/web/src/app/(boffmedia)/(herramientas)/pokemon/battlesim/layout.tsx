import { Suspense } from "react"

import { BsimRouted } from "./_components/BsimRouted"

/**
 * The tool is mounted HERE, once, for every `/pokemon/battlesim/**` route.
 *
 * Next preserves a layout across navigations between its own children, and
 * preserving the tool is the whole reason this file exists: a battle against
 * the AI is simulated by a Web Worker owned by the React tree below, so a tool
 * that remounts on every navigation is a tool that cannot keep a battle open
 * while you look at anything else. Battlesim now keeps several open at once
 * (see the tab bar), which makes that non-negotiable.
 *
 * The pages under this layout render nothing. They still exist, and must: they
 * are what makes each screen a real, indexable, shareable URL with its own
 * metadata. `BsimRouted` reads the address to decide which screen is on.
 */
export default function BattlesimLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* `useSearchParams` inside — Next requires a boundary for it. */}
      <Suspense>
        <BsimRouted />
      </Suspense>
      {children}
    </>
  )
}
