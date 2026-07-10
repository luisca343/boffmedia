import type { Metadata } from "next"
import { ForumView } from "./_components/ForumView"

export const metadata: Metadata = {
  title: "Foro · Boffmedia",
  description: "Debate, dudas y estrategia con la comunidad de Boffmedia.",
}

export default function ForumPage() {
  return <ForumView />
}
