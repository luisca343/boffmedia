import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { EventsView } from "./_components/EventsView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.eventos")
  return { title: t("index.title"), description: t("index.description") }
}

export default function EventosPage() {
  return <EventsView />
}
