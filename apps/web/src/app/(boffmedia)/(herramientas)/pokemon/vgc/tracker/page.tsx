import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TrackerHomeView } from "./_components/TrackerHomeView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcTracker.title"), description: t("vgcTracker.description") }
}

export default function Page() {
  return <TrackerHomeView />
}
