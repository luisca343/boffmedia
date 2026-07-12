import type { ReactNode } from "react"
import { CardSkeleton, SectionHeader, StreamCard, type StreamCardData } from "@/components/smartrotom/media/ui"

export function StreamSection({
  eyebrow,
  title,
  subtitle,
  streams,
  loading,
  action,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  streams: StreamCardData[]
  loading?: boolean
  action?: ReactNode
}) {
  return (
    <section className="mb-8">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} rule={!subtitle} action={action} />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : streams.map((s) => <StreamCard key={s.href} s={s} />)}
      </div>
      {!loading && streams.length === 0 && (
        <p className="py-12 text-center text-sm text-mw-fg-faint">No hay directos por aquí ahora mismo.</p>
      )}
    </section>
  )
}
