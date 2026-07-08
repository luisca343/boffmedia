import { redirect } from "next/navigation"

// Legacy route — read-only galleries now render under /coleccion?u=<username>.
export default function TcgpUserGalleryRedirect({ params }: { params: { username: string } }) {
  redirect(`/pokemon/tcgpocket/coleccion?u=${encodeURIComponent(params.username)}`)
}
