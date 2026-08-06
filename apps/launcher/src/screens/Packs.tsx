import { useEffect, useMemo, useState } from "react"

import {
  Badge,
  Button,
  CatalogIcon,
  Empty,
  Field,
  Icon,
  Input,
  Kicker,
  Menu,
  Modal,
  PackCard,
  Progress,
  SearchInput,
  toast,
} from "@boffmedia/ui"
import type { MenuItem } from "@boffmedia/ui"

import { useT } from "../i18n"
import { VersionPicker, dependenciesOf } from "../components/VersionPicker"
import type { VersionChoice } from "../components/VersionPicker"
import {
  exportMrpack,
  exportServerMrpack,
  instanceReveal,
  localPackDuplicate,
  localPackSave,
  serverStatus,
} from "../runtime"
import { ImportPackPage } from "../components/pack/ImportPackPage"
import { DeleteLocalPackModal, UninstallPackModal } from "../components/pack/PackDeleteDialogs"
import type { InstallState, PackEntry, ServerStatus } from "../services/types"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatPlaytime, formatWhen } from "../utils/format"
import { PHASE_LABEL } from "../utils/labels"

/** RF-03/RF-04: pings once on mount, only when the pack declares a server, and
 *  degrades silently to offline — there is no error state to render, so a
 *  ping that throws is caught and folded into the same offline badge a timeout
 *  produces. */
function ServerStatusBadge({ host, port }: { host: string; port: number }) {
  const t = useT("packs")
  const [status, setStatus] = useState<ServerStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void serverStatus(host, port)
      .then((s) => {
        if (!cancelled) setStatus(s)
      })
      .catch(() => {
        if (!cancelled) setStatus({ online: false, players: null, motd: null, latencyMs: null })
      })
    return () => {
      cancelled = true
    }
  }, [host, port])

  if (!status) return <Badge tone="info">{t("consulting")}</Badge>
  if (!status.online) return <Badge tone="bad">{t("serverOffline")}</Badge>
  return (
    <Badge tone="ok">
      {status.players ? t("playersOnline", { online: status.players.online, max: status.players.max }) : t("serverOnline")}
    </Badge>
  )
}

function StateBadge({ state }: { state: InstallState }) {
  const t = useT("packs")
  switch (state.kind) {
    case "installed":
      return <Badge tone="ok">{t("installedState")}</Badge>
    case "outdated":
      return <Badge tone="warn">{t("outdatedState")}</Badge>
    case "installing":
      return <Badge tone="info">{t("installingState")}</Badge>
    case "broken":
      return <Badge tone="bad">{t("brokenState")}</Badge>
    default:
      return <Badge>{t("notAvailable")}</Badge>
  }
}

function AccessBadge({ entry }: { entry: PackEntry }) {
  const t = useT("packs")
  const kind = entry.pack.accessKind
  if (kind === "public") return <Badge>{t("publicAccess")}</Badge>
  if (kind === "password") return <Badge tone="info">{t("passwordAccess")}</Badge>
  return <Badge tone="live">{t("grantedAccess")}</Badge>
}

/** A library card. The visual chassis (header, server/client banner, footer,
 *  geometry) lives in the shared `@boffmedia/ui` PackCard; this wires the
 *  launcher-specific pieces into its slots — the live server-status ping, the
 *  state-driven action button, and the kebab of per-pack actions — and owns the
 *  destructive-action modals.
 *
 *  Menu vocabulary is split across two namespaces on purpose: the edit /
 *  duplicate / export labels and their result toasts already exist under
 *  `packDetail` (the detail screen offers the same actions), so the card reuses
 *  them via `tp` rather than cloning the strings; only the library-only actions
 *  (delete, uninstall, open folder) are new `packs` keys. */
function LibraryCard({ entry }: { entry: PackEntry }) {
  const t = useT("packs")
  const tp = useT("packDetail")
  const { go, install, play, repair, game, offline, reloadPacks } = useLauncher()
  const { pack, latest, state } = entry
  const busy = game.kind === "preparing" || game.kind === "running"
  const running = game.kind === "running"
  // A pack with no published version is listed but cannot be installed —
  // offering the button anyway would produce a 404 the player cannot act on.
  const needsInstall =
    !!latest && (state.kind === "not-installed" || state.kind === "outdated")
  const isLocal = entry.origin === "local"
  // "Has files on disk", the condition for Open folder / Uninstall — a broken
  // install still has a directory to open and to remove.
  const installed =
    state.kind === "installed" || state.kind === "outdated" || state.kind === "broken"
  const showMenu = isLocal || installed

  const [deleting, setDeleting] = useState(false)
  const [uninstalling, setUninstalling] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const doDuplicate = async () => {
    setDuplicating(true)
    try {
      const copy = await localPackDuplicate(pack.slug, "")
      toast.success(tp("duplicateSuccess", { name: copy.pack.name }))
      reloadPacks()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? tp("duplicateError"))
    } finally {
      setDuplicating(false)
    }
  }

  const doExport = async (serverOnly: boolean) => {
    try {
      await (serverOnly ? exportServerMrpack : exportMrpack)(pack.slug)
      toast.success(tp("exportSuccess"))
    } catch (err) {
      const message = (err as { message?: string })?.message
      if (message !== tp("exportCancelled")) toast.error(message ?? tp("exportError"))
    }
  }

  const openFolder: MenuItem = {
    label: t("openInstanceFolder"),
    icon: "folder",
    onSelect: () => void instanceReveal(pack.slug, ""),
  }
  const menuItems: MenuItem[] = isLocal
    ? [
        { label: tp("editLocalMenu"), icon: "edit", onSelect: () => go("pack", pack.id, { edit: true }) },
        {
          label: duplicating ? tp("duplicatingMenu") : tp("duplicateLocalMenu"),
          icon: "copy",
          onSelect: () => void doDuplicate(),
        },
        { label: tp("exportMenu"), icon: "upload", onSelect: () => void doExport(false) },
        { label: tp("exportServerMenu"), icon: "upload", onSelect: () => void doExport(true) },
        ...(installed ? [openFolder] : []),
        { sep: true },
        {
          label: t("deleteLocalMenu"),
          icon: "trash",
          danger: true,
          disabled: state.kind === "installing",
          onSelect: () => setDeleting(true),
        },
      ]
    : [
        openFolder,
        {
          label: t("uninstallMenu"),
          icon: "trash",
          danger: true,
          disabled: state.kind === "installing",
          onSelect: () => setUninstalling(true),
        },
      ]

  const actions =
    state.kind === "broken" ? (
      <Button
        size="sm"
        variant="default"
        icon="refresh"
        // Repair re-downloads the broken files, so it needs a network too.
        disabled={!latest || offline}
        title={offline ? t("repairOfflineTitle") : undefined}
        onClick={() => void repair(pack.id)}
      >
        {t("repair")}
      </Button>
    ) : (
      <Button
        size="sm"
        variant={needsInstall ? "default" : "pri"}
        icon={needsInstall ? "download" : "play"}
        loading={state.kind === "installing" || (!needsInstall && game.kind === "preparing")}
        // Offline, installing is impossible — but PLAYING an already installed
        // pack is exactly what offline mode exists for, so only the install half
        // is disabled.
        disabled={!latest || (needsInstall && offline) || (!needsInstall && busy)}
        title={needsInstall && offline ? t("installOfflineTitle") : undefined}
        onClick={() => {
          // Launching from the card is the whole point of the library screen;
          // sending the player to the detail view to press a second button is
          // what made every pack look unplayable from here.
          if (needsInstall) void install(pack.id)
          else void play(pack.id)
        }}
      >
        {!latest
          ? t("notAvailable")
          : state.kind === "outdated"
            ? t("update")
            : needsInstall
              ? t("install")
              : running
                ? t("running")
                : t("play")}
      </Button>
    )

  return (
    <>
      <PackCard
        icon={<CatalogIcon src={pack.iconUrl ?? undefined} size={28} />}
        title={pack.name}
        stateBadge={<StateBadge state={state} />}
        type={entry.server ? "server" : "client"}
        // RF-02: the status ping only ever runs when the pack declares a server.
        serverStatus={
          entry.server ? <ServerStatusBadge host={entry.server.host} port={entry.server.port} /> : undefined
        }
        summary={pack.summary}
        progress={
          state.kind === "installing" ? (
            <>
              <Progress value={state.progress.fraction * 100} />
              <p className="mt-1.5 truncate font-mono text-[11px] text-txt-dim">
                {PHASE_LABEL[state.progress.phase]}
                {state.progress.currentFile ? ` · ${state.progress.currentFile}` : ""}
              </p>
            </>
          ) : undefined
        }
        error={state.kind === "broken" ? state.reason : undefined}
        badges={
          <>
            <AccessBadge entry={entry} />
            <span className="font-mono text-[11px] text-txt-dim">
              {latest
                ? `${latest.minecraft} · ${t("filesCount", { count: latest.fileCount })}`
                : t("noPublishedVersion")}
            </span>
          </>
        }
        footerMeta={
          <>
            {entry.lastPlayed ? t("lastPlayed", { when: formatWhen(entry.lastPlayed) }) : t("neverPlayed")}
            {entry.playMs ? ` · ${t("playtime", { time: formatPlaytime(entry.playMs) })}` : ""}
            {state.kind === "installed" || state.kind === "outdated"
              ? ` · ${formatBytes(state.sizeBytes)}`
              : ""}
          </>
        }
        actions={actions}
        menu={
          showMenu ? (
            <Menu
              align="end"
              ariaLabel={tp("moreActions")}
              items={menuItems}
              trigger={
                <span className="inline-flex h-8 w-8 items-center justify-center border border-solid border-line text-txt-muted transition-colors hover:border-accent-line hover:text-accent-bright cut-tag [--cut-tag:6px]">
                  <Icon name="more" size={16} />
                </span>
              }
            />
          ) : undefined
        }
        onOpen={() => go("pack", pack.id)}
      />
      {isLocal && (
        <DeleteLocalPackModal
          open={deleting}
          slug={pack.slug}
          name={pack.name}
          onClose={() => setDeleting(false)}
          onDone={reloadPacks}
        />
      )}
      {!isLocal && (
        <UninstallPackModal
          open={uninstalling}
          slug={pack.slug}
          name={pack.name}
          blocked={running}
          onClose={() => setUninstalling(false)}
          onDone={reloadPacks}
        />
      )}
    </>
  )
}

/** RF-05: a minimal creation form — name, Minecraft version and loader. Mods
 *  are added afterwards from the pack's own detail view; this only needs to
 *  produce a valid, empty PackManifest for `local_pack_save` to persist. */
function CreateLocalPackModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const t = useT("packs")
  const [name, setName] = useState("")
  // Empty minecraft on purpose: the picker fills it with Mojang's latest
  // release once the real list arrives.
  const [choice, setChoice] = useState<VersionChoice>({ minecraft: "", loader: "", loaderVersion: "" })
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"))
      return
    }
    if (!choice.minecraft) {
      setError(t("versionRequired"))
      return
    }
    if (choice.loader && !choice.loaderVersion) {
      setError(t("loaderVersionRequired"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await localPackSave({
        formatVersion: 1,
        // No `id` at all rather than "": the schema requires a non-empty
        // string, and Rust only fills in what is absent.
        pack: { name: name.trim(), access: { kind: "public" } },
        version: {
          id: "local-v1",
          name: "local",
          createdAt: new Date().toISOString(),
          dependencies: dependenciesOf(choice),
          files: [],
        },
      })
      setName("")
      onCreated()
      onClose()
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("createLocalError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("modalTitle")}>
      <div className="flex flex-col gap-4">
        <Field label={t("nameField")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
        </Field>
        <VersionPicker value={choice} onChange={setChoice} onLoadingChange={setLoadingVersions} />
        {error && <p className="text-xs text-bad">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            {t("cancelButton")}
          </Button>
          <Button
            size="sm"
            variant="pri"
            loading={saving}
            disabled={loadingVersions}
            onClick={() => void create()}
          >
            {t("createButton")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function Packs() {
  const t = useT("packs")
  const { packs, packsLoading, packsError, reloadPacks } = useLauncher()
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return packs
    return packs.filter(
      (p) =>
        p.pack.name.toLowerCase().includes(q) ||
        (p.pack.summary ?? "").toLowerCase().includes(q) ||
        p.pack.slug.includes(q),
    )
  }, [packs, query])

  // The import page owns the whole screen while it is open: it hosts the mod
  // browser, which is three panes wide and does not fit beside the library.
  if (importing) {
    return (
      <ImportPackPage
        onBack={() => setImporting(false)}
        onImported={() => {
          reloadPacks()
          setImporting(false)
        }}
      />
    )
  }

  return (
    <div className="px-8 py-7">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>{t("librarySectionTitle")}</Kicker>
          <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
            {t("title")}
          </h1>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-[280px]">
            <SearchInput value={query} onChange={setQuery} placeholder={t("search")} size="sm" />
          </div>
          <Button size="sm" icon="upload" onClick={() => setImporting(true)}>
            {t("importButton")}
          </Button>
          <Button size="sm" variant="pri" icon="plus" onClick={() => setCreating(true)}>
            {t("createLocalButton")}
          </Button>
        </div>
      </header>

      <CreateLocalPackModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          reloadPacks()
          toast.success(t("createLocalSuccess"))
        }}
      />

      {/* Three distinct states, deliberately not collapsed into one: a server
          that cannot be reached is not the same as a library that is empty,
          and telling a player to ask for an invite when the API is down is how
          support tickets get filed against the wrong thing. */}
      {packsError && (
        <Empty icon="alert" title={t("libraryLoadError")} lead={packsError}>
          <Button size="sm" icon="refresh" onClick={reloadPacks}>
            {t("libraryErrorAction")}
          </Button>
        </Empty>
      )}

      {!packsError && packsLoading && packs.length === 0 && (
        <Empty icon="cube" title={t("loadingPacks")} lead={t("loadingPacaksDetail")} />
      )}

      {!packsError && !packsLoading && packs.length === 0 && (
        <Empty
          icon="cube"
          title={t("noPacksAvailable")}
          lead={t("noPacksDetail")}
        />
      )}

      {packs.length > 0 && shown.length === 0 && (
        <Empty icon="search" title={t("searchNoResultsTitle")} lead={t("searchNoResults", { query })} />
      )}

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {shown.map((entry) => (
          <LibraryCard key={entry.pack.id} entry={entry} />
        ))}
      </div>

      {packs.length > 0 && (
        <p className="mt-6 flex items-center gap-2 text-xs text-txt-dim">
          <Icon name="shield" size={13} />
          {t("accessInfo")}
        </p>
      )}
    </div>
  )
}
