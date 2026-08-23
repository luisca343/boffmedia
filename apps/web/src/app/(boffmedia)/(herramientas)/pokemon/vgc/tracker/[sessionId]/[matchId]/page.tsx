import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TrackerMatchView } from "./_components/TrackerMatchView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcTrackerPartida.title"), description: t("vgcTrackerPartida.description") }
}

export default function Page(props: ComponentProps<typeof TrackerMatchView>) {
  return <TrackerMatchView {...props} />
}
