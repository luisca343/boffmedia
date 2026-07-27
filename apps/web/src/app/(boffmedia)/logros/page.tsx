import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LogrosView } from "./_components/LogrosView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.comunidad")
  return { title: t("logros.title"), description: t("logros.description") }
}

export default function LogrosPage() {
  return <LogrosView />
}
