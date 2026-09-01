import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpRouted } from "../_components/TcgpRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketCartas.title"), description: t("tcgpocketCartas.description") }
}

export default function TcgpCartasPage() {
  return (
    <Suspense>
      <TcgpRouted view="cartas" />
    </Suspense>
  )
}
