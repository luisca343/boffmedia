"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, Modal, Textarea, toast } from "@boffmedia/ui"
import { AvPanel, AvPill } from "../ui/av-kit"
import { type AdminPack, type GalleryImage, type GameType, PacksService } from "@/services/api/boffmedia/packsService"
import { apiUpload } from "@/services/http/boff-client"

// `password` is deprecated and cannot be selected for a NEW pack: a shared
// secret is listed to every authenticated launcher, has no per-user record and
// cannot be revoked for one person. Invitations cover the same use case
// properly. A pack that already IS password-gated shows the kind in edit mode
// so it can be migrated to public/allowlist — the only exit the API allows.
const ACCESS_OPTIONS: {
  value: AdminPack["accessKind"]
  icon: "globe" | "lock" | "users"
}[] = [
  { value: "public", icon: "globe" },
  { value: "allowlist", icon: "users" },
]

/** Creating or editing a pack is a pane in the detail column, not an overlay:
 *  the packs list stays visible so a slug clash is obvious before submitting.
 *  With `pack` set the form edits in place — slug and game type are immutable,
 *  and the server target keeps its own editor in the detail pane. */
export function PackForm({
  onClose,
  onCreated,
  pack,
  onSaved,
}: {
  onClose: () => void
  /** Gets the new pack's slug so the caller can select it in the list. */
  onCreated?: (slug: string) => void
  /** Edit an existing pack instead of creating one. */
  pack?: AdminPack
  onSaved?: () => void
}) {
  const t = useTranslations("admin.packs")
  const editing = pack !== undefined
  const [slug, setSlug] = useState(pack?.slug ?? "")
  const [name, setName] = useState(pack?.name ?? "")
  const [summary, setSummary] = useState(pack?.summary ?? "")
  const [description, setDescription] = useState("")
  const [iconUrl, setIconUrl] = useState(pack?.iconUrl ?? "")
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [gameType, setGameType] = useState<GameType>("minecraft")
  const [accessKind, setAccessKind] = useState<AdminPack["accessKind"]>(
    pack?.accessKind ?? "allowlist",
  )
  const [serverHost, setServerHost] = useState("")
  const [serverPort, setServerPort] = useState("")
  // The list omits description/gallery, so an edit prefills them from the
  // detail route. Until that lands, saving must not touch either field — a
  // PATCH built from the blank defaults would silently erase both.
  const [detailLoaded, setDetailLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const packId = pack?.id
  useEffect(() => {
    if (!packId) return
    let live = true
    void PacksService.detail(packId).then((res) => {
      if (!live || !res.success || !res.data) return
      setDescription(res.data.description ?? "")
      setGallery(res.data.gallery ?? [])
      setDetailLoaded(true)
    })
    return () => {
      live = false
    }
  }, [packId])

  const submit = async () => {
    setBusy(true)
    try {
      if (editing && pack) {
        const res = await PacksService.update(pack.id, {
          name,
          summary: summary || undefined,
          iconUrl: iconUrl || undefined,
          ...(detailLoaded
            ? { description: description || undefined, gallery }
            : description
              ? { description }
              : {}),
          // Unchanged kind is omitted: the API refuses `password` in a PATCH
          // even when the pack already has it.
          ...(accessKind !== pack.accessKind ? { accessKind } : {}),
        })
        if (!res.success) {
          toast({ tone: "bad", title: t("packSaveFailed"), msg: res.userMessage })
          return
        }
        toast({ tone: "ok", title: t("packSaved") })
        onSaved?.()
        return
      }
      const res = await PacksService.create({
        slug,
        name,
        summary: summary || undefined,
        description: description || undefined,
        iconUrl: iconUrl || undefined,
        gallery: gallery.length > 0 ? gallery : undefined,
        gameType,
        accessKind,
        // Minecraft-only: switching a pack to another game clears it, so a
        // value typed before the switch cannot be submitted invisibly.
        // A host makes it a server pack; a blank port lets the API default to
        // the vanilla 25565.
        server: gameType === "minecraft" && serverHost.trim()
          ? { host: serverHost.trim(), port: serverPort.trim() ? Number(serverPort) : undefined }
          : undefined,
      })
      // The envelope reports 201 on POST, so `success` is the only safe check.
      if (!res.success) {
        toast({ tone: "bad", title: t("createFailed"), msg: res.userMessage })
        return
      }
      toast({ tone: "ok", title: t("created") })
      onCreated?.(slug)
    } finally {
      setBusy(false)
    }
  }

  const uploadIcon = async (file: File) => {
    setUploadingIcon(true)
    try {
      const res = await apiUpload(file)
      if (!res.success || !res.data?.url) {
        toast({ tone: "bad", title: t("icon.label"), msg: res.userMessage })
        return
      }
      setIconUrl(res.data.url)
    } catch (e) {
      toast({ tone: "bad", title: t("icon.label"), msg: "Upload failed" })
    } finally {
      setUploadingIcon(false)
    }
  }

  const addGalleryImage = async (file: File) => {
    if (gallery.length >= 15) {
      toast({ tone: "warn", title: t("gallery.label"), msg: "Maximum 15 images" })
      return
    }
    setUploadingGallery(true)
    try {
      // Upload using the image upload endpoint
      const res = await apiUpload(file)
      const url = res.data?.url
      if (!res.success || !url) {
        toast({ tone: "bad", title: t("gallery.label"), msg: res.userMessage })
        return
      }
      setGallery((current) => [...current, { url, alt: undefined }])
    } catch (e) {
      toast({ tone: "bad", title: t("gallery.label"), msg: t("gallery.uploadFailed") })
    } finally {
      setUploadingGallery(false)
    }
  }

  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  const portNum = serverPort.trim() ? Number(serverPort) : null
  const serverValid =
    gameType !== "minecraft" ||
    !serverHost.trim() ||
    portNum === null ||
    (Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535)
  const canSubmit = (editing || slugValid) && name.trim().length > 0 && serverValid

  return (
    <AvPanel
      title={editing ? t("editPack") : t("newPack")}
      icon="cube"
      className="mb-0 flex min-h-0 flex-col"
      bodyClassName="flex min-h-0 flex-1 flex-col"
      aside={
        <Button size="sm" variant="ghost" icon="x" onClick={onClose}>
          {t("cancel")}
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="flex gap-3 border border-solid border-accent-line bg-accent-soft px-4 py-4">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-accent-line bg-panel text-accent">
            <span className="font-mono text-[12px] font-bold">01</span>
          </span>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-txt">
              {editing ? t("editPack") : t("newPackSetup")}
            </p>
            <p className="mt-1 max-w-[66ch] text-[13px] leading-[1.5] text-txt-dim">
              {editing ? t("editPackLead") : t("newPackLead")}
            </p>
          </div>
        </div>

        <div className="bm-scroll min-h-0 flex-1 overflow-auto pr-1">
          <div className="flex flex-col gap-5 pb-1">
            <section className="border border-solid border-line bg-panel-2 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
                  <Icon name="edit" size={15} />
                </span>
                <div>
                  <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
                    {t("identitySection")}
                  </h3>
                  <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
                    {t("identitySectionLead")}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("name")}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boff SMP" />
                </Field>
                <Field
                  label={t("slug")}
                  hint={editing ? t("slugImmutable") : t("slugHint")}
                  error={!editing && slug && !slugValid ? t("slugInvalid") : undefined}
                >
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="boff-smp"
                    className="font-mono"
                    disabled={editing}
                  />
                </Field>
              </div>

              <Field label={t("summary")} className="mt-4">
                <Textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={t("summaryPlaceholder")}
                />
              </Field>

              <Field label={t("description.label")} className="mt-4">
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2048))}
                  placeholder={t("description.placeholder")}
                  maxLength={2048}
                />
                <div className="mt-1 font-mono text-[10px] text-txt-dim">
                  {t("descriptionCharCount", { current: description.length, max: 2048 })}
                </div>
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label={t("icon.label")}>
                  <div className="flex flex-col gap-2">
                    {iconUrl && (
                      <img
                        src={iconUrl}
                        alt=""
                        className="h-24 w-24 rounded border border-solid border-line object-cover"
                      />
                    )}
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={iconUrl}
                          onChange={(e) => setIconUrl(e.target.value)}
                          placeholder={t("icon.urlFallback")}
                        />
                      </div>
                      <Button
                        size="sm"
                        icon="upload"
                        loading={uploadingIcon}
                        onClick={() => iconInputRef.current?.click()}
                      >
                        {t("icon.upload")}
                      </Button>
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            void uploadIcon(file)
                          }
                          e.target.value = ""
                        }}
                      />
                    </div>
                  </div>
                </Field>
              </div>

              <Field label={t("gallery.label")} className="mt-4">
                <div className="flex flex-col gap-3">
                  <Button
                    size="sm"
                    variant="default"
                    icon="plus"
                    loading={uploadingGallery}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    {t("gallery.add")}
                  </Button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        void addGalleryImage(file)
                      }
                      e.target.value = ""
                    }}
                  />
                  {gallery.length > 0 && (
                    <div className="bm-scroll max-h-[40vh] flex flex-col gap-2 overflow-auto pr-1">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="flex items-start gap-2 border border-solid border-line bg-panel p-2">
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="h-16 w-16 shrink-0 rounded border border-solid border-line object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <Input
                              type="text"
                              value={img.alt ?? ""}
                              onChange={(e) => {
                                const updated = [...gallery]
                                updated[idx] = { ...img, alt: e.target.value.slice(0, 256) }
                                setGallery(updated)
                              }}
                              placeholder={t("gallery.altPlaceholder")}
                              maxLength={256}
                            />
                            <div className="mt-1 font-mono text-[9px] text-txt-dim">
                              {(img.alt?.length ?? 0)} / 256
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="trash"
                            onClick={() => setGallery((current) => current.filter((_, i) => i !== idx))}
                          >
                            {t("gallery.remove")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </section>

            {/* Immutable after creation, so edit mode has nothing to offer here.
                Only the game types a launcher can actually list are offered —
                zomboid/stardew stay in the type union, not in the selector. */}
            {!editing && (
            <section className="border border-solid border-line bg-panel-2 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
                  <Icon name="layers" size={15} />
                </span>
                <div>
                  <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
                    {t("gameTypeSection")}
                  </h3>
                  <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
                    {t("gameTypeSectionLead")}
                  </p>
                </div>
              </div>

              <div role="radiogroup" aria-label={t("gameType")} className="grid gap-2 md:grid-cols-2">
                {(["minecraft", "emulator"] as const).map((gt) => {
                  const selected = gameType === gt
                  return (
                    <button
                      key={gt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setGameType(gt)}
                      className={[
                        "flex min-h-[96px] items-start gap-3 border-2 border-solid p-3 text-left transition-colors duration-[140ms] cursor-pointer",
                        selected
                          ? "border-accent bg-accent-soft"
                          : "border-line hover:border-line-2 hover:bg-panel",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid size-8 shrink-0 place-items-center border border-solid",
                          selected
                            ? "border-accent bg-accent text-accent-ink"
                            : "border-line-2 bg-panel text-txt-dim",
                        ].join(" ")}
                      >
                        <Icon name="cube" size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[13px] font-bold uppercase tracking-[0.04em] text-txt">
                          {t(`gameType.${gt}`)}
                        </span>
                        <span className="mt-1 block text-[11px] leading-[1.4] text-txt-dim">
                          {t(`gameTypeLead.${gt}`)}
                        </span>
                      </span>
                      {selected && <Icon name="check" size={14} className="shrink-0 text-accent" />}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-sm border border-solid border-info-line bg-info-soft px-3 py-2">
                <p className="text-[12px] leading-[1.5] text-txt-dim">
                  {t("gameTypePermanent")}
                </p>
              </div>
            </section>
            )}

            <section className="border border-solid border-line bg-panel-2 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
                  <Icon name="shield" size={15} />
                </span>
                <div>
                  <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
                    {t("accessSection")}
                  </h3>
                  <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
                    {t("accessSectionLead")}
                  </p>
                </div>
              </div>

              {/* A pack that already IS password-gated keeps the option visible,
                  so editing it does not silently change its access kind — but
                  the only exits are public/allowlist (password is deprecated). */}
              <div role="radiogroup" aria-label={t("accessKind")} className="grid gap-2 md:grid-cols-3">
                {(pack?.accessKind === "password"
                  ? [...ACCESS_OPTIONS, { value: "password" as const, icon: "lock" as const }]
                  : ACCESS_OPTIONS
                ).map((option) => {
                  const selected = accessKind === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAccessKind(option.value)}
                      className={[
                        "flex min-h-[108px] items-start gap-3 border-2 border-solid p-3 text-left transition-colors duration-[140ms]",
                        selected
                          ? "border-accent bg-accent-soft"
                          : "border-line hover:border-line-2 hover:bg-panel",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid size-8 shrink-0 place-items-center border border-solid",
                          selected
                            ? "border-accent bg-accent text-accent-ink"
                            : "border-line-2 bg-panel text-txt-dim",
                        ].join(" ")}
                      >
                        <Icon name={option.icon} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[13px] font-bold uppercase tracking-[0.04em] text-txt">
                          {t(`access.${option.value}`)}
                        </span>
                        <span className="mt-1 block text-[12px] leading-[1.4] text-txt-dim">
                          {t(`accessLead.${option.value}`)}
                        </span>
                      </span>
                      {selected && <Icon name="check" size={14} className="shrink-0 text-accent" />}
                    </button>
                  )
                })}
              </div>

              {pack?.accessKind === "password" && (
                <div className="mt-4 rounded-sm border border-solid border-info-border bg-info-soft px-3 py-2">
                  <p className="text-[12px] leading-[1.5] text-txt-dim">
                    {t("accessPasswordDeprecated")}
                  </p>
                </div>
              )}
            </section>

            {/* Quick Play is a Minecraft concept: there is no server to join in a
                GBA pack, and offering the field on one only invites a value the
                launcher will never read. In edit mode the detail pane's server
                editor owns this. */}
            {!editing && gameType === "minecraft" && (
            <section className="border border-solid border-line bg-panel-2 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center border border-solid border-line-2 bg-panel text-accent">
                  <Icon name="server" size={15} />
                </span>
                <div>
                  <h3 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-txt">
                    {t("serverSection")}
                  </h3>
                  <p className="mt-1 text-[12px] leading-[1.45] text-txt-dim">
                    {t("serverSectionLead")}
                  </p>
                </div>
              </div>

              <div className="grid max-w-[520px] gap-3 sm:grid-cols-[1fr_140px]">
                <Field label={t("serverHost")} hint={t("serverHostHint")}>
                  <Input
                    value={serverHost}
                    placeholder="play.example.com"
                    onChange={(e) => setServerHost(e.target.value)}
                  />
                </Field>
                <Field label={t("serverPort")} hint={t("serverPortHint")}>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    value={serverPort}
                    placeholder="25565"
                    onChange={(e) => setServerPort(e.target.value)}
                  />
                </Field>
              </div>
            </section>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <AvPill tone={slugValid ? "ok" : "muted"} icon={slugValid ? "check" : "cube"}>
              {slugValid ? slug : t("slugPending")}
            </AvPill>
            {!editing && (
              <span className="hidden font-mono text-[10px] text-txt-dim sm:inline">{t("slugPreview")}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              variant="pri"
              icon={editing ? "check" : "plus"}
              loading={busy}
              disabled={!canSubmit}
              onClick={() => void submit()}
            >
              {editing ? t("savePack") : t("create")}
            </Button>
          </div>
        </div>
      </div>
    </AvPanel>
  )
}

/** The one place a modal is still right: a destructive yes/no that must block
 *  the click that opened it. Everything else in Packs is a pane. */
export function ConfirmModal({
  open,
  title,
  lead,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  lead?: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
}) {
  const t = useTranslations("admin.packs")
  const [busy, setBusy] = useState(false)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="pri"
            icon="check"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
                onClose()
              } finally {
                setBusy(false)
              }
            }}
          >
            {t("confirm")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-txt-dim">{lead ?? t("confirmLead")}</p>
    </Modal>
  )
}
