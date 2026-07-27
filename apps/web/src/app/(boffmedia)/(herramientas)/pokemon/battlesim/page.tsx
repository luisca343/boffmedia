import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BsimApp } from "./_components/BsimApp"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesim.title"), description: t("battlesim.description") }
}

export default function BattlesimPage() {
  return (
    <Suspense>
      <BsimApp />
    </Suspense>
  )
}
