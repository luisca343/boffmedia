import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SuggestEventView } from "./_components/SuggestEventView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.eventos")
  return { title: t("sugerir.title"), description: t("sugerir.description") }
}

export default function SugerirPage() {
  return <SuggestEventView />
}
