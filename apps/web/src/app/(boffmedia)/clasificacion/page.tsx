import type { Metadata } from "next"
import { LeaderboardView } from "./_components/LeaderboardView"

export const metadata: Metadata = {
  title: "Clasificación global · Boffmedia",
  description: "El ranking de toda la comunidad Boffmedia: puntos, medallas y logros.",
}

export default function ClasificacionPage() {
  return <LeaderboardView />
}
