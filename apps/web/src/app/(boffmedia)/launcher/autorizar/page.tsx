import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AuthorizeLauncherView } from "./_components/AuthorizeLauncherView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.launcher")
  return { title: t("autorizar.title"), description: t("autorizar.description") }
}

export default function AutorizarPage() {
  return <AuthorizeLauncherView />
}
