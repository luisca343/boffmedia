import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimReplayDetailView } from "./_components/BsimReplayDetailView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimReplayDetalle.title"), description: t("battlesimReplayDetalle.description") }
}

export default function Page(props: ComponentProps<typeof BsimReplayDetailView>) {
  return <BsimReplayDetailView {...props} />
}
