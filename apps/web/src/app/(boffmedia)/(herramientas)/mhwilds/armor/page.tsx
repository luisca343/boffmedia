import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ArmorCatalogView } from "@boffmedia/tools-mhwilds"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mhwildsArmor.title"), description: t("mhwildsArmor.description") }
}

export default function ArmorPage() {
  return <ArmorCatalogView />
}
