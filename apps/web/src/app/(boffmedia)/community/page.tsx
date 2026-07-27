import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CommunityView } from "./_components/CommunityView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.comunidad")
  return { title: t("index.title"), description: t("index.description") }
}

export default function CommunityPage() {
  return <CommunityView />
}
