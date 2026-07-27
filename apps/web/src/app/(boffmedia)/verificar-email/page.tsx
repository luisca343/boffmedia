import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { VerifyEmailScreen } from "@/components/boffmedia/ui/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.auth")
  return { title: t("verificarEmail.title"), description: t("verificarEmail.description") }
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerifyEmailScreen />
    </Suspense>
  )
}
