import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpRouted } from "../_components/TcgpRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketColeccion.title"), description: t("tcgpocketColeccion.description") }
}

export default function TcgpColeccionPage() {
  return (
    <Suspense>
      <TcgpRouted view="coleccion" />
    </Suspense>
  )
}
