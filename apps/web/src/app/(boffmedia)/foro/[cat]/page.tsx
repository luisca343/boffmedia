import type { Metadata } from "next"
import { ForumCategoryView } from "./_components/ForumCategoryView"

export const metadata: Metadata = {
  title: "Tablón · Foro · Boffmedia",
  description: "Hilos y debates del tablón.",
}

export default async function ForumCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  return <ForumCategoryView slug={decodeURIComponent(cat)} />
}
