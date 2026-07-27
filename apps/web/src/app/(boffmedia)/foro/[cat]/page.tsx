import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ForumCategoryView } from "./_components/ForumCategoryView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.foro")
  return { title: t("categoria.title"), description: t("categoria.description") }
}

export default async function ForumCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  return <ForumCategoryView slug={decodeURIComponent(cat)} />
}
