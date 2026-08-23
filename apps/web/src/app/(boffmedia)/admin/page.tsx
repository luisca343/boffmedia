import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AdminConsole } from "./_components/AdminConsole"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.admin")
  return { title: t("index.title"), description: t("index.description") }
}

export default function Page() {
  return <AdminConsole />
}
