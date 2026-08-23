import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcMetaEspecie.title"), description: t("vgcMetaEspecie.description") }
}

export default function VgcMetaSpeciesPage() {
  return null;
}
