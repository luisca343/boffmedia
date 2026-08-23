import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimShowdownView } from "./_components/BsimShowdownView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimShowdown.title"), description: t("battlesimShowdown.description") }
}

export default function Page() {
  return <BsimShowdownView />
}
