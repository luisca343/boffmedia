import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LeaderboardView } from "./_components/LeaderboardView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.comunidad")
  return { title: t("clasificacion.title"), description: t("clasificacion.description") }
}

export default function ClasificacionPage() {
  return <LeaderboardView />
}
