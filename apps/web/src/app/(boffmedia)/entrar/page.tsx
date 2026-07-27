import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AuthScreen } from "@/components/boffmedia/ui/auth"
import { discordEnabled, twitchEnabled } from "@/features/authOptions"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.auth")
  return { title: t("entrar.title"), description: t("entrar.description") }
}

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthScreen discordEnabled={discordEnabled} twitchEnabled={twitchEnabled} />
    </Suspense>
  )
}
