import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Iconos · Boffmedia",
  description: "Catálogo completo de iconos de @boffmedia/ui.",
  robots: { index: false, follow: false },
}

export default function IconsShowcaseLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
