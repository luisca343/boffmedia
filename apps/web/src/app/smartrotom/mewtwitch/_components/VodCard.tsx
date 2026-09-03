import Link from "next/link"

export interface VodCardData {
  href: string
  thumb?: string
  title: string
  streamer?: string
  meta?: string
  duration?: string
}

/** A recorded video / clip / history item (not live — no viewer pulse). */
export function VodCard({ v }: { v: VodCardData }) {
  return (
    <Link
      href={v.href}
      className="group flex flex-col rounded-mw-xl text-mw-fg transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden rounded-mw-xl border border-mw-line bg-mw-800 transition-colors group-hover:border-[color-mix(in_srgb,rgb(var(--mw-accent))_50%,transparent)]">
        {v.thumb && (
           
          <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        {v.duration && (
          <span className="absolute bottom-2 right-2 rounded-mw-sm bg-black/85 px-1.5 py-[3px] font-mono text-[0.6875rem] font-bold text-white">
            {v.duration}
          </span>
        )}
      </div>
      <div className="px-1 pb-1 pt-2.5">
        <h3 className="m-0 line-clamp-2 text-sm font-semibold leading-[1.3] group-hover:text-mw-accent">{v.title}</h3>
        {v.streamer && <div className="mt-1 text-xs text-mw-fg-mute">{v.streamer}</div>}
        {v.meta && <div className="mt-0.5 text-xs text-mw-fg-faint">{v.meta}</div>}
      </div>
    </Link>
  )
}
