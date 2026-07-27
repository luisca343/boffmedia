import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { MewCodex } from "@/components/boffmedia/ui/mewgenics/codex"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mewgenics.title"), description: t("mewgenics.description") }
}

export default function MewgenicsPage() {
  return <MewCodex />
}
