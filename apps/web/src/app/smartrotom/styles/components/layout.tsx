import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Componentes · SmartRotom",
  description: "Sistema de diseño de SmartRotom — el chrome sr-* y los seis mundos de tokens por app.",
}

// The whole SmartRotom type system is self-hosted (`src/styles/fonts.css`), so unlike
// the Boffmedia showcase this layout loads no external font — it exists to scope the
// route's metadata.
export default function SmartRotomComponentsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
