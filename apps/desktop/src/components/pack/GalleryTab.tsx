import { useEffect, useRef, useState } from "react"

import { Button, Empty, Spinner, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import type { PackGalleryImage } from "../../services/types"
import {
  iconSrc,
  localPackGalleryAdd,
  localPackGalleryImage,
  localPackGalleryList,
  localPackGalleryRemove,
} from "../../runtime"

// The pack's promotional gallery — images a player browses BEFORE installing,
// distinct from the per-instance ScreenshotsTab (which reads screenshots the
// game itself wrote). A managed pack's gallery is a list of registry URLs; a
// local pack's is a convention dir on disk this tab can add to and remove from.

function GalleryThumb({
  managed,
  slug,
  source,
  onOpen,
  onRemove,
}: {
  managed: boolean
  slug: string
  /** A registry URL for a managed pack, or an on-disk filename for a local one. */
  source: string
  onOpen: (src: string) => void
  onRemove?: () => void
}) {
  const t = useT("packDetail")
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
        const load = managed ? iconSrc(source) : localPackGalleryImage(slug, source)
        void load.then((url) => {
          if (alive && url) setSrc(url)
        })
      },
      { rootMargin: "200px" },
    )
    io.observe(node)
    return () => {
      alive = false
      io.disconnect()
    }
  }, [managed, slug, source])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => src && onOpen(src)}
      className="group relative flex flex-col overflow-hidden border border-solid border-line bg-panel"
    >
      <span className="grid aspect-video w-full place-items-center overflow-hidden bg-base-deep">
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <Spinner size={14} />
        )}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute right-1 top-1 rounded bg-bad px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          {t("galleryRemoveButton")}
        </button>
      )}
    </button>
  )
}

export function GalleryTab({
  slug,
  isLocal,
  managedGallery,
  contentNonce,
}: {
  slug: string
  isLocal: boolean
  /** The registry gallery for a managed pack; ignored for a local one. */
  managedGallery: PackGalleryImage[]
  /** Bumped by the parent to force a re-read after an edit elsewhere. */
  contentNonce: number
}) {
  const t = useT("packDetail")
  // For a local pack these are on-disk filenames; for a managed one, URLs.
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    if (!isLocal) {
      setItems(managedGallery.map((g) => g.url))
      setLoading(false)
      return
    }
    setLoading(true)
    void localPackGalleryList(slug).then((list) => {
      if (!live) return
      setItems(list)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [slug, isLocal, managedGallery, contentNonce])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox])

  const addImage = async () => {
    setBusy(true)
    try {
      const filename = await localPackGalleryAdd(slug)
      if (!filename) return // cancelled
      setItems((prev) => [...prev, filename].sort())
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("galleryAddError"))
    } finally {
      setBusy(false)
    }
  }

  const removeImage = async (filename: string) => {
    try {
      await localPackGalleryRemove(slug, filename)
      setItems((prev) => prev.filter((f) => f !== filename))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("galleryClearError"))
    }
  }

  const addButton = isLocal ? (
    <Button size="sm" icon="plus" loading={busy} onClick={() => void addImage()}>
      {t("galleryAddButton")}
    </Button>
  ) : null

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[11px] text-txt-dim">
        <Spinner size={12} /> {t("reading")}
      </span>
    )
  }

  if (items.length === 0) {
    return (
      <Empty icon="camera" title={t("galleryEmpty")} lead={t("galleryEmptyDetail")}>
        {addButton}
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-txt-dim">
          {t("galleryCount", { count: items.length })}
        </span>
        {addButton}
      </div>

      <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        {items.map((item) => (
          <li key={item}>
            <GalleryThumb
              managed={!isLocal}
              slug={slug}
              source={item}
              onOpen={setLightbox}
              onRemove={isLocal ? () => void removeImage(item) : undefined}
            />
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
