import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BibliotecaView } from "@boffmedia/tools-misc"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("biblioteca.title"), description: t("biblioteca.description") }
}

export default function BibliotecaPage() {
  return <BibliotecaView />
}
