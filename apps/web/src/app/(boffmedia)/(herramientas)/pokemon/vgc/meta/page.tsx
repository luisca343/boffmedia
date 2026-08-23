import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("vgcMeta.title"), description: t("vgcMeta.description") }
}

export default function VgcMetaPage() {
  return null;
}
