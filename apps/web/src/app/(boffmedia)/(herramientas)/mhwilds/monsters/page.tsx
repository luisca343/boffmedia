import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BestiaryView } from "@boffmedia/tools-mhwilds"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mhwildsMonsters.title"), description: t("mhwildsMonsters.description") }
}

export default function BestiaryPage() {
  return <BestiaryView />
}
