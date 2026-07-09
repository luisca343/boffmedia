import { Suspense } from "react"
import type { Metadata } from "next"
import { RecoverScreen } from "@/components/boffmedia/ui/auth"

export const metadata: Metadata = {
  title: "Recuperar contraseña · Boffmedia",
  description: "Recibe un enlace para restablecer tu contraseña de Boffmedia.",
}

export default function RecuperarPage() {
  return (
    <Suspense>
      <RecoverScreen />
    </Suspense>
  )
}
