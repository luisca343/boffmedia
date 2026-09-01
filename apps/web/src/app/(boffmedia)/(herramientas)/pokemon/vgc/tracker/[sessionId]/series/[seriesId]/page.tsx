import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TrackerApp } from "@boffmedia/tools-pokemon"
import { VgcRouted } from "../../../../_components/VgcRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcTrackerSerie.title"), description: t("vgcTrackerSerie.description") }
}

export default function Page() {
  return (
    <Suspense>
      <VgcRouted>
        <TrackerApp />
      </VgcRouted>
    </Suspense>
  )
}
