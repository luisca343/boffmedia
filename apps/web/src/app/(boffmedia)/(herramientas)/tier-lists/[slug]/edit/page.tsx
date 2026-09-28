import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getTierListTemplates } from "@/features/tier-list/templates"
import { TierListEditorPage } from "@/features/tier-list/components/TierListEditorPage"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tierLists")
  return { title: t("templateEditor"), robots: { index: false, follow: false } }
}
export default async function TierListEditPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ instance?: string }>
}) {
  const t = await getTranslations("tierLists")
  const { slug } = await params
  const { instance } = await searchParams
  const template = getTierListTemplates(t).find((item) => item.slug === slug) ?? null
  if (!template && slug !== "new" && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug)) notFound()
  if (instance && !/^[a-zA-Z0-9_-]{1,120}$/.test(instance)) notFound()
  return <main className="wrap-wide py-10"><TierListEditorPage template={template} slug={slug} instanceId={instance} /></main>
}
