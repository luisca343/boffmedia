import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpApp } from "../_components/TcgpApp"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketCartas.title"), description: t("tcgpocketCartas.description") }
}

export default function TcgpCartasPage() {
  return (
    <Suspense>
      <TcgpApp view="cartas" />
    </Suspense>
  )
}
