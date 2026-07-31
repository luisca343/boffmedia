"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Empty,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Tabs,
  toast,
} from "@boffmedia/ui"
import { AvKpi, AvKpis, AvPanel, AvPill, AvSectionHead } from "../_components/ui/av-kit"
import { CreateVersionModal } from "../_components/packs/create-version-modal"
import {
  type AccessRow,
  type AdminPack,
  type AuditRow,
  type InviteRow,
  type PackVersionRow,
  PacksService,
} from "@/services/api/boffmedia/packsService"

// HANDOFF §4.1 — pack authoring lives here, not in the launcher. The desktop
// app only installs and plays; creating packs, cutting versions and granting
// access are admin work and belong on a real screen with a keyboard.

const ACCESS_TONE = {
  public: "ok",
  password: "info",
  allowlist: "accent",
} as const

function AccessPill({ kind }: { kind: AdminPack["accessKind"] }) {
  const t = useTranslations("admin.packs")
  return (
    <AvPill tone={ACCESS_TONE[kind]} icon={kind === "public" ? "globe" : "lock"}>
      {t(`access.${kind}`)}
    </AvPill>
  )
}

function CreatePackModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const t = useTranslations("admin.packs")
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [summary, setSummary] = useState("")
  const [accessKind, setAccessKind] = useState<AdminPack["accessKind"]>("allowlist")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setSlug("")
    setName("")
    setSummary("")
    setAccessKind("allowlist")
    setPassword("")
  }

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
      reset()
      onCreated()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  const canSubmit =
    slugValid && name.trim().length > 0 && (accessKind !== "password" || password.length >= 4)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("newPack")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="pri" icon="plus" loading={busy} disabled={!canSubmit} onClick={() => void submit()}>
            {t("create")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
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
          />
        </Field>
        <Field label={t("summary")}>
          <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>
        <Select
          label={t("accessKind")}
          value={accessKind}
          onChange={(v) => setAccessKind(v as AdminPack["accessKind"])}
          options={[
            { value: "allowlist", label: t("access.allowlist") },
            { value: "password", label: t("access.password") },
            { value: "public", label: t("access.public") },
          ]}
        />
        {accessKind === "password" && (
          <Field label={t("password")} hint={t("passwordHint")}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        )}
      </div>
    </Modal>
  )
}

function VersionsTab({ pack, onChanged }: { pack: AdminPack; onChanged: () => void }) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<PackVersionRow[] | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    const res = await PacksService.versions(pack.id)
    setRows(res.success ? (res.data ?? []) : [])
  }, [pack.id])

  useEffect(() => {
    void load()
  }, [load])

  const publish = async (versionId: string) => {
    setPublishing(versionId)
    try {
      const res = await PacksService.publishVersion(pack.id, versionId)
      if (!res.success) {
        toast({ tone: "bad", title: t("publishFailed"), msg: res.userMessage })
        return
      }
      toast({ tone: "ok", title: t("published") })
      await load()
      onChanged()
    } finally {
      setPublishing(null)
    }
  }

  const modal = (
    <CreateVersionModal
      pack={pack}
      open={creating}
      onClose={() => setCreating(false)}
      onCreated={() => {
        void load()
        onChanged()
      }}
    />
  )

  if (!rows) return <Spinner />
  if (rows.length === 0) {
    return (
      <>
        <Empty icon="layers" title={t("noVersions")} lead={t("noVersionsLead")}>
          <Button size="sm" variant="pri" icon="plus" onClick={() => setCreating(true)}>
            {t("newVersion")}
          </Button>
        </Empty>
        {modal}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button size="sm" variant="pri" icon="plus" onClick={() => setCreating(true)}>
          {t("newVersion")}
        </Button>
      </div>
      {rows.map((v) => (
        <div
          key={v.id}
          className="cut flex flex-wrap items-center gap-3 border border-solid border-line bg-panel px-4 py-3"
        >
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.06em] text-txt">
            {v.name}
          </span>
          {v.published ? (
            <AvPill tone="ok">{t("publishedPill")}</AvPill>
          ) : (
            <AvPill tone="warn">{t("draft")}</AvPill>
          )}
          {pack.latestVersionId === v.id && <AvPill tone="accent">{t("latest")}</AvPill>}
          <span className="font-mono text-[11px] text-txt-dim">
            {v.minecraft}
            {v.loader ? ` · ${v.loader} ${v.loaderVersion ?? ""}` : ""} · {v.fileCount}{" "}
            {t("files")}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[11px] text-txt-dim">
              {new Date(v.createdAt).toLocaleDateString()}
            </span>
            {!v.published && (
              <Button
                size="sm"
                variant="pri"
                icon="check"
                loading={publishing === v.id}
                onClick={() => void publish(v.id)}
              >
                {t("publish")}
              </Button>
            )}
          </span>
        </div>
      ))}
      {modal}
    </div>
  )
}

function AccessTab({ pack }: { pack: AdminPack }) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<AccessRow[] | null>(null)
  const [uuid, setUuid] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await PacksService.access(pack.id)
    setRows(res.success ? (res.data ?? []) : [])
  }, [pack.id])

  useEffect(() => {
    void load()
  }, [load])

  const uuidValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)

  const grant = async () => {
    setBusy(true)
    try {
      const res = await PacksService.grant(pack.id, uuid.toLowerCase())
      if (!res.success) {
        toast({ tone: "bad", title: t("grantFailed"), msg: res.userMessage })
        return
      }
      setUuid("")
      await load()
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (target: string) => {
    const res = await PacksService.revoke(pack.id, target)
    if (!res.success) {
      toast({ tone: "bad", title: t("revokeFailed"), msg: res.userMessage })
      return
    }
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      {pack.accessKind !== "allowlist" && (
        <p className="text-xs text-txt-dim">{t("aclIrrelevant")}</p>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field
            label={t("grantUuid")}
            hint={t("grantUuidHint")}
            error={uuid && !uuidValid ? t("uuidInvalid") : undefined}
          >
            <Input
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="069a79f4-44e9-4726-a5be-fca90e38aaf5"
            />
          </Field>
        </div>
        <Button icon="plus" disabled={!uuidValid} loading={busy} onClick={() => void grant()}>
          {t("grant")}
        </Button>
      </div>

      {!rows && <Spinner />}
      {rows && rows.length === 0 && (
        <Empty icon="users" title={t("noAccess")} lead={t("noAccessLead")} />
      )}
      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-1">
          {rows.map((row) => (
            <div
              key={row.uuid}
              className="flex items-center gap-3 border-b border-line py-2 last:border-0"
            >
              <span className="font-mono text-[12px] text-txt">{row.uuid}</span>
              <span className="ml-auto font-mono text-[11px] text-txt-dim">
                {new Date(row.grantedAt).toLocaleDateString()}
              </span>
              <Button size="sm" variant="ghost" icon="trash" onClick={() => void revoke(row.uuid)}>
                {t("revoke")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InvitesTab({ pack }: { pack: AdminPack }) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<InviteRow[] | null>(null)
  const [maxUses, setMaxUses] = useState("1")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await PacksService.invites(pack.id)
    setRows(res.success ? (res.data ?? []) : [])
  }, [pack.id])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    setBusy(true)
    try {
      const res = await PacksService.createInvite(pack.id, Number(maxUses) || 1)
      if (!res.success) {
        toast({ tone: "bad", title: t("inviteFailed"), msg: res.userMessage })
        return
      }
      toast({ tone: "ok", title: t("inviteCreated"), msg: res.data?.code })
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <div className="w-[160px]">
          <Field label={t("maxUses")}>
            <Input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </Field>
        </div>
        <Button icon="plus" loading={busy} onClick={() => void create()}>
          {t("newInvite")}
        </Button>
      </div>

      {!rows && <Spinner />}
      {rows && rows.length === 0 && <Empty icon="mail" title={t("noInvites")} />}
      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-1">
          {rows.map((inv) => (
            <div
              key={inv.code}
              className="flex flex-wrap items-center gap-3 border-b border-line py-2 last:border-0"
            >
              <span className="font-mono text-[13px] font-semibold text-accent-bright">
                {inv.code}
              </span>
              {inv.revoked ? (
                <AvPill tone="bad">{t("revoked")}</AvPill>
              ) : inv.uses >= inv.maxUses ? (
                <AvPill tone="warn">{t("exhausted")}</AvPill>
              ) : (
                <AvPill tone="ok">{t("active")}</AvPill>
              )}
              <span className="font-mono text-[11px] text-txt-dim">
                {inv.uses}/{inv.maxUses}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon="copy"
                  onClick={() => void navigator.clipboard?.writeText(inv.code)}
                >
                  {t("copy")}
                </Button>
                {!inv.revoked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="x"
                    onClick={async () => {
                      await PacksService.revokeInvite(inv.code)
                      await load()
                    }}
                  >
                    {t("revoke")}
                  </Button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AuditTab({ pack }: { pack: AdminPack }) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<AuditRow[] | null>(null)

  useEffect(() => {
    void PacksService.audit(pack.id).then((res) =>
      setRows(res.success ? (res.data ?? []) : []),
    )
  }, [pack.id])

  if (!rows) return <Spinner />
  if (rows.length === 0) return <Empty icon="list" title={t("noAudit")} />

  return (
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
          <span className="font-mono text-[11px] text-txt-dim">
            {new Date(row.at).toLocaleString()}
          </span>
          <AvPill>{row.action}</AvPill>
          {row.uuid && <span className="font-mono text-[11px] text-txt-muted">{row.uuid}</span>}
        </div>
      ))}
    </div>
  )
}

export function PacksAdmin() {
  const t = useTranslations("admin.packs")
  const [packs, setPacks] = useState<AdminPack[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState("versions")

  const load = useCallback(async () => {
    const res = await PacksService.list()
    setPacks(res.success ? (res.data ?? []) : [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pack = useMemo(
    () => packs?.find((p) => p.id === selected) ?? null,
    [packs, selected],
  )

  const totals = useMemo(() => {
    const list = packs ?? []
    return {
      packs: list.length,
      versions: list.reduce((n, p) => n + p.versionCount, 0),
      grants: list.reduce((n, p) => n + p.aclCount, 0),
    }
  }, [packs])

  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />

      <AvKpis>
        <AvKpi label={t("kpiPacks")} value={totals.packs} icon="cube" />
        <AvKpi label={t("kpiVersions")} value={totals.versions} icon="layers" />
        <AvKpi label={t("kpiGrants")} value={totals.grants} icon="users" />
      </AvKpis>

      <div className="mt-5 flex justify-end">
        <Button variant="pri" icon="plus" onClick={() => setCreating(true)}>
          {t("newPack")}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 [grid-template-columns:minmax(0,340px)_minmax(0,1fr)] max-[1100px]:grid-cols-1">
        <AvPanel title={t("packs")} icon="cube">
          {!packs && <Spinner />}
          {packs && packs.length === 0 && (
            <Empty icon="cube" title={t("noPacks")} lead={t("noPacksLead")} />
          )}
          <div className="flex flex-col gap-1">
            {packs?.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={[
                  "cut border-2 border-solid px-3 py-2.5 text-left transition-colors duration-[140ms]",
                  p.id === selected
                    ? "border-accent bg-accent-soft"
                    : "border-transparent hover:border-line-2",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span className="font-display text-[14px] font-bold uppercase tracking-[0.06em] text-txt">
                    {p.name}
                  </span>
                  {p.archived && <AvPill tone="bad">{t("archived")}</AvPill>}
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <AccessPill kind={p.accessKind} />
                  <span className="font-mono text-[10px] text-txt-dim">
                    {p.versionCount} {t("versionsShort")} · {p.aclCount} {t("grantsShort")}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </AvPanel>

        {pack ? (
          <AvPanel
            title={pack.name}
            aside={
              <span className="flex items-center gap-2">
                <Badge tone={pack.latestVersionId ? "ok" : "warn"}>
                  {pack.latestVersionId ? t("live") : t("noPublished")}
                </Badge>
                <Button
                  size="sm"
                  variant={pack.archived ? "default" : "ghost"}
                  icon={pack.archived ? "refresh" : "trash"}
                  onClick={async () => {
                    // Archive rather than delete: pack_audit keeps its history
                    // and a launcher that cached the id can still resolve it.
                    const res = await PacksService.update(pack.id, {
                      archived: !pack.archived,
                    })
                    if (!res.success) {
                      toast({ tone: "bad", title: t("archiveFailed"), msg: res.userMessage })
                      return
                    }
                    await load()
                  }}
                >
                  {pack.archived ? t("unarchive") : t("archive")}
                </Button>
              </span>
            }
          >
            <p className="mb-4 font-mono text-[11px] text-txt-dim">{pack.slug}</p>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "versions", label: t("tabVersions"), count: pack.versionCount },
                { value: "access", label: t("tabAccess"), count: pack.aclCount },
                { value: "invites", label: t("tabInvites") },
                { value: "audit", label: t("tabAudit") },
              ]}
            />
            <div className="mt-4">
              {tab === "versions" && <VersionsTab pack={pack} onChanged={load} />}
              {tab === "access" && <AccessTab pack={pack} />}
              {tab === "invites" && <InvitesTab pack={pack} />}
              {tab === "audit" && <AuditTab pack={pack} />}
            </div>
          </AvPanel>
        ) : (
          <AvPanel title={t("detail")}>
            <Empty icon="cube" title={t("selectPack")} lead={t("selectPackLead")} />
          </AvPanel>
        )}
      </div>

      <CreatePackModal open={creating} onClose={() => setCreating(false)} onCreated={load} />
    </div>
  )
}
