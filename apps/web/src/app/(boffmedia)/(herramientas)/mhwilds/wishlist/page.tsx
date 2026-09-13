import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { WishlistView } from "@boffmedia/tools-mhwilds"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mhwildsWishlist.title"), description: t("mhwildsWishlist.description") }
}

export default function WishlistPage() {
  return <WishlistView />
}
