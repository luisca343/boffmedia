import type { ReactNode } from "react"
import { CardSkeleton, SectionHeader, VideoCard, type VideoCardData } from "@/components/smartrotom/media/ui"

/** A titled grid of video cards with loading + empty states. */
export function VideoSection({
  eyebrow,
  title,
  subtitle,
  videos,
  loading,
  action,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  videos: VideoCardData[]
  loading?: boolean
  action?: ReactNode
}) {
  return (
    <section className="mb-8">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} rule={!subtitle} action={action} />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : videos.map((v) => <VideoCard key={v.href} v={v} />)}
      </div>
      {!loading && videos.length === 0 && (
        <p className="py-12 text-center text-sm text-mw-fg-faint">No hay nada por aquí todavía.</p>
      )}
    </section>
  )
}
