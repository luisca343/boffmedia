import type { Metadata } from "next"
import { PublicProfileView } from "./_components/PublicProfileView"

export const metadata: Metadata = {
  title: "Perfil · Boffmedia",
  description: "Perfil público: logros, estadísticas y actividad reciente.",
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  return <PublicProfileView handle={decodeURIComponent(handle)} />
}
