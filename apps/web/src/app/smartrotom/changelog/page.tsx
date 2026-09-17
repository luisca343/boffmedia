import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { SmartRotomChangelog } from "./_components/SmartRotomChangelog"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.smartrotom.changelog")
  return { title: t("title"), description: t("description") }
}

export default function SmartRotomChangelogPage() {
  return <SmartRotomChangelog />
}
