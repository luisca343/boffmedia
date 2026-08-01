import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LauncherDownloadView } from "./_components/LauncherDownloadView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.launcher")
  return { title: t("index.title"), description: t("index.description") }
}

export default function LauncherPage() {
  return <LauncherDownloadView />
}
