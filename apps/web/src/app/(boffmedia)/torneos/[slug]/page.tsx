import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TorneoDetailView } from "./_components/TorneoDetailView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.torneos")
  return { title: t("detalle.title"), description: t("detalle.description") }
}

export default function Page(props: ComponentProps<typeof TorneoDetailView>) {
  return <TorneoDetailView {...props} />
}
