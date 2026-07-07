import type { Metadata } from "next"
import { GameDetailView } from "./_components/GameDetailView"

export const metadata: Metadata = {
  title: "Juego · Boffmedia",
  description: "Detalle del juego y sus eventos.",
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GameDetailView id={Number(id)} />
}
