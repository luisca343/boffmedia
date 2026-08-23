import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpApp } from "../_components/TcgpApp"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketSobres.title"), description: t("tcgpocketSobres.description") }
}

export default function TcgpSobresPage() {
  return (
    <Suspense>
      <TcgpApp view="sobres" />
    </Suspense>
  )
}
