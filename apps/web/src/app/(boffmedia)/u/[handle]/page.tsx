import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PublicProfileView } from "./_components/PublicProfileView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.perfil")
  return { title: t("publico.title"), description: t("publico.description") }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  return <PublicProfileView handle={decodeURIComponent(handle)} />
}
