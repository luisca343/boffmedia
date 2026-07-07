import type { Metadata } from "next"
import { GamesView } from "./_components/GamesView"

export const metadata: Metadata = {
  title: "Juegos · Boffmedia",
  description: "Todos los juegos de la plataforma Boffmedia.",
}

export default function JuegosPage() {
  return <GamesView />
}
