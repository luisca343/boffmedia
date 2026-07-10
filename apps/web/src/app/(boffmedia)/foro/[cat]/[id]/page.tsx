import type { Metadata } from "next"
import { ForumThreadView } from "./_components/ForumThreadView"

export const metadata: Metadata = {
  title: "Hilo · Foro · Boffmedia",
  description: "Detalle del hilo: mensajes y respuestas de la comunidad.",
}

export default async function ForumThreadPage({ params }: { params: Promise<{ cat: string; id: string }> }) {
  const { cat, id } = await params
  return <ForumThreadView threadId={Number(id)} cat={decodeURIComponent(cat)} />
}
