import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TrackerSeriesView } from "./_components/TrackerSeriesView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcTrackerSerie.title"), description: t("vgcTrackerSerie.description") }
}

export default function Page(props: ComponentProps<typeof TrackerSeriesView>) {
  return <TrackerSeriesView {...props} />
}
