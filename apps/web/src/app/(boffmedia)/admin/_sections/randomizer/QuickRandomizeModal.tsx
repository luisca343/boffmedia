"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, Select, Spinner, toast } from "@boffmedia/ui"
import { AvPanel } from "../../_components/ui/av-kit"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerPreset } from "@/services/api/boffmedia/randomizer.types"

/**
 * Direct, event-less randomization: upload a ROM, run it against a stored preset
 * on the server, and download the randomized result.
 */
export function QuickRandomizeModal({
  preset,
  onClose,
}: {
  preset: RandomizerPreset
  onClose: () => void
}) {
  const t = useTranslations("randomizer.quick")
  const [platform, setPlatform] = useState<"gba" | "nds">("gba")
  const [seed, setSeed] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)

  const pickFile = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".gba,.nds"
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) {
        setFile(f)
        if (f.name.toLowerCase().endsWith(".nds")) setPlatform("nds")
        else if (f.name.toLowerCase().endsWith(".gba")) setPlatform("gba")
      }
    }
    input.click()
  }

  const handleRun = async () => {
    if (!file) {
      toast({ tone: "bad", title: t("selectRom") })
      return
    }
    setRunning(true)
    try {
      const blob = await RandomizerService.quickRandomize(
        preset.id,
        platform,
        file,
        seed.trim() ? Number(seed.trim()) : undefined,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `randomized-${preset.name}.${platform}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ tone: "ok", title: t("done") })
      onClose()
    } catch (err) {
      toast({ tone: "bad", title: t("error"), msg: String(err) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <AvPanel className="max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{t("title")}</h3>
            <p className="text-xs text-txt-muted">{preset.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            className="text-txt-dim hover:text-txt disabled:opacity-50"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={pickFile}
            disabled={running}
            className="w-full flex flex-col items-center gap-2 py-6 px-4 rounded border-2 border-dashed border-line hover:border-accent hover:bg-panel-2 transition-colors disabled:opacity-50"
          >
            <Icon name="upload" size={22} className="text-txt-muted" />
            <p className="text-sm text-txt-muted">
              {file ? file.name : t("dropZone")}
            </p>
          </button>

          <Select
            label={t("platform")}
            value={platform}
            options={[
              { value: "gba", label: "GBA" },
              { value: "nds", label: "NDS" },
            ]}
            disabled={running}
            onChange={(v) => setPlatform(v as "gba" | "nds")}
          />

          <Field label={t("seed")} hint={t("seedHint")}>
            <Input
              placeholder={t("seedPlaceholder")}
              value={seed}
              disabled={running}
              onChange={(e) => setSeed(e.currentTarget.value)}
            />
          </Field>

          <div className="flex gap-3 pt-1">
            <Button onClick={handleRun} disabled={running || !file} className="flex-1">
              {running && <Spinner size={16} />}
              {running ? t("running") : t("run")}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={running}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      </AvPanel>
    </div>
  )
}
