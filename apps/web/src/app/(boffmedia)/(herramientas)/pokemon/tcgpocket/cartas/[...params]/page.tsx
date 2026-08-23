import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { TcgpApp } from "../../_components/TcgpApp"

// Deep link — /cartas/<setId>/<cardId> (or /cartas/<cardId>). Opens the card's
// detail drawer over the card browser.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketCarta.title"), description: t("tcgpocketCarta.description") }
}

export default function TcgpCardDeepLink({ params }: { params: { params: string[] } }) {
  const parts = params.params || []
  const cardId = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return (
    <Suspense>
      <TcgpApp view="cartas" cardId={cardId} />
    </Suspense>
  )
}
