import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { DamageCalculatorView } from "@boffmedia/tools-pokemon"
import { VgcRouted } from "../_components/VgcRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcDamageCalculator.title"), description: t("vgcDamageCalculator.description") }
}

export default function Page() {
  return (
    <Suspense>
      <VgcRouted>
        <DamageCalculatorView />
      </VgcRouted>
    </Suspense>
  )
}
