import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { FortunesWeaveGate } from "./_components/FortunesWeaveGate"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return {
    title: t("fortunesWeave.title"),
    description: t("fortunesWeave.description"),
  }
}

export default function FortunesWeavePage() {
  return <FortunesWeaveGate />
}
