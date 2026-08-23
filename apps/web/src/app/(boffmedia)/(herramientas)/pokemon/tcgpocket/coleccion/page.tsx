import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpApp } from "../_components/TcgpApp"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketColeccion.title"), description: t("tcgpocketColeccion.description") }
}

export default function TcgpColeccionPage() {
  return (
    <Suspense>
      <TcgpApp view="coleccion" />
    </Suspense>
  )
}
