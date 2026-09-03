"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, Modal, Select, Spinner, toast } from "@boffmedia/ui"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerPreset } from "@/services/api/boffmedia/randomizer.types"

/**
 * Direct, event-less randomization: upload a ROM, run it against a stored preset
 * on the server, and download the randomized result.
 */
export function QuickRandomizeModal({
  preset,
  initialSeed,
  onClose,
}: {
  preset: RandomizerPreset
  initialSeed?: string
  onClose: () => void
}) {
  const t = useTranslations("randomizer.quick")
  const [platform, setPlatform] = useState<"gba" | "nds">("gba")
  const [seed, setSeed] = useState(initialSeed ?? "")
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
    <Modal
      open
      onClose={() => !running && onClose()}
      size="sm"
      title={t("title")}
      aside={<span className="font-mono text-[0.6875rem] text-txt-muted truncate">{preset.name}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={running}>
            {t("cancel")}
          </Button>
          <Button variant="pri" icon={running ? undefined : "play"} onClick={handleRun} disabled={running || !file}>
            {running && <Spinner size={16} />}
            {running ? t("running") : t("run")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={pickFile}
          disabled={running}
          className="w-full flex flex-col items-center gap-2 py-6 px-4 border-2 border-dashed border-line hover:border-accent hover:bg-panel-2 transition-colors disabled:opacity-50 cursor-pointer bg-transparent"
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
      </div>
    </Modal>
  )
}
