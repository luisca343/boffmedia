import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TrackerSessionView } from "./_components/TrackerSessionView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcTrackerSesion.title"), description: t("vgcTrackerSesion.description") }
}

export default function Page(props: ComponentProps<typeof TrackerSessionView>) {
  return <TrackerSessionView {...props} />
}
