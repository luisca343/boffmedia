import { EventoDetail } from "../../_components/eventos/EventoDetail"

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventoDetail id={id} />
}
