import { redirect } from "next/navigation"

// Legacy route — the collection/gallery now lives under /coleccion.
export default function TcgpGalleryRedirect() {
  redirect("/pokemon/tcgpocket/coleccion")
}
