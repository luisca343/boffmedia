import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CalendarView } from "./_components/CalendarView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.comunidad")
  return { title: t("calendario.title"), description: t("calendario.description") }
}

export default function CalendarioPage() {
  return <CalendarView />
}
