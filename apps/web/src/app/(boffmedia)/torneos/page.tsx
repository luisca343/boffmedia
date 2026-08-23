import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TorneosView } from "./_components/TorneosView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.torneos")
  return { title: t("index.title"), description: t("index.description") }
}

export default function Page() {
  return <TorneosView />
}
