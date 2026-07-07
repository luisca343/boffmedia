import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ToolsHub } from "./_components/ToolsHub"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("toolsUi.meta")
  return { title: t("title"), description: t("description") }
}

export default function ToolsHubPage() {
  return <ToolsHub />
}
