import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LegalPageContent } from "../_components/LegalPageContent"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.legal.cookies")
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default function CookiesPage() {
  return <LegalPageContent page="cookies" />
}
