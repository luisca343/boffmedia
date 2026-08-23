import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

// Legacy route — the collection/gallery now lives under /coleccion.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketGaleria.title"), description: t("tcgpocketGaleria.description") }
}

export default function TcgpGalleryRedirect() {
  redirect("/pokemon/tcgpocket/coleccion")
}
