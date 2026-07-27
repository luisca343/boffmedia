import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ForumThreadView } from "./_components/ForumThreadView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.foro")
  return { title: t("hilo.title"), description: t("hilo.description") }
}

export default async function ForumThreadPage({ params }: { params: Promise<{ cat: string; id: string }> }) {
  const { cat, id } = await params
  return <ForumThreadView threadId={Number(id)} cat={decodeURIComponent(cat)} />
}
