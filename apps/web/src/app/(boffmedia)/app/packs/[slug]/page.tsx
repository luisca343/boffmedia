import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getPublicPack } from "@/services/api/boffmedia/publicPacksService"
import { PublicPackView } from "./_components/PublicPackView"

// A pack's shareable page. Fetched on the SERVER and passed down, so the link
// carries a real title, description and preview image when somebody pastes it
// into Discord — which is the entire reason the route exists. A client-side
// fetch would render an empty shell to every crawler.
//
// `getPublicPack` resolves null both for "no such pack" and for one whose access
// is `password` or `allowlist`. They are indistinguishable here on purpose:
// telling them apart would make this a "does this private pack exist?" oracle.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [pack, t] = await Promise.all([
    getPublicPack(slug),
    getTranslations("pageMeta.app"),
  ])
  if (!pack) return { title: t("index.title") }

  return {
    title: pack.name,
    description: pack.summary ?? t("index.description"),
    openGraph: {
      title: pack.name,
      description: pack.summary ?? undefined,
      images: pack.iconUrl ? [{ url: pack.iconUrl }] : undefined,
    },
  }
}

export default async function PublicPackPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pack = await getPublicPack(slug)
  if (!pack) notFound()
  return <PublicPackView pack={pack} />
}
