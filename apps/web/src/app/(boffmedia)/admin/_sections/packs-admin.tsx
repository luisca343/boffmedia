"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Badge, Button, Empty, Field, Icon, Input, PackListItem, Spinner, Tabs, toast, VersionRow } from "@boffmedia/ui"
import { AvMetric, AvPanel, AvPill, AvSectionHead } from "../_components/ui/av-kit"
import { ConfirmModal, PackForm } from "../_components/packs/pack-form"
import { PackServerEditor } from "../_components/packs/pack-server-editor"
import { VersionEditor } from "../_components/packs/version-editor"
import {
  type AccessRow,
  type AdminPack,
  type AuditRow,
  type GrantingEvent,
  type LegacyAccessRow,
  type UserSearchHit,
  type InviteRow,
  type PackVersionRow,
  PacksService,
} from "@/services/api/boffmedia/packsService"

// HANDOFF §4.1 — pack authoring lives here, not in the launcher. The desktop
// app only installs and plays; creating packs, cutting versions and granting
// access are admin work and belong on a real screen with a keyboard.
//
// Everything is a pane in the detail column, CurseForge-style: the packs list
// never disappears and every view is a URL, so back and refresh both work.

const ACCESS_TONE = {
  public: "ok",
  password: "info",
  allowlist: "accent",
} as const

/** Detail-column views. Anything other than `detail` is driven by `?view=`. */
type View = "detail" | "new-pack" | "edit-pack" | "new-version" | "clone-version" | "edit-version"

const VERSION_VIEWS: Record<string, "create" | "clone" | "edit"> = {
  "new-version": "create",
  "clone-version": "clone",
  "edit-version": "edit",
}

function AccessPill({ kind }: { kind: AdminPack["accessKind"] }) {
  const t = useTranslations("admin.packs")
  return (
    <AvPill tone={ACCESS_TONE[kind]} icon={kind === "public" ? "globe" : "lock"}>
      {t(`access.${kind}`)}
    </AvPill>
  )
}

function VersionsTab({
  pack,
  onChanged,
  onNewVersion,
  onCloneVersion,
  onEditVersion,
  reloadToken,
}: {
  pack: AdminPack
  onChanged: () => void
  onNewVersion: () => void
  onCloneVersion: (versionId: string) => void
  onEditVersion: (versionId: string) => void
  /** Bumped by the version editor so the list reloads after a create or edit. */
  reloadToken: number
}) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<PackVersionRow[] | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PackVersionRow | null>(null)

  const load = useCallback(async () => {
    const res = await PacksService.versions(pack.id)
    setRows(res.success ? (res.data ?? []) : [])
  }, [pack.id])

  useEffect(() => {
    void load()
  }, [load, reloadToken])

  const remove = async (versionId: string) => {
    const res = await PacksService.deleteVersion(pack.id, versionId)
    if (!res.success) {
      toast({ tone: "bad", title: t("deleteFailed"), msg: res.userMessage })
      return
    }
    toast({ tone: "ok", title: t("versionDeleted") })
    await load()
    onChanged()
  }

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

  if (!rows) return <Spinner />

  return (
    <>
      {rows.length === 0 ? (
        <Empty icon="layers" title={t("noVersions")} lead={t("noVersionsLead")}>
          <Button size="sm" variant="pri" icon="plus" onClick={onNewVersion}>
            {t("newVersion")}
          </Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-txt-dim">
              {t("tabVersions")}
            </span>
            <Button size="sm" variant="pri" icon="plus" onClick={onNewVersion}>
              {t("newVersion")}
            </Button>
          </div>
          {rows.map((v) => (
            <VersionRow
              key={v.id}
              status={v.published ? "live" : "draft"}
              statusIcon={<Icon name={v.published ? "check" : "layers"} size={16} />}
              version={v.name}
              badges={<>
                {v.published ? <AvPill tone="ok">{t("publishedPill")}</AvPill> : <AvPill tone="warn">{t("draft")}</AvPill>}
                {pack.latestVersionId === v.id && <AvPill tone="accent">{t("latest")}</AvPill>}
              </>}
              // `minecraft`/`loader` are the Minecraft spec block. Printing
              // them for an emulator pack rendered a literal "null · vanilla".
              meta={
                pack.gameType === "minecraft" ? (
                  <>
                    {v.minecraft} ·{" "}
                    {v.loader ? `${v.loader} ${v.loaderVersion ?? ""}` : t("vanilla")} ·{" "}
                    {v.fileCount} {t("files")}
                  </>
                ) : (
                  <>
                    {v.emulatorKind ? `${v.emulatorKind} · ` : ""}
                    {v.fileCount} {t("files")}
                  </>
                )
              }
              date={new Date(v.createdAt).toLocaleDateString()}
              actions={<>
                <Button size="sm" variant="ghost" icon="copy" onClick={() => onCloneVersion(v.id)}>{t("clone")}</Button>
                {!v.published && <>
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => onEditVersion(v.id)}>{t("edit")}</Button>
                  <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmDelete(v)}>{t("delete")}</Button>
                  <Button size="sm" variant="pri" icon="check" loading={publishing === v.id} onClick={() => void publish(v.id)}>{t("publish")}</Button>
                </>}
              </>}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title={t("confirmDeleteVersion")}
        lead={confirmDelete ? t("confirmDeleteVersionLead", { name: confirmDelete.name }) : undefined}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => (confirmDelete ? remove(confirmDelete.id) : undefined)}
      />
    </>
  )
}

function AccessTab({ pack }: { pack: AdminPack }) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<AccessRow[] | null>(null)
  const [legacy, setLegacy] = useState<LegacyAccessRow[]>([])
  const [events, setEvents] = useState<GrantingEvent[]>([])
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<UserSearchHit[]>([])
  const [uuid, setUuid] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<{
    userId: number
    source: AccessRow["source"]
  } | null>(null)
  const [confirmRevokeUuid, setConfirmRevokeUuid] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await PacksService.access(pack.id)
    setRows(res.success ? (res.data?.grants ?? []) : [])
    setLegacy(res.success ? (res.data?.legacy ?? []) : [])
    setEvents(res.success ? (res.data?.events ?? []) : [])
  }, [pack.id])

  // Debounced so typing a username is not one request per keystroke.
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setHits([])
      return
    }
    const timer = setTimeout(async () => {
      const res = await PacksService.searchUsers(term)
      setHits(res.success ? (res.data ?? []) : [])
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const grantToUser = async (userId: number) => {
    setBusy(true)
    try {
      const res = await PacksService.grantToUser(pack.id, userId)
      if (!res.success) {
        toast({ tone: "bad", title: t("grantFailed"), msg: res.userMessage })
        return
      }
      setQuery("")
      setHits([])
      await load()
    } finally {
      setBusy(false)
    }
  }

  // Scoped to one source: an admin grant and an invite grant can coexist, and
  // the row the admin clicked is the only one that should disappear.
  const revokeUser = async (userId: number, source: AccessRow["source"]) => {
    const res = await PacksService.revokeFromUser(pack.id, userId, source)
    if (!res.success) {
      toast({ tone: "bad", title: t("revokeFailed"), msg: res.userMessage })
      return
    }
    await load()
  }

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

      {/* The normal path: a pack is an account-level entitlement. */}
      <div>
        <Field label={t("grantUser")} hint={t("grantUserHint")}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("grantUserPlaceholder")}
          />
        </Field>
        {hits.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 border border-solid border-line bg-panel-2 p-2 cut-tag">
            {hits.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={busy}
                onClick={() => void grantToUser(u.id)}
                className="flex items-center gap-3 px-2 py-1.5 text-left hover:bg-panel disabled:opacity-50"
              >
                <span className="font-medium text-txt">{u.username}</span>
                <span className="font-mono text-[11px] text-txt-dim">{u.email}</span>
                <Icon name="plus" size={13} className="ml-auto text-accent" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The exception: a player who has not registered yet. */}
      <details className="border border-solid border-line bg-panel-2 p-3 cut-tag">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">
          {t("preGrantTitle")}
        </summary>
        <p className="mt-2 text-xs text-txt-dim">{t("preGrantHint")}</p>
        <div className="mt-3 flex items-end gap-3">
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
        {legacy.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {legacy.map((row) => (
              <div
                key={row.uuid}
                className="flex items-center gap-3 border-b border-line py-2 last:border-0"
              >
                <span className="font-mono text-[12px] text-txt">{row.uuid}</span>
                <span className="ml-auto font-mono text-[11px] text-txt-dim">
                  {new Date(row.grantedAt).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  onClick={() => setConfirmRevokeUuid(row.uuid)}
                >
                  {t("revoke")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </details>

      {/* Event members hold no ACL row: access derives from membership at every
          check, so the grant list alone under-reports who can install this. */}
      {events.length > 0 && (
        <div className="flex flex-col gap-1 border border-solid border-line bg-panel-2 p-3 cut-tag">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
            {t("derivedFromEvents")}
          </span>
          {events.map((e) => (
            <div key={e.eventId} className="flex items-center gap-3">
              <span className="text-sm text-txt">{e.title}</span>
              <span className="font-mono text-[11px] text-txt-dim">
                {e.status} · {e.visibility}
              </span>
              <span className="ml-auto font-mono text-[11px] text-txt">
                {t("derivedMembers", { count: e.memberCount })}
              </span>
            </div>
          ))}
        </div>
      )}

      {!rows && <Spinner />}
      {rows && rows.length === 0 && legacy.length === 0 && events.length === 0 && (
        <Empty icon="users" title={t("noAccess")} lead={t("noAccessLead")} />
      )}
      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-1">
          {rows.map((row) => (
            <div
              key={`${row.userId}-${row.source}`}
              className="flex items-center gap-3 border-b border-line py-2 last:border-0"
            >
              <span className="font-medium text-txt">{row.username}</span>
              <span className="font-mono text-[11px] text-txt-dim">{row.email}</span>
              <AvPill tone={row.source === "invite" ? "accent" : "default"}>
                {t(row.source === "invite" ? "sourceInvite" : "sourceAdmin")}
              </AvPill>
              <span className="ml-auto font-mono text-[11px] text-txt-dim">
                {new Date(row.grantedAt).toLocaleDateString()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                onClick={() => setConfirmRevoke({ userId: row.userId, source: row.source })}
              >
                {t("revoke")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmRevoke !== null}
        title={t("confirmRevokeAccess")}
        lead={
          confirmRevoke !== null
            ? t("confirmRevokeUserLead", {
                name:
                  rows?.find(
                    (r) => r.userId === confirmRevoke.userId && r.source === confirmRevoke.source,
                  )?.username ?? String(confirmRevoke.userId),
              })
            : undefined
        }
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() =>
          confirmRevoke !== null
            ? revokeUser(confirmRevoke.userId, confirmRevoke.source)
            : undefined
        }
      />

      <ConfirmModal
        open={confirmRevokeUuid !== null}
        title={t("confirmRevokeAccess")}
        lead={
          confirmRevokeUuid ? t("confirmRevokeAccessLead", { uuid: confirmRevokeUuid }) : undefined
        }
        onClose={() => setConfirmRevokeUuid(null)}
        onConfirm={() => (confirmRevokeUuid ? revoke(confirmRevokeUuid) : undefined)}
      />
    </div>
  )
}

function InvitesTab({ pack }: { pack: AdminPack }) {
  const t = useTranslations("admin.packs")
  const [rows, setRows] = useState<InviteRow[] | null>(null)
  const [maxUses, setMaxUses] = useState("1")
  const [busy, setBusy] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

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
                    onClick={() => setConfirmRevoke(inv.code)}
                  >
                    {t("revoke")}
                  </Button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmRevoke !== null}
        title={t("confirmRevokeInvite")}
        lead={confirmRevoke ? t("confirmRevokeInviteLead", { code: confirmRevoke }) : undefined}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={async () => {
          if (!confirmRevoke) return
          await PacksService.revokeInvite(confirmRevoke)
          await load()
        }}
      />
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [packs, setPacks] = useState<AdminPack[] | null>(null)
  const [versionsToken, setVersionsToken] = useState(0)
  const [tab, setTab] = useState("versions")
  const [query, setQuery] = useState("")

  // The whole section is addressable: ?pack=<slug>&view=<view>&version=<id>.
  const packSlug = searchParams.get("pack")
  const rawView = searchParams.get("view") ?? "detail"
  const view = (
    ["detail", "new-pack", "edit-pack", "new-version", "clone-version", "edit-version"].includes(rawView)
      ? rawView
      : "detail"
  ) as View
  const versionId = searchParams.get("version") ?? undefined

  /** Writes the pack/view/version triple in one push so back undoes one step,
   *  not three. `null` drops the param. */
  const go = useCallback(
    (next: { pack?: string | null; view?: View | null; version?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === undefined || value === "detail") params.delete(key)
        else params.set(key, value)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const load = useCallback(async () => {
    const res = await PacksService.list()
    setPacks(res.success ? (res.data ?? []) : [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pack = useMemo(
    () => packs?.find((p) => p.slug === packSlug) ?? null,
    [packs, packSlug],
  )

  const totals = useMemo(() => {
    const list = packs ?? []
    return {
      packs: list.length,
      versions: list.reduce((n, p) => n + p.versionCount, 0),
      grants: list.reduce((n, p) => n + p.aclCount, 0),
    }
  }, [packs])

  const versionMode = VERSION_VIEWS[view]
  // An edit/clone URL without its version id is a dead view — fall back to the
  // pack detail rather than mounting an editor that prefills from nothing.
  const editorMode =
    versionMode && (versionMode === "create" || versionId) ? versionMode : undefined

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return packs ?? []
    return (packs ?? []).filter(
      (p) =>
        p.name.toLowerCase().includes(needle) || p.slug.toLowerCase().includes(needle),
    )
  }, [packs, query])

  return (
    // The whole section is a fixed-height app: header, then two columns that
    // scroll independently. Nothing here scrolls the page.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <AvSectionHead
          title={t("title")}
          desc={t("desc")}
          actions={
            <>
              {/* Counts as an inline strip: three KPI cards cost ~110px of
                  height that the pack list wants more than the numbers do. */}
              <span className="flex items-center gap-4 border border-solid border-line bg-panel px-4 py-2.5">
                {[
                  [t("kpiPacks"), totals.packs],
                  [t("kpiVersions"), totals.versions],
                  [t("kpiGrants"), totals.grants],
                ].map(([label, value]) => (
                  <span key={String(label)} className="flex flex-col gap-0.5">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-txt-dim">
                      {label}
                    </span>
                    <span className="font-display text-[19px] font-extrabold leading-none text-txt">
                      {value}
                    </span>
                  </span>
                ))}
              </span>
              {view !== "detail" && (
                <Button
                  variant="ghost"
                  icon="back"
                  onClick={() => go({ view: null, version: null })}
                >
                  {t("backToPack")}
                </Button>
              )}
              <Button
                variant="pri"
                icon="plus"
                disabled={view === "new-pack"}
                onClick={() => go({ pack: null, view: "new-pack", version: null })}
              >
                {t("newPack")}
              </Button>
            </>
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 [grid-template-columns:minmax(0,300px)_minmax(0,1fr)] max-[1100px]:grid-cols-1 max-[1100px]:overflow-auto">
        <AvPanel
          title={t("packs")}
          icon="cube"
          className="mb-0 flex min-h-0 flex-col max-[1100px]:h-[320px]"
          bodyClassName="flex min-h-0 flex-1 flex-col gap-2"
        >
          {/* Outside the scroller: the filter must stay reachable however far
              down a long pack list you are. */}
          <div className="relative shrink-0">
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-txt-dim"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("filterPacks")}
              className="pl-9"
            />
          </div>
          {!packs && <Spinner />}
          {packs && packs.length === 0 && (
            <Empty icon="cube" title={t("noPacks")} lead={t("noPacksLead")} />
          )}
          {packs && packs.length > 0 && filtered.length === 0 && (
            <p className="font-body text-[12px] text-txt-dim">{t("noPackMatches")}</p>
          )}
          <div className="bm-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-auto pr-1">
            {filtered.map((p) => (
              <PackListItem
                key={p.id}
                selected={p.slug === packSlug}
                onClick={() => go({ pack: p.slug, view: null, version: null })}
                media={p.iconUrl ? <img src={p.iconUrl} alt="" className="size-full object-cover" /> : <Icon name="cube" size={16} />}
                name={p.name}
                slug={p.slug}
                summary={p.summary || undefined}
                badges={<>
                  <AccessPill kind={p.accessKind} />
                  {p.gameType !== "minecraft" && <AvPill tone="info" icon="layers">{t(`gameType.${p.gameType}`)}</AvPill>}
                  <AvPill tone={p.latestVersionId ? "ok" : "warn"}>{p.latestVersionId ? t("live") : t("noPublished")}</AvPill>
                  {p.archived && <AvPill tone="bad">{t("archived")}</AvPill>}
                </>}
                count={<>{p.versionCount} {t("versionsShort")} · {p.aclCount} {t("grantsShort")}</>}
              />
            ))}
          </div>
        </AvPanel>

        {view === "new-pack" ? (
          <PackForm
            onClose={() => go({ view: null })}
            onCreated={async (slug) => {
              await load()
              go({ pack: slug, view: null })
            }}
          />
        ) : view === "edit-pack" && pack ? (
          <PackForm
            key={pack.id}
            pack={pack}
            onClose={() => go({ view: null })}
            onSaved={async () => {
              await load()
              go({ view: null })
            }}
          />
        ) : pack && editorMode ? (
          <VersionEditor
            // Mounted per target: the editor prefills once, and reusing an
            // instance would carry the previous version's mods into the next.
            key={`${editorMode}:${versionId ?? "new"}`}
            pack={pack}
            mode={editorMode}
            sourceVersionId={versionId}
            onClose={() => go({ view: null, version: null })}
            onSaved={() => {
              setVersionsToken((n) => n + 1)
              void load()
              go({ view: null, version: null })
            }}
          />
        ) : pack ? (
          <AvPanel
            title={
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-display text-[15px] font-bold tracking-[0.05em] text-txt">
                  {pack.name}
                </span>
                <span className="truncate font-mono text-[10px] font-normal tracking-normal text-txt-dim">
                  {pack.slug}
                </span>
              </span>
            }
            icon="cube"
            className="mb-0 flex min-h-0 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col"
            aside={
              <span className="flex items-center gap-2">
                {pack.gameType !== "minecraft" && (
                  <Badge tone="info">
                    {t(`gameType.${pack.gameType}`)}
                  </Badge>
                )}
                <Badge tone={pack.latestVersionId ? "ok" : "warn"}>
                  {pack.latestVersionId ? t("live") : t("noPublished")}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="edit"
                  onClick={() => go({ view: "edit-pack", version: null })}
                >
                  {t("editPack")}
                </Button>
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
             <div className="mb-4 grid shrink-0 gap-2 sm:grid-cols-[minmax(0,1fr)_120px_120px]">
               <div className="min-w-0 border border-solid border-line bg-panel-2 p-3">
                 <div className="flex flex-wrap items-center gap-2">
                   <AccessPill kind={pack.accessKind} />
                   <span className="font-mono text-[10px] text-txt-dim">{pack.slug}</span>
                 </div>
                 {pack.summary && (
                   <p className="mt-2 line-clamp-2 text-[12px] leading-[1.45] text-txt-muted">{pack.summary}</p>
                 )}
               </div>
                <AvMetric value={pack.versionCount} label={t("tabVersions")} tone="accent" />
                <AvMetric value={pack.aclCount} label={t("tabAccess")} />
             </div>
             {pack.gameType === "minecraft" && (
               <div className="mb-4 shrink-0">
                 <PackServerEditor key={pack.id} pack={pack} onSaved={load} />
               </div>
             )}
             <div className="shrink-0">
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
            </div>
            <div className="bm-scroll mt-4 min-h-0 flex-1 overflow-auto pr-1">
              {tab === "versions" && (
                <VersionsTab
                  pack={pack}
                  onChanged={load}
                  reloadToken={versionsToken}
                  onNewVersion={() => go({ view: "new-version", version: null })}
                  onCloneVersion={(id) => go({ view: "clone-version", version: id })}
                  onEditVersion={(id) => go({ view: "edit-version", version: id })}
                />
              )}
              {tab === "access" && <AccessTab pack={pack} />}
              {tab === "invites" && <InvitesTab pack={pack} />}
              {tab === "audit" && <AuditTab pack={pack} />}
            </div>
          </AvPanel>
        ) : (
          <AvPanel
            title={t("detail")}
            className="mb-0 flex min-h-0 flex-col"
            bodyClassName="grid min-h-0 flex-1 place-items-center"
          >
            <Empty icon="cube" title={t("selectPack")} lead={t("selectPackLead")} />
          </AvPanel>
        )}
      </div>
    </div>
  )
}
