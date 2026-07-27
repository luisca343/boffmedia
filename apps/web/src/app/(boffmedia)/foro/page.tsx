import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ForumView } from "./_components/ForumView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.foro")
  return { title: t("index.title"), description: t("index.description") }
}

export default function ForumPage() {
  return <ForumView />
}
