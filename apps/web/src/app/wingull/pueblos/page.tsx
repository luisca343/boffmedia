import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PueblosView } from "./_components/PueblosView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.wingull")
  return { title: t("pueblos.title"), description: t("pueblos.description") }
}

export default function Page() {
  return <PueblosView />
}
