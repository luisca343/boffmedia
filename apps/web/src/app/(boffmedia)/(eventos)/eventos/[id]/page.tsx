import type { Metadata } from "next"
import { EventDetailView } from "./_components/EventDetailView"

export const metadata: Metadata = {
  title: "Evento · Boffmedia",
  description: "Detalle del evento: logros, participantes y clasificación.",
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventDetailView id={Number(id)} />
}
