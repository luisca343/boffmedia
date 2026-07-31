"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Disclosure,
  Field,
  Input,
  Modal,
  Seg,
  Select,
  Textarea,
  toast,
} from "@boffmedia/ui"
import {
  type AdminPack,
  type PackLoader,
  PacksService,
} from "@/services/api/boffmedia/packsService"
import { parsePackArchive } from "./import-pack"
import { ModSelector, type SelectedMod } from "./mod-selector"
import { overrideFileEntry, uploadOverrideBlob } from "./upload-blob"
import { useGameVersions, useLoaderVersions } from "./use-version-meta"
import { VersionCombobox, type ComboOption } from "./version-combobox"

// Cutting a version is the one authoring step the launcher cannot do for you:
// mods come from CurseForge/Modrinth by id, but configs, scripts and resource
// packs are OUR bytes and have to be uploaded before a manifest can reference
// them. §7.1 — the API validates the whole thing with @boffmedia/pack-schema,
// so anything malformed is rejected there rather than half-stored here.

const LOADERS: { value: string; label: string }[] = [
  { value: "", label: "Vanilla" },
  { value: "neoforge", label: "NeoForge" },
  { value: "forge", label: "Forge" },
  { value: "fabric-loader", label: "Fabric" },
  { value: "quilt-loader", label: "Quilt" },
]

type Upload = {
  file: File
  /** Target path inside the instance, forward slashes, no leading "./". */
  path: string
  state: "pending" | "hashing" | "uploading" | "reused" | "done" | "error"
  detail?: string
}

/** `webkitRelativePath` starts at the folder the admin picked, which is almost
 *  never a path the game knows — drop that first segment and let the prefix
 *  field decide where the files actually land. */
function targetPath(file: File, prefix: string): string {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath
  const inner = relative ? relative.split("/").slice(1).join("/") : file.name
  const clean = (prefix.trim().replace(/^\/+|\/+$/g, "") + "/" + (inner || file.name))
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
  return clean.replace(/\/{2,}/g, "/")
}

/** A stored manifest entry, as the API hands it back. */
type StoredFile = {
  path: string
  sha512: string
  fileSize: number
  source: { kind: string; projectId?: unknown; versionId?: unknown; fileId?: unknown }
}

/** Turns a stored version's files back into picker rows so a clone starts from
 *  the real thing instead of an empty form. */
function toSelected(files: unknown[]): SelectedMod[] {
  return (files as StoredFile[])
    .filter((f) => f && typeof f.path === "string")
    .map((file, index) => {
      const kind = file.source?.kind
      const platform: SelectedMod["platform"] =
        kind === "curseforge" || kind === "modrinth" ? kind : kind === "url" ? "url" : "override"
      const fileName = file.path.split("/").pop() ?? file.path
      return {
        // Path-keyed: two entries of the same mod at different paths are two
        // rows, and the manifest forbids the same path twice anyway.
        key: `${kind}:${file.path}:${index}`,
        path: file.path,
        sha512: file.sha512,
        fileSize: file.fileSize,
        source: file.source,
        name: fileName,
        platform,
        fileName,
        projectId:
          file.source?.projectId !== undefined ? String(file.source.projectId) : undefined,
      }
    })
}

export function CreateVersionModal({
  pack,
  open,
  onClose,
  onCreated,
  sourceVersionId,
  mode = "create",
}: {
  pack: AdminPack
  open: boolean
  onClose: () => void
  onCreated: () => void
  /** Prefill from this version: its metadata, mods and overrides. */
  sourceVersionId?: string
  /** "edit" PATCHes `sourceVersionId` in place (drafts only); "clone" prefills
   *  from it but still creates a new version. */
  mode?: "create" | "clone" | "edit"
}) {
  const t = useTranslations("admin.packs")
  const [name, setName] = useState("")
  const [minecraft, setMinecraft] = useState("")
  const [loader, setLoader] = useState("")
  const [loaderVersion, setLoaderVersion] = useState("")
  const [notes, setNotes] = useState("")
  const [prefix, setPrefix] = useState("config")
  const [uploads, setUploads] = useState<Upload[]>([])
  const [mods, setMods] = useState<SelectedMod[]>([])
  const [extraJson, setExtraJson] = useState("")
  const [busy, setBusy] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [prefilling, setPrefilling] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const archiveRef = useRef<HTMLInputElement>(null)

  // Prefill from an existing version. Runs on open so reopening the modal for a
  // different version cannot show the previous one's files.
  useEffect(() => {
    if (!open || !sourceVersionId) return
    let live = true
    setPrefilling(true)
    void PacksService.versionDetail(pack.id, sourceVersionId).then((res) => {
      if (!live) return
      setPrefilling(false)
      if (!res.success || !res.data) {
        toast({ tone: "bad", title: t("cloneFailed") })
        return
      }
      const version = res.data
      setName(mode === "edit" ? version.name : `${version.name}-copy`)
      setMinecraft(version.minecraft)
      setLoader(version.loader ?? "")
      setLoaderVersion(version.loaderVersion ?? "")
      // Claim the pair before the reset effect sees it change, or the loader
      // build we just restored is wiped and replaced by "recommended".
      lastPair.current = `${version.loader ?? ""}:${version.minecraft}`
      setNotes(version.notes ?? "")
      setMods(toSelected(version.files))
    })
    return () => {
      live = false
    }
  }, [open, sourceVersionId, pack.id, mode, t])

  const { versions: gameVersions, loading: loadingGame } = useGameVersions()
  const { versions: loaderVersions, loading: loadingLoader } = useLoaderVersions(
    loader,
    minecraft.trim(),
  )

  const minecraftOptions = useMemo<ComboOption[]>(
    () =>
      gameVersions
        .filter((v) => showSnapshots || v.type === "release")
        .map((v) => ({
          value: v.id,
          meta: v.releaseTime.slice(0, 10),
          tag: v.latest ? t("tagLatest") : v.type === "snapshot" ? t("tagSnapshot") : undefined,
          tagTone: v.latest ? ("ok" as const) : ("warn" as const),
        })),
    [gameVersions, showSnapshots, t],
  )

  const loaderOptions = useMemo<ComboOption[]>(
    () =>
      loaderVersions.map((v) => ({
        value: v.version,
        tag: v.recommended ? t("tagRecommended") : v.latest ? t("tagLatest") : undefined,
        tagTone: v.recommended ? ("ok" as const) : ("info" as const),
      })),
    [loaderVersions, t],
  )

  // Changing loader or Minecraft version invalidates whatever build was chosen:
  // a Forge build for 1.21.4 is not a legal value for 1.21.5, and leaving it
  // there publishes a version that cannot install.
  const lastPair = useRef(`${loader}:${minecraft}`)
  useEffect(() => {
    const pair = `${loader}:${minecraft}`
    if (pair === lastPair.current) return
    lastPair.current = pair
    setLoaderVersion("")
  }, [loader, minecraft])

  // Prefill the recommended build so the common case is one click, not a
  // decision about which of 300 Forge builds is the right one.
  useEffect(() => {
    if (loaderVersion || loaderVersions.length === 0) return
    const pick =
      loaderVersions.find((v) => v.recommended) ??
      loaderVersions.find((v) => v.latest) ??
      loaderVersions[0]
    setLoaderVersion(pick.version)
  }, [loaderVersion, loaderVersions])

  const pick = (list: FileList | null) => {
    if (!list) return
    const added = Array.from(list).map<Upload>((file) => ({
      file,
      path: targetPath(file, prefix),
      state: "pending",
    }))
    // Keyed on the target path, not the name: two files from different folders
    // can share a name, and the manifest rejects duplicate paths anyway.
    setUploads((current) => {
      const byPath = new Map(current.map((u) => [u.path, u]))
      for (const upload of added) byPath.set(upload.path, upload)
      return [...byPath.values()]
    })
  }

  const patch = (path: string, next: Partial<Upload>) =>
    setUploads((current) => current.map((u) => (u.path === path ? { ...u, ...next } : u)))

  /** Parsed only to catch a typo before anything uploads — the authority is the
   *  API's zod pass, so this deliberately does not re-implement the schema. */
  const parseExtra = (): unknown[] | null => {
    if (!extraJson.trim()) return []
    try {
      const parsed: unknown = JSON.parse(extraJson)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const extraValid = parseExtra() !== null
  const canSubmit =
    name.trim().length > 0 &&
    minecraft.trim().length > 0 &&
    extraValid &&
    (!loader || loaderVersion.trim().length > 0) &&
    !busy

  const onModsChange = useCallback((next: SelectedMod[]) => setMods(next), [])

  /** Import a .mrpack or a CurseForge export zip. A CurseForge archive costs a
   *  server-side download per mod (its manifest has no sha512), so this can run
   *  for minutes on a large pack — hence the running progress line. */
  const importArchive = async (file: File | undefined) => {
    if (!file || importing) return
    setImporting(t("importReading"))
    try {
      const result = await parsePackArchive(file, (message) => setImporting(message))
      if ("error" in result) {
        toast({ tone: "bad", title: t(`importError.${result.error}`) })
        return
      }
      setName((current) => current || result.name)
      setMinecraft(result.minecraft)
      setLoader(result.loader)
      setLoaderVersion(result.loaderVersion)
      lastPair.current = `${result.loader}:${result.minecraft}`
      // Merged, not replaced: importing into a half-built version must not
      // silently discard what is already there.
      setMods((current) => {
        const seen = new Set(current.map((m) => m.key))
        return [...current, ...result.mods.filter((m) => !seen.has(m.key))]
      })
      if (result.skipped.length > 0) {
        toast({
          tone: "warn",
          title: t("importSkipped", { count: result.skipped.length }),
          msg: result.skipped.slice(0, 5).join(", "),
        })
      } else {
        toast({ tone: "ok", title: t("importDone", { count: result.mods.length }) })
      }
    } finally {
      setImporting(null)
    }
  }

  const submit = async () => {
    if (busy) return
    const extra = parseExtra()
    if (!extra) return
    setBusy(true)
    try {
      const overrides: unknown[] = []
      for (const upload of uploads) {
        patch(upload.path, { state: "hashing", detail: undefined })
        const result = await uploadOverrideBlob(upload.file, (state) =>
          patch(upload.path, { state }),
        )
        if (!result.ok) {
          patch(upload.path, { state: "error", detail: result.message })
          toast({ tone: "bad", title: t("blobFailed"), msg: upload.path })
          return
        }
        overrides.push(overrideFileEntry(upload.path, result.sha512, result.fileSize))
        patch(upload.path, { state: result.reused ? "reused" : "done" })
      }

      // The mods are already resolved (sha512 + size came back from the catalog
      // resolve route), so submit does no per-mod work here.
      const modFiles = mods.map((mod) => ({
        path: mod.path,
        sha512: mod.sha512,
        fileSize: mod.fileSize,
        source: mod.source,
      }))

      const payload = {
        name: name.trim(),
        minecraft: minecraft.trim(),
        loader: (loader || undefined) as PackLoader | undefined,
        loaderVersion: loader ? loaderVersion.trim() : undefined,
        notes: notes.trim() || undefined,
        files: [...modFiles, ...overrides, ...extra],
      }
      const res =
        mode === "edit" && sourceVersionId
          ? await PacksService.updateVersion(pack.id, sourceVersionId, payload)
          : await PacksService.createVersion(pack.id, payload)
      if (!res.success) {
        toast({ tone: "bad", title: t("versionFailed"), msg: res.userMessage ?? res.message })
        return
      }
      toast({ tone: "ok", title: mode === "edit" ? t("versionUpdated") : t("versionCreated") })
      reset()
      onCreated()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setName("")
    setMinecraft("")
    setLoader("")
    setLoaderVersion("")
    setNotes("")
    setUploads([])
    setMods([])
    setExtraJson("")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? t("editVersion") : mode === "clone" ? t("cloneVersion") : t("newVersion")}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="pri"
            icon="plus"
            loading={busy}
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {t("create")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 border border-solid border-line bg-panel px-3 py-2">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
            {t("importTitle")}
          </span>
          <Button
            size="sm"
            icon="upload"
            loading={importing !== null}
            disabled={importing !== null || busy}
            onClick={() => archiveRef.current?.click()}
          >
            {t("importArchive")}
          </Button>
          <span className="font-body text-[11px] text-txt-dim">{t("importHint")}</span>
          {importing && (
            <span className="ml-auto font-mono text-[11px] text-txt-muted">{importing}</span>
          )}
          {prefilling && (
            <span className="ml-auto font-mono text-[11px] text-txt-muted">{t("loading")}</span>
          )}
          <input
            ref={archiveRef}
            type="file"
            accept=".mrpack,.zip"
            hidden
            onChange={(e) => {
              void importArchive(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("versionName")} hint={t("versionNameHint")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1.4.2" />
          </Field>
          <Field label={t("minecraft")} hint={t("minecraftHint")}>
            <div className="flex flex-col gap-2">
              <VersionCombobox
                value={minecraft}
                onChange={setMinecraft}
                options={minecraftOptions}
                loading={loadingGame}
                placeholder="1.21.4"
              />
              <Seg
                value={showSnapshots ? "all" : "release"}
                onChange={(v) => setShowSnapshots(v === "all")}
                options={[
                  { value: "release", label: t("releasesOnly") },
                  { value: "all", label: t("includeSnapshots") },
                ]}
              />
            </div>
          </Field>
          <Field label={t("loader")}>
            <Select value={loader} options={LOADERS} onChange={setLoader} />
          </Field>
          {loader && (
            <Field
              label={t("loaderVersion")}
              hint={loaderVersions.length === 0 && !loadingLoader ? t("noLoaderBuilds") : undefined}
            >
              <VersionCombobox
                value={loaderVersion}
                onChange={setLoaderVersion}
                options={loaderOptions}
                loading={loadingLoader}
                disabled={!minecraft.trim()}
                placeholder="21.4.30"
              />
            </Field>
          )}
        </div>

        <Field label={t("notes")}>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <Field label={t("mods")} hint={t("modsHint")}>
          <ModSelector
            value={mods}
            onChange={onModsChange}
            minecraft={minecraft}
            loader={loader}
          />
        </Field>

        <Field label={t("overrides")} hint={t("overridesHint")}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[220px]">
                <Field label={t("prefix")}>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="config"
                  />
                </Field>
              </div>
              <Button size="sm" icon="plus" onClick={() => filesRef.current?.click()}>
                {t("addFiles")}
              </Button>
              <Button size="sm" icon="plus" onClick={() => folderRef.current?.click()}>
                {t("addFolder")}
              </Button>
            </div>

            <input
              ref={filesRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                pick(e.target.files)
                e.target.value = ""
              }}
            />
            <input
              ref={folderRef}
              type="file"
              hidden
              // Not in React's typings; the attribute is what makes the browser
              // hand back a whole tree with webkitRelativePath set.
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
              onChange={(e) => {
                pick(e.target.files)
                e.target.value = ""
              }}
            />

            {uploads.length > 0 && (
              <ul className="flex max-h-[220px] flex-col gap-1 overflow-auto">
                {uploads.map((upload) => (
                  <li
                    key={upload.path}
                    className="flex items-center gap-3 border border-solid border-line bg-panel px-3 py-2"
                  >
                    <span className="truncate font-mono text-[11px] text-txt-muted">
                      {upload.path}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-txt-dim">
                      {Math.max(1, Math.round(upload.file.size / 1024))} KB
                    </span>
                    <Badge tone={upload.state === "error" ? "bad" : "info"}>
                      {t(`uploadState.${upload.state}`)}
                    </Badge>
                    <button
                      type="button"
                      className="shrink-0 font-mono text-[11px] text-txt-dim hover:text-bad"
                      onClick={() =>
                        setUploads((current) => current.filter((u) => u.path !== upload.path))
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        <Disclosure title={t("advancedJson")} sub={t("advancedJsonHint")} icon="code">
          <Field error={extraValid ? undefined : t("modsInvalid")}>
            <Textarea
              rows={5}
              className="font-mono text-[12px]"
              value={extraJson}
              onChange={(e) => setExtraJson(e.target.value)}
              placeholder='[{"path":"mods/sodium.jar","sha512":"…","fileSize":123,"source":{"kind":"modrinth","projectId":"AANobbMI","versionId":"…"}}]'
            />
          </Field>
        </Disclosure>
      </div>
    </Modal>
  )
}
