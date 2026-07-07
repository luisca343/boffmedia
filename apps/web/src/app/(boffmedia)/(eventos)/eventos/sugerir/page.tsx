import type { Metadata } from "next"
import { SuggestEventView } from "./_components/SuggestEventView"

export const metadata: Metadata = {
  title: "Sugerir evento · Boffmedia",
  description: "Propón un evento para la comunidad Boffmedia.",
}

export default function SugerirPage() {
  return <SuggestEventView />
}
