import type { ReactNode } from "react"
import { CategoryCard, SectionHeader, Skeleton, type CategoryCardData } from "@/components/smartrotom/media/ui"

export function CategoryRail({
  eyebrow,
  title,
  categories,
  loading,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  categories: CategoryCardData[]
  loading?: boolean
}) {
  return (
    <section className="mb-8">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-3 gap-[18px] sm:grid-cols-4 md:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-mw-lg" />)
          : categories.map((g) => <CategoryCard key={g.href} g={g} />)}
      </div>
    </section>
  )
}
