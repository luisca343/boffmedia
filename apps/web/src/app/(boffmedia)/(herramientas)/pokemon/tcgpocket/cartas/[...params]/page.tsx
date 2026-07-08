import { Suspense } from "react"
import { TcgpApp } from "../../_components/TcgpApp"

// Deep link — /cartas/<setId>/<cardId> (or /cartas/<cardId>). Opens the card's
// detail drawer over the card browser.
export default function TcgpCardDeepLink({ params }: { params: { params: string[] } }) {
  const parts = params.params || []
  const cardId = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return (
    <Suspense>
      <TcgpApp view="cartas" cardId={cardId} />
    </Suspense>
  )
}
