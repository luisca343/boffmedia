import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PuebloDetailView } from "./_components/PuebloDetailView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.wingull")
  return { title: t("pueblo.title"), description: t("pueblo.description") }
}

export default function Page() {
  return <PuebloDetailView />
}
