import { useEffect, useRef, useState } from "react"

import { Button, Empty, Spinner } from "@boffmedia/ui"

import { useT } from "../../i18n"
import { type Screenshot, instanceReveal, instanceScreenshots, screenshotImage } from "../../runtime"
import { formatBytes, formatWhen } from "../../utils/format"

// The Screenshots tab: the images Minecraft writes to `screenshots/` on F2.
//
// Thumbnails load one at a time and only once the tile scrolls into view — a
// long-running server can leave hundreds of multi-megabyte PNGs here, and
// base64-ing every one on mount would freeze the tab and spend memory on images
// nobody scrolled to. An IntersectionObserver drives that; the full-size view
// reuses the same `data:` URL the thumbnail already fetched.

function Thumb({
  slug,
  shot,
  onOpen,
}: {
  slug: string
  shot: Screenshot
  onOpen: (src: string) => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let alive = true
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        void screenshotImage(slug, shot.rel).then((url) => {
          if (alive) setSrc(url)
        })
      },
      { rootMargin: "200px" },
    )
    io.observe(node)
    return () => {
      alive = false
      io.disconnect()
    }
  }, [slug, shot.rel])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => src && onOpen(src)}
      className="group flex flex-col overflow-hidden border border-solid border-line bg-panel text-left"
    >
      <span className="grid aspect-video w-full place-items-center overflow-hidden bg-base-deep">
        {src ? (
          <img
            src={src}
            alt={shot.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <Spinner size={14} />
        )}
      </span>
      <span className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="truncate font-mono text-[10px] text-txt-dim">{shot.name}</span>
        <span className="shrink-0 font-mono text-[10px] text-txt-dim">{formatBytes(shot.size)}</span>
      </span>
    </button>
  )
}

export function ScreenshotsTab({ slug }: { slug: string }) {
  const t = useT("screenshots")
  const [shots, setShots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    setLoading(true)
    void instanceScreenshots(slug).then((list) => {
      if (!live) return
      setShots(list)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [slug])

  // Escape closes the lightbox, the one keyboard affordance a full-screen image
  // overlay must not omit.
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox])

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[11px] text-txt-dim">
        <Spinner size={12} /> {t("reading")}
      </span>
    )
  }

  if (shots.length === 0) {
    return <Empty icon="camera" title={t("empty")} lead={t("emptyDetail")} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-txt-dim">
          {t("count", { count: shots.length })} ·{" "}
          {formatBytes(shots.reduce((sum, s) => sum + s.size, 0))}
        </span>
        <Button size="sm" icon="external" onClick={() => void instanceReveal(slug, "screenshots")}>
          {t("openFolder")}
        </Button>
      </div>

      <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {shots.map((shot) => (
          <li key={shot.rel}>
            <Thumb slug={slug} shot={shot} onOpen={setLightbox} />
            <p className="mt-1 truncate font-mono text-[10px] text-txt-dim">
              {shot.modified ? formatWhen(new Date(shot.modified).toISOString()) : ""}
            </p>
          </li>
        ))}
      </ul>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[var(--scrim)] p-8"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full border border-solid border-line object-contain"
          />
        </div>
      )}
    </div>
  )
}
