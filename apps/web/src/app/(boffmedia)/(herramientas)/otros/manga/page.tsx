import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("manga.title"), description: t("manga.description") }
}

export default function MangaPage() {
  redirect('/admin?section=manga-downloader');
}
