import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimReplayView } from "./_components/BsimReplayView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimReplay.title"), description: t("battlesimReplay.description") }
}

export default function Page() {
  return <BsimReplayView />
}
