import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthScreen } from "@/components/boffmedia/ui/auth"
import { discordEnabled, twitchEnabled } from "@/features/authOptions"

export const metadata: Metadata = {
  title: "Entrar · Boffmedia",
  description: "Inicia sesión o crea tu cuenta en Boffmedia.",
}

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthScreen discordEnabled={discordEnabled} twitchEnabled={twitchEnabled} />
    </Suspense>
  )
}
