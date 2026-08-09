"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Input, Modal, Select, Spinner, toast } from "@boffmedia/ui"
import { AvPanel, AvSectionHead } from "../../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerRom } from "@/services/api/boffmedia/randomizer.types"

export function RomsView() {
  const t = useTranslations("randomizer.events")
  const [roms, setRoms] = useState<RandomizerRom[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [romToDelete, setRomToDelete] = useState<RandomizerRom | null>(null)

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadName, setUploadName] = useState("")
  const [uploadPlatform, setUploadPlatform] = useState<"gba" | "nds">("gba")
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  useEffect(() => {
    loadRoms()
  }, [])

  const loadRoms = async () => {
    setLoading(true)
    try {
      const res = await RandomizerService.listRoms()
      setRoms(res.success ? res.data || [] : [])
    } catch (err) {
      toast({ tone: "bad", title: t("romsLoadError"), msg: String(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) {
      toast({ tone: "bad", title: t("romsUploadError"), msg: t("romsUploadInvalid") })
      return
    }

    setUploading(true)
    try {
      const res = await RandomizerService.uploadRom(uploadFile, uploadName, uploadPlatform)
      if (res.success) {
        toast({ tone: "ok", title: t("romsUploadSuccess") })
        setShowUploadForm(false)
        setUploadName("")
        setUploadFile(null)
        await loadRoms()
      } else {
        toast({ tone: "bad", title: t("romsUploadError"), msg: res.userMessage })
      }
    } catch (err) {
      toast({ tone: "bad", title: t("romsUploadError"), msg: String(err) })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (romId: number) => {
    setRomToDelete(null)
    setDeleting(romId)
    try {
      const res = await RandomizerService.deleteRom(romId)
      if (res.success) {
        toast({ tone: "ok", title: t("romsDeleteSuccess") })
        await loadRoms()
      } else {
        toast({ tone: "bad", title: t("romsDeleteError"), msg: res.userMessage })
      }
    } catch (err) {
      toast({ tone: "bad", title: t("romsDeleteError"), msg: String(err) })
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const truncateSha512 = (sha512: string): string => sha512.substring(0, 16) + "…"

  return (
    <div className="space-y-5">
      <AvSectionHead
        title={t("romsTab")}
        desc={t("romsDesc")}
        actions={
          <Button
            onClick={() => setShowUploadForm(true)}
            variant="pri"
            size="sm"
          >
            {t("romsUploadButton")}
          </Button>
        }
      />

      {loading ? (
        <AvPanel>
          <div className="flex items-center justify-center py-8 gap-2">
            <Spinner />
            <span className="text-txt-muted">{t("romsLoading")}</span>
          </div>
        </AvPanel>
      ) : roms.length === 0 ? (
        <AvPanel>
          <div className="text-center py-8">
            <p className="text-txt-muted">{t("romsEmpty")}</p>
          </div>
        </AvPanel>
      ) : (
        <AvPanel>
          <div className="space-y-2">
            {roms.map((rom) => (
              <div
                key={rom.id}
                className="flex items-center justify-between p-3 bg-panel-2 rounded border border-solid border-line hover:border-line-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-txt-primary">{rom.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-txt-muted font-mono">
                    <span className="uppercase font-bold">{rom.gamePlatform}</span>
                    <span>{truncateSha512(rom.sha512)}</span>
                    <span className="text-line-2">·</span>
                    <span>{formatFileSize(rom.fileSize)}</span>
                    <span className="text-line-2">·</span>
                    <span>{t("romsReferencedBy", { count: rom.referencedBy })}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  onClick={() => setRomToDelete(rom)}
                  disabled={deleting === rom.id}
                  title={t("romsDeleteTooltip")}
                />
              </div>
            ))}
          </div>
        </AvPanel>
      )}

      {/* Upload Form Modal */}
      <Modal
        open={showUploadForm}
        onClose={() => !uploading && setShowUploadForm(false)}
        title={t("romsUploadTitle")}
        size="sm"
      >
        <div className="space-y-4">
          <Field label={t("romsName")}>
            <Input
              placeholder={t("romsNamePlaceholder")}
              value={uploadName}
              onChange={(e) => setUploadName(e.currentTarget.value)}
              disabled={uploading}
            />
          </Field>

          <Field label={t("romsPlatform")}>
            <Select
              value={uploadPlatform}
              options={[
                { value: "gba", label: "GBA" },
                { value: "nds", label: "NDS" },
              ]}
              onChange={(v) => setUploadPlatform(v as "gba" | "nds")}
              disabled={uploading}
            />
          </Field>

          <Field label={t("romsFile")}>
            <input
              type="file"
              accept=".gba,.nds,.rom,.bin"
              onChange={(e) => setUploadFile(e.currentTarget.files?.[0] || null)}
              disabled={uploading}
              className="block w-full text-[12px]"
            />
          </Field>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadName.trim()}
            >
              {uploading && <Spinner size={16} />}
              {uploading ? t("romsUploading") : t("romsUploadButton")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => !uploading && setShowUploadForm(false)}
              disabled={uploading}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={romToDelete !== null}
        onClose={() => !deleting && setRomToDelete(null)}
        size="sm"
        title={t("romsDeleteConfirmTitle")}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRomToDelete(null)}
              disabled={deleting !== null}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => romToDelete && handleDelete(romToDelete.id)}
              disabled={deleting !== null}
            >
              {t("delete")}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-txt-muted">
          {romToDelete && (
            <>
              {romToDelete.referencedBy > 0 ? (
                t("romsDeleteReferencedWarning", { name: romToDelete.name, count: romToDelete.referencedBy })
              ) : (
                t("romsDeleteConfirmMsg", { name: romToDelete.name })
              )}
            </>
          )}
        </p>
      </Modal>
    </div>
  )
}
