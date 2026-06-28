import { FloatingSection } from "../_components/layout/FloatingSection"

export default function JuegosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FloatingSection className="min-h-screen pt-16 bg-gradient-to-b from-base via-layer-1 to-layer-2">
      {children}
    </FloatingSection>
  )
}
