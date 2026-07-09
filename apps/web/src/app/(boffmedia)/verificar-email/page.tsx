import { Suspense } from "react"
import type { Metadata } from "next"
import { VerifyEmailScreen } from "@/components/boffmedia/ui/auth"

export const metadata: Metadata = {
  title: "Verificar correo · Boffmedia",
  description: "Verifica tu dirección de correo de Boffmedia.",
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerifyEmailScreen />
    </Suspense>
  )
}
