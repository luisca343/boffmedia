import type { ComponentProps } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimShowdownRoomView } from "./_components/BsimShowdownRoomView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimShowdownSala.title"), description: t("battlesimShowdownSala.description") }
}

export default function Page(props: ComponentProps<typeof BsimShowdownRoomView>) {
  return <BsimShowdownRoomView {...props} />
}
