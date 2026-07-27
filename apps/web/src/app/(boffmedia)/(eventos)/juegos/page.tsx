import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { GamesView } from "./_components/GamesView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.juegos")
  return { title: t("index.title"), description: t("index.description") }
}

export default function JuegosPage() {
  return <GamesView />
}
