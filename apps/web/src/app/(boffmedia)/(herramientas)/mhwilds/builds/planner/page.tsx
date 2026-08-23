import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PlannerView } from "@boffmedia/tools-mhwilds"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mhwildsPlanner.title"), description: t("mhwildsPlanner.description") }
}

export default function BuildPlannerPage() {
  return <PlannerView />
}
