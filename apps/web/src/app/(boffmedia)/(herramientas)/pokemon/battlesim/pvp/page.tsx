import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimPvpView } from "./_components/BsimPvpView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimPvp.title"), description: t("battlesimPvp.description") }
}

export default function Page() {
  return <BsimPvpView />
}
