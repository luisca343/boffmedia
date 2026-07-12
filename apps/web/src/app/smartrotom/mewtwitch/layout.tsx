import type { ReactNode } from "react"
import { MediaShell } from "@/components/smartrotom/media"
import { MediaQueryProvider } from "@/components/smartrotom/media/MediaQueryProvider"

export default function MewtwitchLayout({ children }: { children: ReactNode }) {
  return (
    <MediaQueryProvider>
      <MediaShell app="mewtwitch">{children}</MediaShell>
    </MediaQueryProvider>
  )
}
