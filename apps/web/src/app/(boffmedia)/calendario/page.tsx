import type { Metadata } from "next"
import { CalendarView } from "./_components/CalendarView"

export const metadata: Metadata = {
  title: "Calendario · Boffmedia",
  description: "Todos los eventos de la comunidad Boffmedia ordenados por fecha.",
}

export default function CalendarioPage() {
  return <CalendarView />
}
