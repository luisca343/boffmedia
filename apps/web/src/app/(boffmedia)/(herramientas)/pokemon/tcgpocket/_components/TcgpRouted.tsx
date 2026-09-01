"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { TcgpApp, type TcgpView } from "@boffmedia/tools-pokemon"

const BASE = "/pokemon/tcgpocket"
const ROUTES: Record<TcgpView, string> = {
  panel: BASE,
  cartas: `${BASE}/cartas`,
  coleccion: `${BASE}/coleccion`,
  sobres: `${BASE}/sobres`,
}

/**
 * The web's routing half of TCG Pocket.
 *
 * The tool itself has no idea what a URL is — it runs in the launcher too,
 * where there are none — so it takes the current view as a prop and reports
 * changes back. This is the adapter that turns those into real routes, which
 * is what keeps the site's deep links (a card, a set, someone's gallery)
 * working exactly as before.
 */
export function TcgpRouted({
  view,
  expansion,
  cardId,
}: {
  view: TcgpView
  expansion?: string
  cardId?: string
}) {
  const router = useRouter()
  const params = useSearchParams()

  return (
    <TcgpApp
      view={view}
      expansion={expansion}
      cardId={cardId}
      query={params.get("q") ?? ""}
      galleryUser={params.get("u")}
      onViewChange={(next) => router.push(ROUTES[next])}
      onQueryChange={(q) => router.push(`${ROUTES.cartas}?q=${encodeURIComponent(q)}`)}
      onGalleryUserChange={(user) =>
        router.push(user ? `${ROUTES.coleccion}?u=${encodeURIComponent(user)}` : ROUTES.coleccion)
      }
    />
  )
}
