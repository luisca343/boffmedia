import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LandingPage } from "@/components/boffmedia/ui/landing/LandingPage"

// Only a description: the title is deliberately left to the root layout, which
// swaps BoffMedia/FicusLab by environment. Pinning it here would erase that.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.home")
  return { description: t("index.description") }
}

export default function Home() {
  return <LandingPage />
}
