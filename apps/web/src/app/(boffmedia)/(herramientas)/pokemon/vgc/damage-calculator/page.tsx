import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { DamageCalculatorView } from "./_components/DamageCalculatorView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcDamageCalculator.title"), description: t("vgcDamageCalculator.description") }
}

export default function Page() {
  return <DamageCalculatorView />
}
