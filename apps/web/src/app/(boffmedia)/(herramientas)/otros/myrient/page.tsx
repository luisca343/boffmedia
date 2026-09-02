import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { MyrientDownloader } from "@boffmedia/tools-misc"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("myrient.title"), description: t("myrient.description") }
}

export default function MyrientPage() {
  return <MyrientDownloader />
}
