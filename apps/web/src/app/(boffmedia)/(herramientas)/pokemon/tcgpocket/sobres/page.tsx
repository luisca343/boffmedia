import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpRouted } from "../_components/TcgpRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketSobres.title"), description: t("tcgpocketSobres.description") }
}

export default function TcgpSobresPage() {
  return (
    <Suspense>
      <TcgpRouted view="sobres" />
    </Suspense>
  )
}
