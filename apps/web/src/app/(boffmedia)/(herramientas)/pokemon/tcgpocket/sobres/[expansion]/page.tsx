import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpRouted } from "../../_components/TcgpRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketSobre.title"), description: t("tcgpocketSobre.description") }
}

export default function TcgpPackPage({ params }: { params: { expansion: string } }) {
  return (
    <Suspense>
      <TcgpRouted view="sobres" expansion={params.expansion} />
    </Suspense>
  )
}
