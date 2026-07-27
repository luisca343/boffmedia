import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ResetScreen } from "@/components/boffmedia/ui/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.auth")
  return { title: t("restablecer.title"), description: t("restablecer.description") }
}

export default function RestablecerPage() {
  return (
    <Suspense>
      <ResetScreen />
    </Suspense>
  )
}
