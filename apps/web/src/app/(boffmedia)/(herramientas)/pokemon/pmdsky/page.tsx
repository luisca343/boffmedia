import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { PmdSkyRouted } from "./_components/PmdSkyRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("pmdsky.title"), description: t("pmdsky.description") }
}

export default function PmdPage() {
  return (
    <Suspense>
      <PmdSkyRouted />
    </Suspense>
  )
}
