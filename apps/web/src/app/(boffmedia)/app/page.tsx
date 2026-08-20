import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AppDownloadView } from "./_components/AppDownloadView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.app")
  return { title: t("index.title"), description: t("index.description") }
}

export default function AppPage() {
  return <AppDownloadView />
}
