import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { RedeemInviteView } from "./_components/RedeemInviteView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.eventos")
  return { title: t("invitacion.title"), description: t("invitacion.description") }
}

export default function InvitacionPage() {
  return <RedeemInviteView />
}
