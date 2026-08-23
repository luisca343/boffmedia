import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpApp } from "../../_components/TcgpApp"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketSobre.title"), description: t("tcgpocketSobre.description") }
}

export default function TcgpPackPage({ params }: { params: { expansion: string } }) {
  return (
    <Suspense>
      <TcgpApp view="sobres" expansion={params.expansion} />
    </Suspense>
  )
}
