import type { Metadata } from "next"
import { CommunityView } from "./_components/CommunityView"

export const metadata: Metadata = {
  title: "Comunidad · Boffmedia",
  description: "Torneos, clasificación, logros y la comunidad de Discord de Boffmedia.",
}

export default function CommunityPage() {
  return <CommunityView />
}
