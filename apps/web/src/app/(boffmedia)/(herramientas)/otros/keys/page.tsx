import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { KeysView } from "./_components/KeysView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("keys.title"), description: t("keys.description") }
}

export default function KeysPage() {
  return <KeysView />;
}
