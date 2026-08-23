import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SpeedTiersView } from "./_components/SpeedTiersView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcSpeed.title"), description: t("vgcSpeed.description") }
}

export default function Page() {
  return <SpeedTiersView />
}
