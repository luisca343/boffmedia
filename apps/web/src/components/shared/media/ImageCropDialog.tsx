"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Modal, Slider } from "@boffmedia/ui"
import { cn } from "@/lib/utils"

/**
 * The output type is derived from the source rather than fixed, because the API
 * sniffs the uploaded bytes and rejects a file whose extension disagrees with
 * them (`assertImageContent` in upload.controller.ts). PNG keeps transparency;
 * everything else (GIF included — a crop is a single frame anyway) becomes JPEG.
 */
function outputTypeFor(sourceType: string): { mime: string; ext: string } {
  if (sourceType === "image/png") return { mime: "image/png", ext: "png" }
  if (sourceType === "image/webp") return { mime: "image/webp", ext: "webp" }
  return { mime: "image/jpeg", ext: "jpg" }
}

export interface ImageCropDialogProps {
  open: boolean
  /** Object URL (or any same-origin/data URL) of the image being cropped. */
  src: string | null
  /** Original file — its name and type seed the cropped file's own. */
  file?: File | null
  /** Width / height of the crop frame. 1 = square, 3 = a 3:1 banner. */
  aspect?: number
  /**
   * Frame silhouette. `seal` is the chamfered TL/BR `.cut-seal` this design
   * system uses for avatars and crests — there are no circular images on
   * Boffmedia. Visual only: the produced image is still the full rectangle.
   */
  shape?: CropShape
  title?: React.ReactNode
  confirmLabel?: string
  /** Longest edge of the produced image. Bigger crops are downscaled to it. */
  maxSize?: number
  busy?: boolean
  onCancel: () => void
  onConfirm: (file: File) => void
}

export type CropShape = "square" | "seal"

/** Frame height cap, so a 1:1 crop does not push the buttons off a laptop screen. */
const MAX_FRAME_H = 360
const MAX_ZOOM = 4
/** ProfileHero cuts a 136px avatar by 16px; the chamfer scales with the box. */
const SEAL_CUT_RATIO = 0.12

/**
 * Pan/zoom crop modal (Twitter/Discord style), canvas-based and dependency-free.
 *
 * The image is always at least as large as the frame — `baseScale` covers it and
 * the offsets are clamped to its edges — so the exported crop can never contain
 * transparent gutters, whatever the source aspect ratio.
 */
export function ImageCropDialog({
  open,
  src,
  file,
  aspect = 1,
  shape = "square",
  title,
  confirmLabel,
  maxSize = 1024,
  busy,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const t = useTranslations("common.imageCrop")
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const [wrapW, setWrapW] = React.useState(0)
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const [working, setWorking] = React.useState(false)

  // Frame geometry. Width follows the modal; height is derived from the aspect and
  // capped, in which case the width shrinks with it so the ratio still holds.
  const frame = React.useMemo(() => {
    if (!wrapW) return { w: 0, h: 0 }
    let w = wrapW
    let h = w / aspect
    if (h > MAX_FRAME_H) {
      h = MAX_FRAME_H
      w = h * aspect
    }
    return { w, h }
  }, [wrapW, aspect])

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el || !open) return
    const measure = () => setWrapW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // A new source starts from scratch — otherwise the previous image's pan is
  // applied to a picture of a different size and lands somewhere arbitrary.
  React.useEffect(() => {
    setNatural(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [src])

  const baseScale =
    natural && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 1
  const scale = baseScale * zoom
  const disp = natural ? { w: natural.w * scale, h: natural.h * scale } : { w: 0, h: 0 }
  const maxOffX = Math.max(0, (disp.w - frame.w) / 2)
  const maxOffY = Math.max(0, (disp.h - frame.h) / 2)

  const clamp = (next: { x: number; y: number }, lx: number, ly: number) => ({
    x: Math.min(lx, Math.max(-lx, next.x)),
    y: Math.min(ly, Math.max(-ly, next.y)),
  })

  // Zooming out shrinks the allowed pan range, so the current offset has to be
  // pulled back inside it or the frame shows past the edge of the image.
  React.useEffect(() => {
    setOffset((prev) => clamp(prev, maxOffX, maxOffY))
  }, [maxOffX, maxOffY])

  const drag = React.useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    if (!natural) return
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setOffset(clamp({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }, maxOffX, maxOffY))
  }

  function endDrag(e: React.PointerEvent) {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  // React attaches `onWheel` passively at the root, so preventDefault there is
  // ignored and the page scrolls behind the modal. A native listener is the only
  // way to keep the wheel on the zoom.
  React.useEffect(() => {
    const el = frameRef.current
    if (!el || !open) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [open])

  async function handleConfirm() {
    const img = imgRef.current
    if (!img || !natural || !frame.w) return
    setWorking(true)
    try {
      // Frame edges expressed in the source image's own pixels.
      const cropW = frame.w / scale
      const cropH = frame.h / scale
      const left = natural.w / 2 - offset.x / scale - cropW / 2
      const top = natural.h / 2 - offset.y / scale - cropH / 2

      const ratio = Math.min(1, maxSize / Math.max(cropW, cropH))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(cropW * ratio))
      canvas.height = Math.max(1, Math.round(cropH * ratio))
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("no 2d context")
      ctx.drawImage(img, left, top, cropW, cropH, 0, 0, canvas.width, canvas.height)

      const { mime, ext } = outputTypeFor(file?.type ?? "")
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.92),
      )
      if (!blob) throw new Error("toBlob returned null")

      const stem = (file?.name ?? "image").replace(/\.[^.]+$/, "") || "image"
      onConfirm(new File([blob], `${stem}.${ext}`, { type: blob.type || mime }))
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      /* A wide crop in the default 580px modal is only ~145px tall at 4:1 — too
         small to frame anything, so banner ratios get the large panel. */
      size={aspect > 1.5 ? "lg" : undefined}
      title={title ?? t("title")}
      footer={
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy || working}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="pri"
            onClick={handleConfirm}
            loading={busy || working}
            disabled={!natural || busy || working}
          >
            {confirmLabel ?? t("apply")}
          </Button>
        </div>
      }
    >
      <div ref={wrapRef} className="grid gap-3.5">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            "relative mx-auto touch-none select-none overflow-hidden border border-solid border-line bg-base-2",
            natural ? "cursor-grab active:cursor-grabbing" : "cursor-default",
            shape === "seal" && "cut-seal cut-seal-edge [--cut-line:var(--line)]",
          )}
          style={{
            width: frame.w || undefined,
            height: frame.h || undefined,
            // The chamfer is a length, not a percentage: `--cut` feeds both the x
            // and the y coordinate of the clip polygon, so a percentage would cut
            // a different amount off each axis on any non-square frame.
            ...(shape === "seal" && {
              "--cut": `${Math.round(Math.min(frame.w, frame.h) * SEAL_CUT_RATIO)}px`,
            }),
          } as React.CSSProperties}
        >
          {src && (
            /* An object URL of a local file: next/image would only add a loader
               round-trip, and it cannot read a blob: source anyway. */
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNatural({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              className="absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: disp.w || undefined,
                height: disp.h || undefined,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          {!natural && (
            <div className="absolute inset-0 grid place-items-center text-txt-dim">
              <Icon name="camera" size={32} />
            </div>
          )}
        </div>

        <Slider
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={setZoom}
          label={t("zoom")}
          ariaLabel={t("zoom")}
          disabled={!natural}
        />

        <p className="text-center font-mono text-[11px] uppercase tracking-[0.12em] text-txt-dim">
          {t("hint")}
        </p>
      </div>
    </Modal>
  )
}
