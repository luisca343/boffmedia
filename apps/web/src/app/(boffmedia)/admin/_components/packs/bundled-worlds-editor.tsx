"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, toast } from "@boffmedia/ui"
import { type BundledWorld, PacksService } from "@/services/api/boffmedia/packsService"
import { sha512Hex } from "./upload-blob"

export function BundledWorldsEditor({
  value,
  onChange,
}: {
  value: BundledWorld[]
  onChange: (worlds: BundledWorld[]) => void
}) {
  const t = useTranslations("admin.packs")
  const [folder, setFolder] = useState("")
  const [uploading, setUploading] = useState(false)
  const zipInputRef = useRef<HTMLInputElement>(null)

  const folderExists = value.some((w) => w.folder.toLowerCase() === folder.toLowerCase())

  const addWorld = async (file: File | undefined) => {
    if (!file) return
    if (!folder.trim()) {
      toast({ tone: "warn", title: t("worlds.label"), msg: t("worlds.folderRequired") })
      return
    }
    if (folderExists) {
      toast({ tone: "bad", title: t("worlds.label"), msg: t("worlds.duplicateFolder") })
      return
    }

    setUploading(true)
    try {
      // Hash and check if already stored
      const sha512 = await sha512Hex(file)
      const status = await PacksService.blobStatus(sha512)

      let uploadSha512 = sha512
      let size = file.size

      if (!status.success || !status.data?.present) {
        // Upload the file
        const uploadRes = await PacksService.uploadBlob(file)
        if (!uploadRes.success || !uploadRes.data) {
          toast({ tone: "bad", title: t("worlds.label"), msg: uploadRes.userMessage })
          return
        }
        uploadSha512 = uploadRes.data.sha512
        size = uploadRes.data.size
      }

      // Add to worlds list
      const newWorld: BundledWorld = {
        folder: folder.trim(),
        source: {
          kind: 'override',
          blobSha512: uploadSha512,
        },
        sizeBytes: size,
        sha512: uploadSha512,
      }

      onChange([...value, newWorld])
      setFolder("")
      toast({ tone: "ok", title: t("worlds.label"), msg: t("worlds.worldsEdited") })
    } finally {
      setUploading(false)
    }
  }

  const removeWorld = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-txt-dim">{t("worlds.help")}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label={t("worlds.folder")} hint={t("worlds.folderHint")}>
            <Input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder={t("worlds.folderPlaceholder")}
              disabled={uploading}
            />
            {folderExists && (
              <p className="mt-1 text-[11px] text-bad">{t("worlds.duplicateFolder")}</p>
            )}
          </Field>
        </div>
        <Button
          size="sm"
          icon="upload"
          loading={uploading}
          disabled={uploading || !folder.trim() || folderExists || value.length >= 1}
          onClick={() => zipInputRef.current?.click()}
        >
          {t("worlds.upload")}
        </Button>
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          hidden
          onChange={(e) => {
            void addWorld(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </div>

      {value.length > 0 && (
        <div className="bm-scroll max-h-[50vh] flex flex-col gap-2 overflow-auto pr-1">
          {value.map((world, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 border border-solid border-line bg-panel px-3 py-2"
            >
              <Icon name="folder" size={16} className="shrink-0 text-txt-dim" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[12px] font-semibold text-txt">{world.folder}</div>
                <div className="font-mono text-[11px] text-txt-dim">
                  {Math.max(1, Math.round(world.sizeBytes / 1024 / 1024))} MB
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                onClick={() => removeWorld(idx)}
              >
                {t("worlds.remove")}
              </Button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-[12px] text-txt-muted">{t("worlds.none")}</p>
      )}
    </div>
  )
}
