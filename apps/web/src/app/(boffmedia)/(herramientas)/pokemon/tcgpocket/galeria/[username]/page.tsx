import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

// Legacy route — read-only galleries now render under /coleccion?u=<username>.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("tcgpocketGaleriaUsuario.title"), description: t("tcgpocketGaleriaUsuario.description") }
}

export default function TcgpUserGalleryRedirect({ params }: { params: { username: string } }) {
  redirect(`/pokemon/tcgpocket/coleccion?u=${encodeURIComponent(params.username)}`)
}
