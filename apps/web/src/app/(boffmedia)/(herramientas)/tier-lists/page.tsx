import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getTierListTemplates } from "@/features/tier-list/templates"
import { TierListHub } from "@/features/tier-list/components/TierListHub"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tierLists")
  return { title: t("hubTitle"), description: t("hubLead") }
}
export default async function TierListsPage() {
  const t = await getTranslations("tierLists")
  return <TierListHub templates={getTierListTemplates(t)} />
}
