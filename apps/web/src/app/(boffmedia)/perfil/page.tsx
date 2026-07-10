import type { Metadata } from "next"
import { ProfileView } from "./_components/ProfileView"
import { discordEnabled, twitchEnabled } from "@/features/authOptions"

export const metadata: Metadata = {
  title: "Mi perfil · Boffmedia",
  description: "Gestiona tu cuenta, avatar y cuentas vinculadas.",
}

export default function ProfilePage() {
  return <ProfileView discordEnabled={discordEnabled} twitchEnabled={twitchEnabled} />
}
