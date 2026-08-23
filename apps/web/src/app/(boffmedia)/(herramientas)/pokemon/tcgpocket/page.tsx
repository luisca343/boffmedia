import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpApp } from "./_components/TcgpApp"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocket.title"), description: t("tcgpocket.description") }
}

export default function TcgpPanelPage() {
  return (
    <Suspense>
      <TcgpApp view="panel" />
    </Suspense>
  )
}
