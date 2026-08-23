import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimPlayView } from "./_components/BsimPlayView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimPlay.title"), description: t("battlesimPlay.description") }
}

export default function Page() {
  return <BsimPlayView />
}
