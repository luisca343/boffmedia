import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ProfileView } from "./_components/ProfileView"
import { discordEnabled, twitchEnabled } from "@/features/authOptions"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.perfil")
  return { title: t("propio.title"), description: t("propio.description") }
}

export default function ProfilePage() {
  return <ProfileView discordEnabled={discordEnabled} twitchEnabled={twitchEnabled} />
}
