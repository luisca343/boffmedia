import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("mangaLibrary.title"), description: t("mangaLibrary.description") }
}

export default function MangaLibraryPage() {
  redirect('/admin?section=manga-library');
}
