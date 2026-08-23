import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SorteosView } from "./_components/SorteosView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("sorteos.title"), description: t("sorteos.description") }
}

export default function SorteosPage() {
  return <SorteosView />;
}
