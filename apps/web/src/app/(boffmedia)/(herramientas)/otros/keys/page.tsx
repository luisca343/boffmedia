import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { KeysGate } from "./_components/KeysGate"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("keys.title"), description: t("keys.description") }
}

export default function KeysPage() {
  return <KeysGate />
}
