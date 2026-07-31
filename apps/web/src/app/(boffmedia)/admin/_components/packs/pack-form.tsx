"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, Modal, Textarea, toast } from "@boffmedia/ui"
import { AvPanel, AvPill } from "../ui/av-kit"
import { type AdminPack, PacksService } from "@/services/api/boffmedia/packsService"

const ACCESS_OPTIONS: {
  value: AdminPack["accessKind"]
  icon: "globe" | "lock" | "users"
}[] = [
  { value: "public", icon: "globe" },
  { value: "password", icon: "lock" },
  { value: "allowlist", icon: "users" },
]

/** Creating a pack is a pane in the detail column, not an overlay: the packs
 *  list stays visible so a slug clash is obvious before submitting. */
export function PackForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  /** Gets the new pack's slug so the caller can select it in the list. */
  onCreated: (slug: string) => void
}) {
  const t = useTranslations("admin.packs")
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [summary, setSummary] = useState("")
  const [accessKind, setAccessKind] = useState<AdminPack["accessKind"]>("allowlist")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const res = await PacksService.create({
        slug,
        name,
        summary: summary || undefined,
        accessKind,
        password: accessKind === "password" ? password : undefined,
      })
      // The envelope reports 201 on POST, so `success` is the only safe check.
      if (!res.success) {
        toast({ tone: "bad", title: t("createFailed"), msg: res.userMessage })
        return
      }
      toast({ tone: "ok", title: t("created") })
      onCreated(slug)
    } finally {
      setBusy(false)
    }
  }

  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  const canSubmit =
    slugValid && name.trim().length > 0 && (accessKind !== "password" || password.length >= 4)

  return (
    <AvPanel
      title={t("newPack")}
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
        <div className="cut-tag flex gap-3 border border-solid border-accent-line bg-accent-soft px-4 py-4">
          <span className="grid size-8 shrink-0 place-items-center border border-solid border-accent-line bg-panel text-accent">
            <span className="font-mono text-[12px] font-bold">01</span>
          </span>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-txt">
              {t("newPackSetup")}
            </p>
            <p className="mt-1 max-w-[66ch] text-[13px] leading-[1.5] text-txt-dim">
              {t("newPackLead")}
            </p>
          </div>
        </div>

        <div className="bm-scroll min-h-0 flex-1 overflow-auto pr-1">
          <div className="flex flex-col gap-5 pb-1">
            <section className="cut border border-solid border-line bg-panel-2 p-4">
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
                  hint={t("slugHint")}
                  error={slug && !slugValid ? t("slugInvalid") : undefined}
                >
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="boff-smp"
                    className="font-mono"
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
            </section>

            <section className="cut border border-solid border-line bg-panel-2 p-4">
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

              <div role="radiogroup" aria-label={t("accessKind")} className="grid gap-2 md:grid-cols-3">
                {ACCESS_OPTIONS.map((option) => {
                  const selected = accessKind === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAccessKind(option.value)}
                      className={[
                        "cut flex min-h-[108px] items-start gap-3 border-2 border-solid p-3 text-left transition-colors duration-[140ms]",
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

              {accessKind === "password" && (
                <div className="mt-4 max-w-[420px] border-t border-line pt-4">
                  <Field label={t("password")} hint={t("passwordHint")}>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <AvPill tone={slugValid ? "ok" : "muted"} icon={slugValid ? "check" : "cube"}>
              {slugValid ? slug : t("slugPending")}
            </AvPill>
            <span className="hidden font-mono text-[10px] text-txt-dim sm:inline">{t("slugPreview")}</span>
          </div>
          <div className="flex items-center gap-2">
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
