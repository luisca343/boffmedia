import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpRouted } from "./_components/TcgpRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocket.title"), description: t("tcgpocket.description") }
}

export default function TcgpPanelPage() {
  return (
    <Suspense>
      <TcgpRouted view="panel" />
    </Suspense>
  )
}
