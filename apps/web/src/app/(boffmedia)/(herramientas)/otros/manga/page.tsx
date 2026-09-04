import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.herramientas")
  return { title: t("manga.title"), description: t("manga.description") }
}

/**
 * Manga downloader UI is implemented as an admin tool, not a public tool.
 * This route exists only to redirect to /admin for backward compatibility.
 *
 * - Not listed in the tools registry (otros.ts)
 * - Not enumerated in command palette (command-palette-utils.ts)
 * - No external links reference this URL
 *
 * The actual UI lives at /admin?section=manga-downloader and requires admin roles.
 * This redirect preserves any direct links that may exist but consolidates the tool
 * under the admin section where it belongs.
 */
export default function MangaPage() {
  redirect('/admin?section=manga-downloader');
}
