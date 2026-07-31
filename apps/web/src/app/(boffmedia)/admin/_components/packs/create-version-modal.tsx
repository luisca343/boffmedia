"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Field, Input, Modal, Select, Textarea, toast } from "@boffmedia/ui"
import {
  type AdminPack,
  type PackLoader,
  PacksService,
} from "@/services/api/boffmedia/packsService"

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

/** Content hash of the file as the launcher will check it. Computed here as
 *  well as server-side so an already-stored blob can be skipped without
 *  uploading it first; the server still hashes what it receives, so a mismatch
 *  is impossible to sneak past. Reads the file whole — override files are
 *  configs and scripts, not the 200 MB jars, which come from CF/Modrinth. */
async function sha512Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-512", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
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

export function CreateVersionModal({
  pack,
  open,
  onClose,
  onCreated,
}: {
  pack: AdminPack
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const t = useTranslations("admin.packs")
  const [name, setName] = useState("")
  const [minecraft, setMinecraft] = useState("")
  const [loader, setLoader] = useState("")
  const [loaderVersion, setLoaderVersion] = useState("")
  const [notes, setNotes] = useState("")
  const [prefix, setPrefix] = useState("config")
  const [uploads, setUploads] = useState<Upload[]>([])
  const [modsJson, setModsJson] = useState("")
  const [busy, setBusy] = useState(false)
  const filesRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)

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
  const parseMods = (): unknown[] | null => {
    if (!modsJson.trim()) return []
    try {
      const parsed: unknown = JSON.parse(modsJson)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const modsValid = parseMods() !== null
  const canSubmit =
    name.trim().length > 0 &&
    minecraft.trim().length > 0 &&
    modsValid &&
    (!loader || loaderVersion.trim().length > 0) &&
    !busy

  const submit = async () => {
    const mods = parseMods()
    if (!mods) return
    setBusy(true)
    try {
      const overrides: unknown[] = []
      for (const upload of uploads) {
        patch(upload.path, { state: "hashing", detail: undefined })
        const sha512 = await sha512Hex(upload.file)

        const status = await PacksService.blobStatus(sha512)
        const present = status.success && status.data?.present
        if (!present) {
          patch(upload.path, { state: "uploading" })
          const res = await PacksService.uploadBlob(upload.file)
          if (!res.success || !res.data) {
            patch(upload.path, { state: "error", detail: res.userMessage })
            toast({ tone: "bad", title: t("blobFailed"), msg: upload.path })
            return
          }
          // The server's hash wins. If it disagrees with ours the file changed
          // under us mid-upload, and referencing the local one would ship a
          // manifest the launcher can never verify.
          overrides.push(fileEntry(upload.path, res.data.sha512, res.data.size))
          patch(upload.path, { state: "done" })
          continue
        }
        overrides.push(fileEntry(upload.path, sha512, upload.file.size))
        patch(upload.path, { state: "reused" })
      }

      const res = await PacksService.createVersion(pack.id, {
        name: name.trim(),
        minecraft: minecraft.trim(),
        loader: (loader || undefined) as PackLoader | undefined,
        loaderVersion: loader ? loaderVersion.trim() : undefined,
        notes: notes.trim() || undefined,
        files: [...mods, ...overrides],
      })
      if (!res.success) {
        toast({ tone: "bad", title: t("versionFailed"), msg: res.userMessage ?? res.message })
        return
      }
      toast({ tone: "ok", title: t("versionCreated") })
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
    setModsJson("")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("newVersion")}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("versionName")} hint={t("versionNameHint")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1.4.2" />
          </Field>
          <Field label={t("minecraft")}>
            <Input
              value={minecraft}
              onChange={(e) => setMinecraft(e.target.value)}
              placeholder="1.21.4"
            />
          </Field>
          <Field label={t("loader")}>
            <Select value={loader} options={LOADERS} onChange={setLoader} />
          </Field>
          {loader && (
            <Field label={t("loaderVersion")}>
              <Input
                value={loaderVersion}
                onChange={(e) => setLoaderVersion(e.target.value)}
                placeholder="21.4.30"
              />
            </Field>
          )}
        </div>

        <Field label={t("notes")}>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <Field label={t("mods")} hint={t("modsHint")} error={modsValid ? undefined : t("modsInvalid")}>
          <Textarea
            rows={6}
            className="font-mono text-[12px]"
            value={modsJson}
            onChange={(e) => setModsJson(e.target.value)}
            placeholder={
              '[{"path":"mods/sodium.jar","sha512":"…","fileSize":123,"source":{"kind":"modrinth","projectId":"AANobbMI","versionId":"…"}}]'
            }
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
      </div>
    </Modal>
  )
}

function fileEntry(path: string, sha512: string, fileSize: number) {
  return {
    path,
    sha512,
    fileSize,
    source: { kind: "override" as const, blobSha512: sha512 },
  }
}
