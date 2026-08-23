import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PmdSkyView } from "./_components/PmdSkyView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("pmdsky.title"), description: t("pmdsky.description") }
}

export default function PmdPage() {
  return <PmdSkyView />;
}
