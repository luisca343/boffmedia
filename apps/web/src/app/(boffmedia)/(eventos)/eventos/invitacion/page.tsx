import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { RedeemInviteView } from "./_components/RedeemInviteView"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.eventos")
  return { title: t("invitacion.title"), description: t("invitacion.description") }
}

export default function InvitacionPage() {
  // The view reads ?code= via useSearchParams, which opts the page into client
  // rendering — without this boundary the prerender pass fails outright.
  return (
    <Suspense>
      <RedeemInviteView />
    </Suspense>
  )
}
