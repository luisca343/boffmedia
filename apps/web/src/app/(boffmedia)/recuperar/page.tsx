import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { RecoverScreen } from "@/components/boffmedia/ui/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.auth")
  return { title: t("recuperar.title"), description: t("recuperar.description") }
}

export default function RecuperarPage() {
  return (
    <Suspense>
      <RecoverScreen />
    </Suspense>
  )
}
