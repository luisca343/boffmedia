import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("battlesimReplayDetalle.title"), description: t("battlesimReplayDetalle.description") }
}

// The route exists for SEO and for shareable links, and for nothing else: the
// tool itself is mounted ONCE by `../layout.tsx` (walk up to the battlesim
// segment) and reads which screen to show off the address. A page that rendered
// the tool would be a second copy of it, and — before the layout existed — a
// FRESH copy on every navigation, which is what used to destroy a running
// battle whenever you left its screen.
export default function Page() {
  return null
}
