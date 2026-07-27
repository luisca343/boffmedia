import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { EventDetailView } from "./_components/EventDetailView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.eventos")
  return { title: t("detalle.title"), description: t("detalle.description") }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventDetailView id={Number(id)} />
}
