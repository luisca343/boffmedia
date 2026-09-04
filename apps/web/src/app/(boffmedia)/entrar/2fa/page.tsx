import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { TwoFactorScreen } from "@/components/boffmedia/ui/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.twoFactor")
  return { title: t("title") }
}

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorScreen />
    </Suspense>
  )
}
