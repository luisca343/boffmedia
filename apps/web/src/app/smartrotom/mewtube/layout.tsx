import type { ReactNode } from "react"
import { MediaShell } from "@/components/smartrotom/media"
import { MediaQueryProvider } from "@/components/smartrotom/media/MediaQueryProvider"

export default function MewtubeLayout({ children }: { children: ReactNode }) {
  return (
    <MediaQueryProvider>
      <MediaShell app="mewtube">{children}</MediaShell>
    </MediaQueryProvider>
  )
}
