import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PmdSkyView } from "@boffmedia/tools-pokemon"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("pmdsky.title"), description: t("pmdsky.description") }
}

export default function PmdPage() {
  return <PmdSkyView />
}
