import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { WeaponTreeView } from "@boffmedia/tools-mhwilds"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mhwildsTree.title"), description: t("mhwildsTree.description") }
}

export default function WeaponTreePage() {
  return <WeaponTreeView />
}
