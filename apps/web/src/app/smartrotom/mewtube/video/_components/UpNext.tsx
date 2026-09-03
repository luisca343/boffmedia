import Link from "next/link"
import { useTranslations } from "next-intl"
import { Check, Skeleton, type VideoCardData } from "@/components/smartrotom/media/ui"

function Reco({ v }: { v: VideoCardData }) {
  const t = useTranslations("mewtube")

  return (
    <Link
      href={v.href}
      className="group flex gap-2.5 rounded-mw-lg border border-transparent p-1.5 transition-colors hover:border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,transparent)] hover:bg-[color-mix(in_srgb,rgb(var(--mw-accent))_8%,rgb(var(--mw-800)))]"
    >
      <div className="relative aspect-video w-[10.5rem] flex-none overflow-hidden rounded-mw-lg bg-mw-800">
        {v.thumb && (
           
          <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        {v.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded-[3px] bg-black/85 px-1.5 py-0.5 font-mono text-[0.625rem] font-bold text-white">
            {v.duration}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="m-0 mb-1 line-clamp-2 text-[0.8125rem] font-semibold leading-[1.3] group-hover:text-mw-accent">
          {v.title}
        </h4>
        <div className="inline-flex items-center gap-1 text-[0.6875rem] text-mw-fg-mute">
          {v.creator}
          {v.verified && <Check />}
        </div>
        <div className="mt-0.5 text-[0.6875rem] text-mw-fg-faint">
          {[v.views && t("video.views", { count: v.views }), v.age].filter(Boolean).join(" · ")}
        </div>
      </div>
    </Link>
  )
}

export function UpNext({ videos, loading }: { videos: VideoCardData[]; loading?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-2.5 p-1.5">
              <Skeleton className="aspect-video w-[10.5rem] flex-none rounded-mw-lg" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))
        : videos.map((v) => <Reco key={v.href} v={v} />)}
    </div>
  )
}
