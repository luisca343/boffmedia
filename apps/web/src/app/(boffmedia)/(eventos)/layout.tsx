import { FloatingSection } from "../_components/layout/FloatingSection"

export default function JuegosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FloatingSection className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      {children}
    </FloatingSection>
  )
}
