import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { MewRouted } from "../_components/MewRouted"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return {
    title: t("mewgenics.builder.title"),
    description: t("mewgenics.builder.description"),
  }
}

export default function MewgenicsBuilderPage() {
  return <MewRouted screen="builder" />
}
