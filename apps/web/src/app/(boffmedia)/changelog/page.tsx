import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { BoffmediaChangelog } from "./_components/BoffmediaChangelog"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.changelog")
  return { title: t("title"), description: t("description") }
}

export default function ChangelogPage() {
  return <BoffmediaChangelog />
}
