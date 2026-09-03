"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, FeatureToggle, Field, Icon, Input, Select, Textarea, toast } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { AvPanel, AvPill } from "../ui/av-kit"
import { sha512Hex, uploadOverrideBlob } from "./upload-blob"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import type { RandomizerRom } from "@/services/api/boffmedia/randomizer.types"

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

/** The emulator arm's steps. Deliberately the same shape as the Minecraft
 *  arm's: an emulator pack is a first-class pack, not a special case that skips
 *  the wizard, and an author who has cut one kind of version should recognise
 *  the other. */
export const EMULATOR_STEPS = ["metadata", "rom", "files", "review"] as const
export type EmulatorStep = (typeof EMULATOR_STEPS)[number]

/** Scalar prefill for clone/edit. The ROM and any user-provided binaries are
 *  never stored on our side, so a clone can only restore the metadata and paths
 *  — the author re-selects the files. Freeze this at mount: the parent remounts
 *  the editor (via `key`) once the async prefill lands. */
export interface EmulatorInitial {
  name: string
  kind: EmulatorKind
  romHint: string
  romPath: string
  args: string
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
  /** Prefill for clone/edit; overrides `initialName`/`previousKind`. */
  initial?: EmulatorInitial
  /** Which step to render. The rail and the Back/Next bar live in the parent so
   *  both arms of the editor share one chrome. */
  step: EmulatorStep
  /** Reports which steps are currently satisfied, so the parent can gate Next
   *  and the rail without duplicating the rules. */
  onValidity?: (valid: Record<EmulatorStep, boolean>) => void
  /** Called on the review step's confirm; the parent owns the button. */
  submitRef?: React.MutableRefObject<(() => void) | null>
}

/** In-browser SHA-512 hash of a file. */
async function sha512File(file: File): Promise<{ sha512: string; size: number }> {
  const hex = await sha512Hex(file)
  return { sha512: hex, size: file.size }
}

const ROM_EXT: Record<EmulatorKind, string> = { mgba: "gba", melonds: "nds" }
/** Which library platform an emulator can run. The randomizer ROM library is
 *  keyed by platform, not by emulator. */
const ROM_PLATFORM: Record<EmulatorKind, RandomizerRom["gamePlatform"]> = {
  mgba: "gba",
  melonds: "nds",
}
const defaultRomPath = (kind: EmulatorKind) => `roms/rom.${ROM_EXT[kind]}`
const defaultPatchedPath = (kind: EmulatorKind) => `roms/rom-patched.${ROM_EXT[kind]}`

// The schema caps args at 32 items of 256 chars; enforcing them here turns a
// server 400 into an inline error. Quotes let a single arg carry spaces.
const MAX_ARGS = 32
const MAX_ARG_LENGTH = 256

function tokenizeArgs(input: string): { tokens: string[]; unterminated: boolean } {
  const tokens: string[] = []
  let current = ""
  let quote: '"' | "'" | null = null
  let started = false
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      started = true
    } else if (/\s/.test(ch)) {
      if (started || current) {
        tokens.push(current)
        current = ""
        started = false
      }
    } else {
      current += ch
    }
  }
  if (started || current) tokens.push(current)
  return { tokens, unterminated: quote !== null }
}

/** Emulator editor for creating/editing emulator pack versions. Handles:
 *  - Emulator kind (mGBA/melonDS) selection
 *  - ROM definer (in-browser hash, user-provided source)
 *  - Romhack support (optional patched source)
 *  - Starting save support (optional, initialFiles)
 *  - Extra user-provided files (BIOS/firmware)
 *  - Advanced args
 */
export function EmulatorEditor({
  onSave,
  previousKind,
  initialName,
  initial,
  step,
  onValidity,
  submitRef,
}: EmulatorEditorProps) {
  const t = useTranslations("admin.packs")

  const initialKind = initial?.kind ?? previousKind ?? "mgba"
  const [name, setName] = useState(initial?.name ?? initialName ?? "")
  const [kind, setKind] = useState<EmulatorKind>(initialKind)
  const [romHint, setRomHint] = useState(initial?.romHint ?? "")
  const [romFile, setRomFile] = useState<{ file: File; sha512: string; size: number } | null>(null)
  const [romPath, setRomPath] = useState(initial?.romPath ?? defaultRomPath(initialKind))

  // Where the clean ROM's IDENTITY comes from. The bytes are never uploaded
  // either way — only the expected sha512 is authored here.
  //
  // "library" is the default and exists because of a real failure: a randomizer
  // event pins a clean ROM from the library, and the API refuses every claim
  // unless the pack's published ROM hash is byte-identical to it. Hashing a
  // local dump means matching that by luck, and the mismatch only surfaces
  // later, to players, as "la ROM del pack publicado no coincide".
  const [romSource, setRomSource] = useState<"library" | "file">("library")
  const [libraryRoms, setLibraryRoms] = useState<RandomizerRom[]>([])
  const [libraryRomId, setLibraryRomId] = useState("")
  const [loadingLibrary, setLoadingLibrary] = useState(false)

  const [useRomhack, setUseRomhack] = useState(false)
  const [baseFile, setBaseFile] = useState<{ file: File; sha512: string; size: number } | null>(null)
  const [patchFile, setPatchFile] = useState<{ file: File; name: string } | null>(null)
  const [patchFormat, setPatchFormat] = useState<"bps" | "ups">("bps")
  const [patchedRomFile, setPatchedRomFile] = useState<{ file: File; sha512: string; size: number } | null>(null)
  const [patchedRomPath, setPatchedRomPath] = useState(defaultPatchedPath(initialKind))

  const [startingSave, setStartingSave] = useState<{ file: File; name: string } | null>(null)
  const [savePath, setSavePath] = useState("roms/save.sav")

  const [extraFiles, setExtraFiles] = useState<
    Array<{ file: File; sha512: string; size: number; path: string; required: boolean }>
  >([])
  const [args, setArgs] = useState(initial?.args ?? "")

  const romsForPlatform = libraryRoms.filter((r) => r.gamePlatform === ROM_PLATFORM[kind])
  const selectedLibraryRom = libraryRoms.find((r) => String(r.id) === libraryRomId) ?? null

  /** The clean ROM the manifest will declare, whichever source authored it.
   *  Everything downstream reads this and nothing else, so adding a third
   *  source later touches one place. */
  const romSpec: { sha512: string; size: number; label: string } | null =
    romSource === "library"
      ? selectedLibraryRom
        ? {
            sha512: selectedLibraryRom.sha512,
            size: selectedLibraryRom.fileSize,
            label: selectedLibraryRom.name,
          }
        : null
      : romFile
        ? { sha512: romFile.sha512, size: romFile.size, label: romFile.file.name }
        : null

  /** Re-derive the untouched path defaults when the emulator changes, so a
   *  melonDS pack does not ship a `.gba` path the author never looked at. */
  const changeKind = (next: EmulatorKind) => {
    if (next !== kind) {
      setRomPath((p) => (p === defaultRomPath(kind) ? defaultRomPath(next) : p))
      setPatchedRomPath((p) => (p === defaultPatchedPath(kind) ? defaultPatchedPath(next) : p))
      // A library ROM for the previous platform cannot run on the new emulator.
      setLibraryRomId((id) => {
        const rom = libraryRoms.find((r) => String(r.id) === id)
        return rom && rom.gamePlatform !== ROM_PLATFORM[next] ? "" : id
      })
    }
    setKind(next)
  }

  // Loaded once the ROM step is actually reached: the wizard mounts on step 1
  // and most sessions never touch a library that costs a round trip to list.
  useEffect(() => {
    if (step !== "rom" || romSource !== "library" || libraryRoms.length > 0 || loadingLibrary) {
      return
    }
    let cancelled = false
    setLoadingLibrary(true)
    RandomizerService.listRoms()
      .then((res) => {
        if (cancelled) return
        setLibraryRoms(res.success && res.data ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) toast({ tone: "bad", title: t("emulator.romLibraryError") })
      })
      .finally(() => {
        if (!cancelled) setLoadingLibrary(false)
      })
    return () => {
      cancelled = true
    }
  }, [step, romSource])

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
        added.push({ file, sha512, size, path: `bios/${file.name}`, required: true })
      } catch (e) {
        toast({ tone: "bad", title: t("emulator.romHashFailed"), msg: file.name })
      }
    }
    setExtraFiles((current) => [...current, ...added])
  }

  const parsedArgs = tokenizeArgs(args)
  const argsError = parsedArgs.unterminated
    ? t("emulator.argsUnterminated")
    : parsedArgs.tokens.length > MAX_ARGS
      ? t("emulator.argsTooMany", { max: MAX_ARGS })
      : parsedArgs.tokens.some((a) => a.length > MAX_ARG_LENGTH)
        ? t("emulator.argsTooLong", { max: MAX_ARG_LENGTH })
        : null

  // Split by step so the rail can show how far the form actually is, rather
  // than one all-or-nothing flag on a single long page.
  const stepValidity: Record<EmulatorStep, boolean> = {
    metadata: name.trim().length > 0,
    // In romhack mode the base dump IS the clean ROM — there is no separate
    // clean-ROM entry, so the standalone picker plays no part in validity.
    rom:
      romHint.trim().length > 0 &&
      (useRomhack
        ? baseFile !== null && patchFile !== null && patchedRomFile !== null
        : romSpec !== null),
    // Extra BIOS/firmware files are optional: a GBA pack usually needs none.
    files: argsError === null,
    review: true,
  }

  const canSubmit =
    stepValidity.metadata && stepValidity.rom && stepValidity.files && !hashing && !busy

  useEffect(() => {
    onValidity?.(stepValidity)
    // Serialised: the object is rebuilt on every render, so comparing it by
    // reference would fire the effect forever.
  }, [JSON.stringify(stepValidity)])

  const submit = async () => {
    if (!canSubmit) return
    if (!useRomhack && !romSpec) return
    setBusy(true)
    try {
      const files: FileEntry[] = []
      const initialFiles: FileEntry[] = []

      // Clean ROM (user-provided). In romhack mode the base dump below is the
      // clean ROM — a second user-provided entry would either collide on path
      // or sit unreferenced and required, blocking launch forever.
      if (!useRomhack && romSpec) {
        files.push({
          path: romPath,
          sha512: romSpec.sha512,
          fileSize: romSpec.size,
          source: { kind: "user-provided", hint: romHint },
          env: { client: "required", server: "unsupported" },
        })
      }

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
          env: { client: extra.required ? "required" : "optional", server: "unsupported" },
        })
      }

      onSave({
        name: name.trim(),
        kind,
        rom: useRomhack ? patchedRomPath : romPath,
        args: parsedArgs.tokens.length > 0 ? parsedArgs.tokens : undefined,
        files,
        initialFiles: initialFiles.length > 0 ? initialFiles : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  if (submitRef) submitRef.current = () => void submit()

  return (
    <div className="flex flex-col gap-5">
      {step === "metadata" && (
      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="edit" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[0.875rem] font-bold uppercase tracking-[0.08em] text-txt">
              {t("versionIdentity")}
            </h3>
            <p className="mt-1 text-[0.75rem] leading-[1.45] text-txt-dim">
              {t("versionIdentityLead")}
            </p>
          </div>
        </div>
        <Field label={t("versionName")} hint={t("versionNameHint")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1.4.2" />
        </Field>
      </section>
      )}

      {step === "metadata" && (
      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="gamepad" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[0.875rem] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.kindSection")}
            </h3>
            <p className="mt-1 text-[0.75rem] leading-[1.45] text-txt-dim">
              {t("emulator.kindSectionLead")}
            </p>
          </div>
        </div>

        <Field label={t("emulator.kind")}>
          <Select
            value={kind}
            onChange={(v) => changeKind(v as EmulatorKind)}
            options={[
              { value: "mgba", label: "mGBA (Game Boy Advance)" },
              { value: "melonds", label: "melonDS (Nintendo DS)" },
            ]}
          />
        </Field>
      </section>
      )}

      {step === "rom" && (
      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="cube" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[0.875rem] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.romSection")}
            </h3>
            <p className="mt-1 text-[0.75rem] leading-[1.45] text-txt-dim">
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

          {/* In romhack mode the base dump picker below covers the clean ROM;
              a second picker here would author a phantom required file. */}
          {!useRomhack && (
            <>
              <Field label={t("emulator.romSourceLabel")} hint={t("emulator.romSourceHelp")}>
                <Select
                  value={romSource}
                  onChange={(value) => setRomSource(value as "library" | "file")}
                  options={[
                    { value: "library", label: t("emulator.romSourceLibrary") },
                    { value: "file", label: t("emulator.romSourceFile") },
                  ]}
                />
              </Field>

              {romSource === "library" ? (
                <>
                  <Field label={t("emulator.romLibraryPick")}>
                    <Select
                      value={libraryRomId}
                      disabled={loadingLibrary}
                      onChange={setLibraryRomId}
                      options={[
                        {
                          value: "",
                          label: loadingLibrary
                            ? t("emulator.romLibraryLoading")
                            : t("emulator.romLibraryNone"),
                        },
                        ...romsForPlatform.map((rom) => ({
                          value: String(rom.id),
                          label: rom.name,
                        })),
                      ]}
                    />
                  </Field>

                  {!loadingLibrary && romsForPlatform.length === 0 && (
                    <p className="text-[0.6875rem] leading-[1.45] text-txt-muted">
                      {t("emulator.romLibraryEmpty", { platform: ROM_PLATFORM[kind].toUpperCase() })}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="border-l-2 border-solid border-warn bg-panel px-3 py-2 text-[0.6875rem] leading-[1.45] text-txt-muted">
                    {t("emulator.romSourceFileWarning")}
                  </p>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[12.5rem]">
                      <Field label={t("emulator.romFile")}>
                        <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[0.6875rem] text-txt-dim truncate">
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
                </>
              )}

              {romSpec && (
                <div className="text-[0.6875rem] font-mono text-txt-muted">
                  {t("emulator.romInfo", {
                    size: (romSpec.size / (1024 * 1024)).toFixed(1),
                    hash: romSpec.sha512.slice(0, 16) + "…",
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
            </>
          )}
        </div>
      </section>
      )}

      {step === "rom" && (
      <FeatureToggle
        icon={<Icon name="copy" size={18} />}
        title={t("emulator.romhackToggle")}
        ariaLabel={t("emulator.romhackToggle")}
        description={t("emulator.romhackToggleLead")}
        on={useRomhack}
        onChange={(on) => setUseRomhack(on)}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[12.5rem]">
            <Field label={t("emulator.baseFile")}>
              <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[0.6875rem] text-txt-dim truncate">
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
          <div className="flex-1 min-w-[12.5rem]">
            <Field label={t("emulator.patchFile")}>
              <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[0.6875rem] text-txt-dim truncate">
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
          <div className="flex-1 min-w-[12.5rem]">
            <Field label={t("emulator.patchedFile")}>
              <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[0.6875rem] text-txt-dim truncate">
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
      )}

      {step === "files" && (
      <FeatureToggle
        icon={<Icon name="download" size={18} />}
        title={t("emulator.saveToggle")}
        ariaLabel={t("emulator.saveToggle")}
        description={t("emulator.saveToggleLead")}
        on={startingSave !== null}
        onChange={(on) => setStartingSave(on ? { file: new File([], ""), name: "" } : null)}
      >
        {startingSave && startingSave.file.size !== 0 && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[12.5rem]">
                <Field label={t("emulator.saveFile")}>
                  <div className="rounded border border-solid border-line bg-panel px-3 py-2 font-mono text-[0.6875rem] text-txt-dim truncate">
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
      )}

      {step === "files" && (
      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="sliders" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[0.875rem] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.advancedSection")}
            </h3>
            <p className="mt-1 text-[0.75rem] leading-[1.45] text-txt-dim">
              {t("emulator.advancedSectionLead")}
            </p>
          </div>
        </div>

        <Field label={t("emulator.args")} hint={t("emulator.argsHint")} error={argsError ?? undefined}>
          <Textarea
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            rows={3}
            className="font-mono"
            placeholder={'--fullscreen\n--savedir "My Saves"'}
          />
        </Field>
      </section>
      )}

      {step === "files" && (
      <section className="border border-solid border-line bg-panel-2 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
            <Icon name="gift" size={15} />
          </span>
          <div>
            <h3 className="font-display text-[0.875rem] font-bold uppercase tracking-[0.08em] text-txt">
              {t("emulator.biosSection")}
            </h3>
            <p className="mt-1 text-[0.75rem] leading-[1.45] text-txt-dim">
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
                  <span className="truncate font-mono text-[0.6875rem] text-txt-muted">
                    {extra.path}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[0.6875rem] text-txt-dim">
                    {Math.max(1, Math.round(extra.size / 1024))} KB
                  </span>
                  {/* A required entry blocks launch until the player provides
                      it; letting the author demote it keeps optional firmware
                      from bricking every install. */}
                  <button
                    type="button"
                    className={cn(
                      "shrink-0 border border-solid px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.06em]",
                      extra.required
                        ? "border-warn/50 text-warn"
                        : "border-line text-txt-dim",
                    )}
                    onClick={() =>
                      setExtraFiles((current) =>
                        current.map((f, i) => (i === idx ? { ...f, required: !f.required } : f)),
                      )
                    }
                  >
                    {t(extra.required ? "emulator.fileRequired" : "emulator.fileOptional")}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 font-mono text-[0.6875rem] text-txt-dim hover:text-bad"
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
      )}

      {step === "review" && (
        <section className="border border-solid border-line bg-panel-2 p-4">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
              <Icon name="check" size={15} />
            </span>
            <div>
              <h3 className="font-display text-[0.875rem] font-bold uppercase tracking-[0.08em] text-txt">
                {t("emulator.reviewSection")}
              </h3>
              <p className="mt-1 text-[0.75rem] leading-[1.45] text-txt-dim">
                {t("emulator.reviewSectionLead")}
              </p>
            </div>
          </div>

          <dl className="grid gap-2 text-[0.8125rem]">
            <div className="flex items-baseline gap-3">
              <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                {t("versionName")}
              </dt>
              <dd className="text-txt">{name || "—"}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                {t("emulator.kind")}
              </dt>
              <dd className="text-txt">{kind === "mgba" ? "mGBA" : "melonDS"}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                {t("emulator.romHint")}
              </dt>
              <dd className="text-txt">{romHint || "—"}</dd>
            </div>
            {!useRomhack && (
              <div className="flex items-baseline gap-3">
                <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                  {t("emulator.romSourceLabel")}
                </dt>
                <dd className="text-txt">
                  {romSource === "library"
                    ? t("emulator.reviewRomLibrary", { name: romSpec?.label ?? "—" })
                    : t("emulator.reviewRomFile", { name: romSpec?.label ?? "—" })}
                </dd>
              </div>
            )}
            <div className="flex items-baseline gap-3">
              <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                {t("emulator.romPath")}
              </dt>
              <dd className="font-mono text-[0.75rem] text-txt">
                {useRomhack ? patchedRomPath : romPath}
              </dd>
            </div>
            {useRomhack && (
              <div className="flex items-baseline gap-3">
                <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                  {t("emulator.patchFormat")}
                </dt>
                <dd className="text-txt">{patchFormat.toUpperCase()}</dd>
              </div>
            )}
            <div className="flex items-baseline gap-3">
              <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                {t("emulator.biosSection")}
              </dt>
              <dd className="text-txt">{extraFiles.length}</dd>
            </div>
            {startingSave && (
              <div className="flex items-baseline gap-3">
                <dt className="w-40 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-dim">
                  {t("emulator.startingSave")}
                </dt>
                <dd className="font-mono text-[0.75rem] text-txt">{savePath}</dd>
              </div>
            )}
          </dl>

          <AvPill tone="info" icon="info" className="mt-4">
            {t("emulator.reviewNote")}
          </AvPill>
        </section>
      )}
    </div>
  )
}
