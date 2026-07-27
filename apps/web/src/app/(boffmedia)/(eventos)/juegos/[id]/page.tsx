import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { GameDetailView } from "./_components/GameDetailView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.juegos")
  return { title: t("detalle.title"), description: t("detalle.description") }
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GameDetailView id={Number(id)} />
}
