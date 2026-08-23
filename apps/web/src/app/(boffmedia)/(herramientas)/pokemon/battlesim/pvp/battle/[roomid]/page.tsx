import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimPvpRoomView } from "./_components/BsimPvpRoomView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimPvpSala.title"), description: t("battlesimPvpSala.description") }
}

export default function Page(props: ComponentProps<typeof BsimPvpRoomView>) {
  return <BsimPvpRoomView {...props} />
}
