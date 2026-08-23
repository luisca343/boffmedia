import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ShowdownDebugGate } from "./_components/ShowdownDebugGate"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.showdownDebug")
  return {
    title: t("index.title"),
    description: t("index.description"),
    // An internal tool has no business in a search index.
    robots: { index: false, follow: false },
  }
}

export default function ShowdownDebugPage() {
  return <ShowdownDebugGate />
}
