import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CategoryLanding } from "@/components/boffmedia/ui/tools"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  return { title: t("toolsUi.category.metaTitle", { game: t("games.otros.name") }) }
}

export default function OtherToolsPage() {
  return <CategoryLanding slug="otros" />
}
