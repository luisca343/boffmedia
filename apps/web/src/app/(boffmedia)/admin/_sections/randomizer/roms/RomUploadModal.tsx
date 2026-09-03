"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Modal, Select, Spinner, toast } from "@boffmedia/ui"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerRom } from "@/services/api/boffmedia/randomizer.types"

interface RomUploadModalProps {
  open: boolean
  onClose: () => void
  onUploaded: (rom: RandomizerRom) => void
  defaultPlatform?: "gba" | "nds"
}

export function RomUploadModal({
  open,
  onClose,
  onUploaded,
  defaultPlatform = "gba",
}: RomUploadModalProps) {
  const t = useTranslations("randomizer.events")
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState<"gba" | "nds">(defaultPlatform)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Reset per open so a reopened modal never carries a stale file reference.
  useEffect(() => {
    if (open) {
      setName("")
      setFile(null)
      setPlatform(defaultPlatform)
    }
  }, [open, defaultPlatform])

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast({ tone: "bad", title: t("romsUploadError"), msg: t("romsUploadInvalid") })
      return
    }

    setUploading(true)
    try {
      const res = await RandomizerService.uploadRom(file, name, platform)
      if (res.success && res.data) {
        toast({ tone: "ok", title: t("romsUploadSuccess") })
        onUploaded(res.data)
      } else {
        toast({ tone: "bad", title: t("romsUploadError"), msg: res.userMessage })
      }
    } catch (err) {
      toast({ tone: "bad", title: t("romsUploadError"), msg: String(err) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !uploading && onClose()}
      title={t("romsUploadTitle")}
      size="sm"
    >
      <div className="space-y-4">
        <Field label={t("romsName")}>
          <Input
            placeholder={t("romsNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            disabled={uploading}
          />
        </Field>

        <Field label={t("romsPlatform")}>
          <Select
            value={platform}
            options={[
              { value: "gba", label: "GBA" },
              { value: "nds", label: "NDS" },
            ]}
            onChange={(v) => setPlatform(v as "gba" | "nds")}
            disabled={uploading}
          />
        </Field>

        <Field label={t("romsFile")}>
          <input
            type="file"
            accept=".gba,.nds,.rom,.bin"
            onChange={(e) => setFile(e.currentTarget.files?.[0] || null)}
            disabled={uploading}
            className="block w-full text-[0.75rem]"
          />
        </Field>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !name.trim()}
          >
            {uploading && <Spinner size={16} />}
            {uploading ? t("romsUploading") : t("romsUploadButton")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => !uploading && onClose()}
            disabled={uploading}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
