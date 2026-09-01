"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, toast } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { UploadService, type UploadFolder } from "@/services/api/smartrotom/uploadService"
import { ImageCropDialog, type CropShape } from "./ImageCropDialog"

const OK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const OK_IMAGE_LABEL = "JPG, PNG, WebP, GIF"
const MAX_IMAGE_MB = 5

export interface ImageUploadFieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  /** Current image URL — an uploaded `/uploads/...` path or an external one. */
  value: string
  onChange: (url: string) => void
  /** Uploads subdirectory, e.g. `events` or `games`. */
  folder: UploadFolder
  /** Crop ratio offered before upload. Omit to upload the file untouched. */
  cropAspect?: number
  /** Preview ratio — defaults to `cropAspect`, or a square. */
  previewAspect?: number
  /** `seal` for avatar/crest art, matching how the real surface clips it. */
  shape?: CropShape
  disabled?: boolean
  placeholder?: string
}

/**
 * Hybrid image input: upload a file (optionally cropped) or paste a URL.
 *
 * `Field` clones its child to attach the label/aria wiring and that only lands on
 * a DOM element, so the label lives on the inner `Input` here rather than being
 * applied by the caller wrapping this component in a `Field`.
 */
export function ImageUploadField({
  label,
  hint,
  error,
  value,
  onChange,
  folder,
  cropAspect,
  previewAspect,
  shape = "square",
  disabled,
  placeholder = "https://…",
}: ImageUploadFieldProps) {
  const t = useTranslations("common.imageUpload")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [pending, setPending] = React.useState<{ file: File; src: string } | null>(null)

  // The object URL outlives the change event, so it is revoked when the crop step
  // ends rather than in the handler that created it.
  const clearPending = React.useCallback(() => {
    setPending((prev) => {
      if (prev) URL.revokeObjectURL(prev.src)
      return null
    })
  }, [])

  React.useEffect(() => clearPending, [clearPending])

  function validate(file: File): string | null {
    if (!OK_IMAGE_TYPES.includes(file.type)) return t("invalidFileType", { types: OK_IMAGE_LABEL })
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return t("fileTooLarge", { maxSize: MAX_IMAGE_MB })
    return null
  }

  async function upload(file: File) {
    setUploading(true)
    try {
      const res = await UploadService.uploadContentImage(file, folder)
      const url = res.data?.url
      if (!url) {
        toast.error(t("uploadError"))
        return
      }
      onChange(url)
      toast.success(t("uploaded"))
    } catch {
      toast.error(t("uploadError"))
    } finally {
      setUploading(false)
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (inputRef.current) inputRef.current.value = ""
    if (!file) return
    const invalid = validate(file)
    if (invalid) {
      toast.error(invalid)
      return
    }
    if (cropAspect) {
      setPending({ file, src: URL.createObjectURL(file) })
      return
    }
    void upload(file)
  }

  const ratio = previewAspect ?? cropAspect ?? 1

  return (
    <>
      <Field label={label} hint={hint} error={error}>
        <div className="grid gap-2.5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "relative w-24 flex-none overflow-hidden border border-solid border-line bg-base-2",
                shape === "seal" && "cut-seal cut-seal-edge [--cut:11px] [--cut-line:var(--line)]",
              )}
              style={{ aspectRatio: String(ratio) }}
            >
              {value ? (
                /* A thumbnail of an arbitrary admin-supplied URL: next/image throws
                   on a host outside images.remotePatterns. */
                <img src={value} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-txt-dim">
                  <Icon name="camera" size={20} />
                </div>
              )}
            </div>

            <div className="grid flex-1 gap-2">
              {/* Named here rather than by `Field`: its clone lands on the wrapper
                  div above, which would leave this input announced as unnamed. */}
              <Input
                aria-label={typeof label === "string" ? label : undefined}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || uploading}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="upload"
                  loading={uploading}
                  disabled={disabled || uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  {t("upload")}
                </Button>
                {value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon="trash"
                    disabled={disabled || uploading}
                    onClick={() => onChange("")}
                  >
                    {t("remove")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>
      </Field>

      <ImageCropDialog
        open={Boolean(pending)}
        src={pending?.src ?? null}
        file={pending?.file ?? null}
        aspect={cropAspect ?? 1}
        shape={shape}
        busy={uploading}
        onCancel={clearPending}
        onConfirm={async (file) => {
          clearPending()
          await upload(file)
        }}
      />
    </>
  )
}
