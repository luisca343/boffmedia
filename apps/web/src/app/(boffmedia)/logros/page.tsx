import type { Metadata } from "next"
import { LogrosView } from "./_components/LogrosView"

export const metadata: Metadata = {
  title: "Logros · Boffmedia",
  description: "El catálogo de logros y medallas de la comunidad Boffmedia.",
}

export default function LogrosPage() {
  return <LogrosView />
}
