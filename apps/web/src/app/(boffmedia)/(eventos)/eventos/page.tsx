import type { Metadata } from "next"
import { EventsView } from "./_components/EventsView"

export const metadata: Metadata = {
  title: "Eventos · Boffmedia",
  description: "Torneos, retos y temporadas de la comunidad Boffmedia.",
}

export default function EventosPage() {
  return <EventsView />
}
