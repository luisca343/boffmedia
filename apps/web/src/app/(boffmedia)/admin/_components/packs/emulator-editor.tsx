"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, FeatureToggle, Field, Icon, Input, Select, Textarea, toast } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { AvPanel, AvPill } from "../ui/av-kit"
import { sha512Hex, uploadOverrideBlob } from "./upload-blob"

export type EmulatorKind = "mgba" | "melonds"

type FileSource =
  | { kind: "user-provided"; hint: string }
  | { kind: "patched"; base: string; patch: string; format: "bps" | "ups" }
  | { kind: "override" | "url"; blobSha512?: string }

interface FileEntry {
  path: string
  sha512: string
  fileSize: number
  source: FileSource
  env?: { client?: string; server?: string }
}

interface EmulatorEditorProps {
  onSave: (data: {
    name: string
    kind: EmulatorKind
    rom: string
    args?: string[]
    files: FileEntry[]
    initialFiles?: FileEntry[]
  }) => void
  previousKind?: EmulatorKind
  initialName?: string
}

/** In-browser SHA-512 hash of a file. */
async function sha512File(file: File): Promise<{ sha512: string; size: number }> {
  const hex = await sha512Hex(file)
  return { sha512: hex, size: file.size }
}

/** Emulator editor for creating/editing emulator pack versions. Handles:
 *  - Emulator kind (mGBA/melonDS) selection
 *  - ROM definer (in-browser hash, user-provided source)
 *  - Romhack support (optional patched source)
 *  - Starting save support (optional, initialFiles)
 *  - Extra user-provided files (BIOS/firmware)
 *  - Advanced args
 */
export function EmulatorEditor({ onSave, previousKind, initialName }: EmulatorEditorProps) {
  const t = useTranslations("admin.packs")

  const [name, setName] = useState(initialName ?? "")
  const [kind, setKind] = useState<EmulatorKind>(previousKind ?? "mgba")
  const [romHint, setRomHint] = useState("")
  const [romFile, setRomFile] = useState<{ file: File; sha512: string; size: number } | null>(null)
  const [romPath, setRomPath] = useState("roms/rom.bin")

  const [useRomhack, setUseRomhack] = useState(false)
  const [baseFile, setBaseFile] = useState<{ file: File; sha512: string; size: number } | null>(null)
  const [patchFile, setPatchFile] = useState<{ file: File; name: string } | null>(null)
  const [patchFormat, setPatchFormat] = useState<"bps" | "ups">("bps")
  const [patchedRomFile, setPatchedRomFile] = useState<{ file: File; sha512: string; size: number } | null>(null)
  const [patchedRomPath, setPatchedRomPath] = useState("roms/rom-patched.bin")

  const [startingSave, setStartingSave] = useState<{ file: File; name: string } | null>(null)
  const [savePath, setSavePath] = useState("roms/save.sav")

  const [extraFiles, setExtraFiles] = useState<Array<{ file: File; sha512: string; size: number; path: string }>>([])
  const [args, setArgs] = useState("")

  const [hashing, setHashing] = useState(false)
  const [busy, setBusy] = useState(false)

  const romInputRef = useRef<HTMLInputElement>(null)
  const baseInputRef = useRef<HTMLInputElement>(null)
  const patchInputRef = useRef<HTMLInputElement>(null)
  const patchedInputRef = useRef<HTMLInputElement>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)

  const handleRomPick = async (file: File | undefined) => {
    if (!file) return
    setHashing(true)
    try {
      const { sha512, size } = await sha512File(file)
      setRomFile({ file, sha512, size })
      setRomPath(`roms/${file.name}`)
    } catch (e) {
      toast({ tone: "bad", title: t("emulator.romHashFailed") })
    } finally {
      setHashing(false)
    }
  }

  const handleBasePick = async (file: File | undefined) => {
    if (!file) return
    setHashing(true)
    try {
      const { sha512, size } = await sha512File(file)
      setBaseFile({ file, sha512, size })
    } catch (e) {
      toast({ tone: "bad", title: t("emulator.romHashFailed") })
    } finally {
      setHashing(false)
    }
  }

  const handlePatchPick = (file: File | undefined) => {
    if (!file) return
    setPatchFile({ file, name: file.name })
  }

  const handlePatchedPick = async (file: File | undefined) => {
    if (!file) return
    setHashing(true)
    try {
      const { sha512, size } = await sha512File(file)
      setPatchedRomFile({ file, sha512, size })
      setPatchedRomPath(`roms/${file.name}`)
    } catch (e) {
      toast({ tone: "bad", title: t("emulator.romHashFailed") })
    } finally {
      setHashing(false)
    }
  }

  const handleSavePick = (file: File | undefined) => {
    if (!file) return
    setSavePath(`roms/${file.name}`)
    setStartingSave({ file, name: file.name })
  }

  const handleExtraFilePick = async (files: FileList | null | undefined) => {
    if (!files) return
    const added: typeof extraFiles = []
    for (const file of Array.from(files)) {
      try {
        const { sha512, size } = await sha512File(file)
        added.push({ file, sha512, size, path: file.name })
      } catch (e) {
        toast({ tone: "bad", title: t("emulator.romHashFailed"), msg: file.name })
      }
    }
    setExtraFiles((current) => [...current, ...added])
  }

  const canSubmit =
    name.trim().length > 0 &&
    romHint.trim().length > 0 &&
    romFile !== null &&
    (!useRomhack || (baseFile !== null && patchFile !== null && patchedRomFile !== null)) &&
    !hashing &&
    !busy

  const submit = async () => {
    if (!canSubmit || !romFile) return
    setBusy(true)
    try {
      const files: FileEntry[] = []
      const initialFiles: FileEntry[] = []

      // Clean ROM (user-provided)
      files.push({
        path: useRomhack ? `roms/${romFile.file.name}` : romPath,
        sha512: romFile.sha512,
        fileSize: romFile.size,
        source: { kind: "user-provided", hint: romHint },
        env: { client: "required", server: "unsupported" },
      })

      if (useRomhack && baseFile && patchFile && patchedRomFile) {
        // Upload patch file
        const patchUpload = await uploadOverrideBlob(patchFile.file, (state) => {
          // Could set progress here
        })
        if (!patchUpload.ok) {
          toast({ tone: "bad", title: t("emulator.patchUploadFailed") })
          return
        }

        // Add base dump (clean)
        files.push({
          path: `roms/${baseFile.file.name}`,
          sha512: baseFile.sha512,
          fileSize: baseFile.size,
          source: { kind: "user-provided", hint: romHint },
          env: { client: "required", server: "unsupported" },
        })

        // Add patch file
        files.push({
          path: `roms/${patchFile.name}`,
          sha512: patchUpload.sha512,
          fileSize: patchUpload.fileSize,
          source: { kind: "override", blobSha512: patchUpload.sha512 },
        })

        // Add patched result
        files.push({
          path: patchedRomPath,
          sha512: patchedRomFile.sha512,
          fileSize: patchedRomFile.size,
          source: {
            kind: "patched",
            base: `roms/${baseFile.file.name}`,
            patch: `roms/${patchFile.name}`,
            format: patchFormat,
          },
          env: { client: "required", server: "unsupported" },
        })
      }

      // Starting save (optional)
      if (startingSave) {
        const saveUpload = await uploadOverrideBlob(startingSave.file, (state) => {
          // Could set progress here
        })
        if (!saveUpload.ok) {
          toast({ tone: "bad", title: t("emulator.saveUploadFailed") })
          return
        }
        initialFiles.push({
          path: savePath,
          sha512: saveUpload.sha512,
          fileSize: saveUpload.fileSize,
          source: { kind: "override", blobSha512: saveUpload.sha512 },
        })
      }

      // Extra user-provided files (BIOS/firmware)
      for (const extra of extraFiles) {
        files.push({
          path: extra.path,
          sha512: extra.sha512,
          fileSize: extra.size,
          source: { kind: "user-provided", hint: t("emulator.biosHint") },
          env: { client: "required", server: "unsupported" },
        })
      }

      onSave({
        name: name.trim(),
        kind,
        rom: useRomhack ? patchedRomPath : romPath,
        args: args.trim().length > 0 ? args.trim().split(/\s+/) : undefined,
        files,
        initialFiles: initialFiles.length > 0 ? initialFiles : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="edit" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
              {t("versionIdentity")}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
              {t("versionIdentityLead")}
            </p>
          </div>
        </div>
        <Field label={t("versionName")} hint={t("versionNameHint")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1.4.2" />
        </Field>
      </section>

      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="gamepad" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.kindSection")}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
              {t("emulator.kindSectionLead")}
            </p>
          </div>
        </div>

        <Field label={t("emulator.kind")}>
          <Select
            value={kind}
            onChange={(v) => setKind(v as EmulatorKind)}
            options={[
              { value: "mgba", label: "mGBA (Game Boy Advance)" },
              { value: "melonds", label: "melonDS (Nintendo DS)" },
            ]}
          />
        </Field>
      </section>

      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="cube" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.romSection")}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
              {t("emulator.romSectionLead")}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <Field label={t("emulator.romHint")} hint={t("emulator.romHintHelp")}>
            <Textarea
              rows={2}
              value={romHint}
              onChange={(e) => setRomHint(e.target.value)}
              placeholder={t("emulator.romHintPlaceholder")}
            />
          </Field>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Field label={t("emulator.romFile")}>
                <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[11px] text-txt-dim truncate">
                  {romFile?.file.name || "No file selected"}
                </div>
              </Field>
            </div>
            <Button
              size="sm"
              icon="upload"
              loading={hashing}
              onClick={() => romInputRef.current?.click()}
            >
              {t("emulator.selectRom")}
            </Button>
            <input
              ref={romInputRef}
              type="file"
              hidden
              onChange={(e) => {
                void handleRomPick(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </div>

          {romFile && (
            <div className="text-[11px] font-mono text-txt-muted">
              {t("emulator.romInfo", {
                size: (romFile.size / (1024 * 1024)).toFixed(1),
                hash: romFile.sha512.slice(0, 16) + "…",
              })}
            </div>
          )}

          <Field label={t("emulator.romPath")}>
            <Input
              value={romPath}
              onChange={(e) => setRomPath(e.target.value)}
              placeholder="roms/emerald.gba"
            />
          </Field>
        </div>
      </section>

      <FeatureToggle
        icon={<Icon name="copy" size={18} />}
        title={t("emulator.romhackToggle")}
        description={t("emulator.romhackToggleLead")}
        on={useRomhack}
        onChange={(on) => setUseRomhack(on)}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label={t("emulator.baseFile")}>
              <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[11px] text-txt-dim truncate">
                {baseFile?.file.name || "No file selected"}
              </div>
            </Field>
          </div>
          <Button
            size="sm"
            icon="upload"
            loading={hashing}
            onClick={() => baseInputRef.current?.click()}
          >
            {t("emulator.selectFile")}
          </Button>
          <input
            ref={baseInputRef}
            type="file"
            hidden
            onChange={(e) => {
              void handleBasePick(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label={t("emulator.patchFile")}>
              <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[11px] text-txt-dim truncate">
                {patchFile?.name || "No file selected"}
              </div>
            </Field>
          </div>
          <Button
            size="sm"
            icon="upload"
            onClick={() => patchInputRef.current?.click()}
          >
            {t("emulator.selectFile")}
          </Button>
          <input
            ref={patchInputRef}
            type="file"
            accept=".bps,.ups"
            hidden
            onChange={(e) => {
              handlePatchPick(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <Field label={t("emulator.patchFormat")}>
          <Select
            value={patchFormat}
            onChange={(v) => setPatchFormat(v as "bps" | "ups")}
            options={[
              { value: "bps", label: "BPS (Binary Patch Set)" },
              { value: "ups", label: "UPS (Universal Patch Script)" },
            ]}
          />
        </Field>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label={t("emulator.patchedFile")}>
              <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[11px] text-txt-dim truncate">
                {patchedRomFile?.file.name || "No file selected"}
              </div>
            </Field>
          </div>
          <Button
            size="sm"
            icon="upload"
            loading={hashing}
            onClick={() => patchedInputRef.current?.click()}
          >
            {t("emulator.selectFile")}
          </Button>
          <input
            ref={patchedInputRef}
            type="file"
            hidden
            onChange={(e) => {
              void handlePatchedPick(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <Field label={t("emulator.patchedPath")}>
          <Input
            value={patchedRomPath}
            onChange={(e) => setPatchedRomPath(e.target.value)}
            placeholder="roms/emerald-hack.gba"
          />
        </Field>
      </FeatureToggle>

      <FeatureToggle
        icon={<Icon name="download" size={18} />}
        title={t("emulator.saveToggle")}
        description={t("emulator.saveToggleLead")}
        on={startingSave !== null}
        onChange={(on) => setStartingSave(on ? { file: new File([], ""), name: "" } : null)}
      >
        {startingSave && startingSave.file.size !== 0 && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <Field label={t("emulator.saveFile")}>
                  <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[11px] text-txt-dim truncate">
                    {startingSave!.name || "No file selected"}
                  </div>
                </Field>
              </div>
              <Button
                size="sm"
                icon="upload"
                onClick={() => saveInputRef.current?.click()}
              >
                {t("emulator.selectFile")}
              </Button>
              <input
                ref={saveInputRef}
                type="file"
                accept=".sav,.save"
                hidden
                onChange={(e) => {
                  handleSavePick(e.target.files?.[0])
                  e.target.value = ""
                }}
              />
            </div>

            <Field label={t("emulator.savePath")}>
              <Input
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
                placeholder="roms/save.sav"
              />
            </Field>
          </>
        )}
      </FeatureToggle>

      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="sliders" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.advancedSection")}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
              {t("emulator.advancedSectionLead")}
            </p>
          </div>
        </div>

        <Field label={t("emulator.args")} hint={t("emulator.argsHint")}>
          <Input
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            placeholder="--fullscreen --skip-bios"
          />
        </Field>
      </section>

      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="gift" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.biosSection")}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
              {t("emulator.biosSectionLead")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="sm"
            variant="ghost"
            icon="plus"
            onClick={() => extraInputRef.current?.click()}
          >
            {t("emulator.addExtraFile")}
          </Button>
          <input
            ref={extraInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              void handleExtraFilePick(e.target.files)
              e.target.value = ""
            }}
          />

          {extraFiles.length > 0 && (
            <ul className="flex flex-col gap-2">
              {extraFiles.map((extra, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 border border-solid border-line bg-panel px-3 py-2"
                >
                  <span className="truncate font-mono text-[11px] text-txt-muted">
                    {extra.path}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-txt-dim">
                    {Math.max(1, Math.round(extra.size / 1024))} KB
                  </span>
                  <button
                    type="button"
                    className="shrink-0 font-mono text-[11px] text-txt-dim hover:text-bad"
                    onClick={() => setExtraFiles((current) => current.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AvPill tone="info" icon="info">
        {t("emulator.reviewNote")}
      </AvPill>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="pri"
          icon="check"
          loading={busy}
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          {t("create")}
        </Button>
      </div>
    </div>
  )
}
