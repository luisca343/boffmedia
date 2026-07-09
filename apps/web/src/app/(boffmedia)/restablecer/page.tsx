import { Suspense } from "react"
import type { Metadata } from "next"
import { ResetScreen } from "@/components/boffmedia/ui/auth"

export const metadata: Metadata = {
  title: "Restablecer contraseña · Boffmedia",
  description: "Elige una nueva contraseña para tu cuenta de Boffmedia.",
}

export default function RestablecerPage() {
  return (
    <Suspense>
      <ResetScreen />
    </Suspense>
  )
}
