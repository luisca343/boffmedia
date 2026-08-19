import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SteamFreeView } from "./_components/SteamFreeView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("steamfree.title"), description: t("steamfree.description") }
}

export default function SteamFreePage() {
  return <SteamFreeView />
}
