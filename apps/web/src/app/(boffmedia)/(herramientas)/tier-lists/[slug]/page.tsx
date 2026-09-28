import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getTierListTemplates } from "@/features/tier-list/templates"
import { TierListWorkspace } from "@/features/tier-list/components/TierListWorkspace"

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ instance?: string }> }
const validLocalSlug = (slug: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("tierLists")
  const { slug } = await params
  const template = getTierListTemplates(t).find((item) => item.slug === slug)
  // Local private metadata is never rendered or retrieved on the server.
  return { title: template?.title ?? t("hubTitle"), robots: { index: !!template, follow: !!template } }
}
export default async function TierListPage({ params, searchParams }: Props) {
  const t = await getTranslations("tierLists")
  const { slug } = await params
  const { instance } = await searchParams
  const template = getTierListTemplates(t).find((item) => item.slug === slug) ?? null
  if (!template && !validLocalSlug(slug)) notFound()
  if (instance && !/^[a-zA-Z0-9_-]{1,120}$/.test(instance)) notFound()
  return <main className="wrap-wide py-10"><TierListWorkspace template={template} slug={slug} instanceId={instance} /></main>
}
