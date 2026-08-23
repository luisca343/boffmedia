import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PartidaView } from "./_components/PartidaView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.torneos")
  return { title: t("partida.title"), description: t("partida.description") }
}

export default function Page(props: ComponentProps<typeof PartidaView>) {
  return <PartidaView {...props} />
}
