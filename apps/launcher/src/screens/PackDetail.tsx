import { useEffect, useState } from "react"

import {
  Badge,
  Button,
  CatalogIcon,
  DataList,
  Divider,
  Empty,
  Field,
  Icon,
  Input,
  Kicker,
  Menu,
  Modal,
  Panel,
  Progress,
  Stats,
  Stepper,
  Tabs,
  toast,
} from "@boffmedia/ui"

import { useT } from "../i18n"
import { CrashDiagnosisCard } from "../components/CrashDiagnosis"
import { VersionPicker, dependenciesOf } from "../components/VersionPicker"
import type { VersionChoice } from "../components/VersionPicker"
import { InstanceSpace } from "../components/InstanceSpace"
import { BrowsePage } from "../components/pack/BrowsePage"
import { BackupsTab } from "../components/pack/BackupsTab"
import { ContentTab } from "../components/pack/ContentTab"
import { FilesTab } from "../components/pack/FilesTab"
import { WorldsTab } from "../components/pack/WorldsTab"
import { LogPanel } from "../components/pack/LogPanel"
import { exportMrpack, exportServerMrpack, localPackDuplicate, localPackGet, localPackSave } from "../runtime"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatDuration, formatWhen } from "../utils/format"
import { LOADER_LABEL, PHASE_LABEL, STEP_GROUPS } from "../utils/labels"

// The pack page follows the Modrinth app's information architecture — header,
// tabs, dense content — in this launcher's own visual language.
//
// What stays ABOVE the tabs is deliberate: install progress, a crash, and a
// running session are urgent and time-boxed, and burying any of them one click
// deep means a player watching a 4-minute install sees an idle-looking page.
// Everything that is reference material (the version table, access, integrity)
// moved into the Info tab, which is read once and then never again.

/** Ticks once a second so the running-time readout advances. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

/** The pack's own version, as the picker's shape. A pack with no version yet
 *  leaves `minecraft` empty so the picker fills it with Mojang's latest. */
function choiceOf(
  latest: { minecraft: string; loader: string | null; loaderVersion: string | null } | null,
): VersionChoice {
  return {
    minecraft: latest?.minecraft ?? "",
    loader: latest?.loader ?? "",
    loaderVersion: latest?.loaderVersion ?? "",
  }
}

/** RF-10: edit is only ever offered for a local pack, and only ever writes
 *  back to that SAME slug — `localPackSave` overwrites in place when the slug
 *  it is given already exists under `local-packs/`, so this can never create
 *  a second pack or touch a managed one. */
function EditLocalPackModal({
  open,
  onClose,
  onSaved,
  pack,
  latest,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  pack: { id: string; slug: string; name: string }
  latest: { minecraft: string; loader: string | null; loaderVersion: string | null } | null
}) {
  const t = useT("packDetail")
  const [name, setName] = useState(pack.name)
  const [choice, setChoice] = useState<VersionChoice>(() => choiceOf(latest))
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(pack.name)
    setChoice(choiceOf(latest))
  }, [open, pack.name, latest?.minecraft, latest?.loader, latest?.loaderVersion])

  const save = async () => {
    if (!name.trim()) {
      setError(t("nameError"))
      return
    }
    if (choice.loader && !choice.loaderVersion) {
      setError(t("loaderVersionError"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const current = await localPackGet(pack.slug)
      const dependencies = dependenciesOf(choice)
      await localPackSave({
        ...current,
        pack: { ...(current?.pack ?? { id: pack.id, slug: pack.slug, access: { kind: "public" } }), name: name.trim(), slug: pack.slug },
        version: { ...(current?.version ?? { id: "local-v1", name: "local", createdAt: new Date().toISOString(), files: [] }), dependencies },
      })
      onSaved()
      onClose()
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("editModal")}>
      <div className="flex flex-col gap-4">
        <Field label={t("nameField")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <VersionPicker
          key={pack.slug}
          value={choice}
          onChange={setChoice}
          onLoadingChange={setLoadingVersions}
        />
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
            onClick={() => void save()}
          >
            {t("saveButton")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

type TabKey = "content" | "files" | "worlds" | "backups" | "logs" | "info"

export function PackDetail() {
  const t = useT("packDetail")
  const { selected, install, play, repair, stop, game, go, logs, reloadPacks, offline } =
    useLauncher()
  const now = useNow(game.kind === "running")
  const [editing, setEditing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingServer, setExportingServer] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [tab, setTab] = useState<TabKey>("content")
  const [browsing, setBrowsing] = useState(false)
  const [contentNonce, setContentNonce] = useState(0)

  if (!selected) {
    return (
      <div className="px-8 py-7">
        <Empty
          icon="cube"
          title={t("noPackTitle")}
          lead={t("noPackLead")}
        >
          <Button size="sm" icon="back" onClick={() => go("packs")}>
            {t("backButton")}
          </Button>
        </Empty>
      </div>
    )
  }

  const { pack, latest, state, origin } = selected
  const isLocal = origin === "local"

  /** Copies the manifest AND the installed files, so the clone is playable
   *  immediately rather than needing a full reinstall. That copy is the slow
   *  part — a large modpack is gigabytes — which is why the menu entry shows a
   *  running label instead of appearing to do nothing. */
  const doDuplicate = async () => {
    setDuplicating(true)
    try {
      const copy = await localPackDuplicate(pack.slug, "")
      toast.success(t("duplicateSuccess", { name: copy.pack.name }))
      reloadPacks()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("duplicateError"))
    } finally {
      setDuplicating(false)
    }
  }

  const doExport = async (serverOnly: boolean) => {
    const setFlag = serverOnly ? setExportingServer : setExporting
    setFlag(true)
    try {
      await (serverOnly ? exportServerMrpack : exportMrpack)(pack.slug)
      toast.success(t("exportSuccess"))
    } catch (err) {
      const message = (err as { message?: string })?.message
      if (message !== t("exportCancelled")) {
        toast.error(message ?? t("exportError"))
      }
    } finally {
      setFlag(false)
    }
  }

  // The tail is where the stack trace ends up; a crash log's first lines are
  // just the JVM banner.
  const crashLines = logs.filter((line) => line.level === "error").slice(-12)
  const installing = state.kind === "installing"
  // No published version means nothing to install, whatever the disk says.
  const needsInstall =
    !!latest && (state.kind === "not-installed" || state.kind === "outdated")
  const running = game.kind === "running"
  const loader = !latest?.loader
    ? "Vanilla"
    : `${LOADER_LABEL[latest.loader] ?? latest.loader} ${latest.loaderVersion ?? ""}`.trim()

  // Browsing takes over the whole page rather than opening a dialog: the
  // catalog is three panes wide and adding several mods in a row should not
  // mean reopening a modal each time.
  if (browsing && isLocal && latest?.minecraft) {
    // h-full, not min-h: ModBrowser's result grid owns its scroll, and it can
    // only do that when this page is exactly the shell's height. With min-h the
    // grid grows instead of scrolling, so its infinite-scroll sentinel never
    // leaves view and pages chain-load forever.
    return (
      <div className="flex h-full flex-col px-8 py-7">
        <BrowsePage
          slug={pack.slug}
          minecraft={latest.minecraft}
          loader={latest.loader}
          addedProjectIds={[]}
          onBack={() => setBrowsing(false)}
          onChanged={() => setContentNonce((n) => n + 1)}
        />
      </div>
    )
  }

  return (
    <div className="px-8 py-7">
      <button
        type="button"
        onClick={() => go("packs")}
        className="mb-4 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted hover:text-accent-bright"
      >
        <Icon name="back" size={13} /> {t("libraryBack")}
      </button>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <CatalogIcon src={pack.iconUrl ?? undefined} size={64} />
          <div className="min-w-0">
            <Kicker>{pack.slug}</Kicker>
            <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
              {pack.name}
            </h1>
            {/* The reference's metadata strip: the three facts a player checks
                before pressing Play, on one line instead of in a panel. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-txt-muted">
              <span className="flex items-center gap-1.5">
                <Icon name="gamepad" size={12} /> Minecraft {latest?.minecraft ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="puzzle" size={12} /> {loader}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={12} />
                {state.kind === "installed" || state.kind === "outdated"
                  ? formatBytes(state.sizeBytes)
                  : t("uninstalled")}
              </span>
              {isLocal && <Badge tone="info">Local</Badge>}
            </div>
            {pack.summary && (
              <p className="mt-2 max-w-[560px] text-sm text-txt-muted">{pack.summary}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Exactly one primary action, chosen by the state machine. Never
              offer Play while an install is in flight — the jars on disk are
              incomplete. */}
          {running ? (
            <Button variant="danger" icon="pause" onClick={stop}>
              {t("stop")}
            </Button>
          ) : state.kind === "broken" ? (
            <Button
              variant="pri"
              size="lg"
              icon="refresh"
              disabled={!latest}
              onClick={() => void repair(pack.id)}
            >
              {t("repair")}
            </Button>
          ) : installing ? (
            // Not `loading`: that primitive hides its label behind the spinner,
            // and a blank orange box during a multi-minute install reads broken.
            <Button variant="pri" size="lg" icon="download" disabled>
              {t("installingPercent", { percent: Math.round(state.progress.fraction * 100) })}
            </Button>
          ) : needsInstall ? (
            <Button
              variant="pri"
              size="lg"
              icon="download"
              disabled={offline}
              title={offline ? t("installOfflineTitle") : undefined}
              onClick={() => void install(pack.id)}
            >
              {state.kind === "outdated" ? t("update") : t("install")}
            </Button>
          ) : (
            <Button
              variant="pri"
              size="lg"
              icon="play"
              loading={game.kind === "preparing"}
              onClick={() => void play(pack.id)}
            >
              {t("play")}
            </Button>
          )}

          {/* RF-10: a managed pack never shows these — editing or exporting it
              is not a flow this launcher offers, anywhere. */}
          {isLocal && (
            <Menu
              label={t("moreActions")}
              items={[
                { label: t("editLocalMenu"), icon: "edit", onSelect: () => setEditing(true) },
                {
                  label: duplicating ? t("duplicatingMenu") : t("duplicateLocalMenu"),
                  icon: "plus",
                  onSelect: () => void doDuplicate(),
                },
                {
                  label: exporting ? t("exportingMenu") : t("exportMenu"),
                  icon: "upload",
                  onSelect: () => void doExport(false),
                },
                {
                  label: exportingServer ? t("exportingServerMenu") : t("exportServerMenu"),
                  icon: "upload",
                  onSelect: () => void doExport(true),
                },
              ]}
            />
          )}
        </div>
      </header>

      {/* ── Live state: never behind a tab ────────────────────────────────── */}

      {installing && (
        <Panel title={t("installingPanel")} aside={<Badge tone="info">{t("inProgress")}</Badge>} className="mb-4">
          <Stepper
            steps={STEP_GROUPS.map((g) => g.label)}
            current={STEP_GROUPS.findIndex((g) => g.phases.includes(state.progress.phase))}
          />
          <div className="mt-5">
            <Progress value={state.progress.fraction * 100} />
            <div className="mt-2 flex items-center justify-between gap-4 text-xs">
              <span className="truncate font-mono text-txt-dim">
                {PHASE_LABEL[state.progress.phase]} · {state.progress.currentFile}
              </span>
              <span className="shrink-0 text-txt-muted">
                {formatBytes(state.progress.downloadedBytes)} /{" "}
                {formatBytes(state.progress.totalBytes)}
              </span>
            </div>
          </div>
        </Panel>
      )}

      {state.kind === "broken" && (
        <Panel title={t("damagedTitle")} aside={<Badge tone="bad">{t("damaged")}</Badge>} className="mb-4">
          <p className="text-sm text-txt-muted">{state.reason}</p>
          <p className="mt-2 text-xs text-txt-dim">
            {t("damageExplanation")}
          </p>
        </Panel>
      )}

      {/* A crash the player cannot read is a support ticket. The last error
          lines are what actually names the culprit mod, so they go here rather
          than only in the log tab nobody opens. */}
      {game.kind === "crashed" && (
        <Panel
          title={t("crashedTitle")}
          aside={<Badge tone="bad">{t("crashCode", { code: game.exitCode })}</Badge>}
          className="mb-4"
        >
          {/* §9 — the verdict first. The raw lines stay underneath: a wrong
              diagnosis must never hide the evidence that disproves it. */}
          <CrashDiagnosisCard diagnosis={game.diagnosis} className="mb-3" />
          {crashLines.length > 0 ? (
            <pre className="max-h-[180px] overflow-auto rounded-sm border border-line bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-txt-muted">
              {crashLines.map((line) => line.text).join("\n")}
            </pre>
          ) : (
            <p className="text-sm text-txt-muted">
              {t("noErrorLines")}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" icon="list" onClick={() => setTab("logs")}>
              {t("viewLogs")}
            </Button>
            <Button size="sm" variant="pri" icon="play" onClick={() => void play(pack.id)}>
              {t("retry")}
            </Button>
          </div>
        </Panel>
      )}

      {running && (
        <Panel title={t("sessionPanel")} aside={<Badge tone="ok">{t("running")}</Badge>} className="mb-4">
          <Stats
            items={[
              { n: formatDuration(now - game.since), l: t("elapsedTime") },
              { n: game.pid, l: t("pid") },
              { n: loader, l: t("loader") },
            ]}
          />
          <p className="mt-3 text-xs text-txt-dim">
            {t("launcherClosable")}
          </p>
        </Panel>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}

      <Tabs
        className="mb-5"
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
        tabs={[
          { value: "content", label: t("tabs.content") },
          { value: "files", label: t("tabs.files") },
          { value: "worlds", label: t("tabs.worlds") },
          { value: "backups", label: t("tabs.backups") },
          { value: "logs", label: t("tabs.logs") },
          { value: "info", label: t("tabs.info") },
        ]}
      />

      {tab === "content" && (
        <ContentTab
          key={contentNonce}
          slug={pack.slug}
          isLocal={isLocal}
          minecraft={latest?.minecraft ?? ""}
          loader={latest?.loader ?? null}
          onBrowse={() => setBrowsing(true)}
          onChanged={reloadPacks}
        />
      )}

      {tab === "files" && <FilesTab slug={pack.slug} />}

      {tab === "worlds" && <WorldsTab slug={pack.slug} />}

      {/* Available for managed packs too: a backup only ever reads the
          instance, so nothing here can put a server-managed pack out of sync
          the way editing its file list would. */}
      {tab === "backups" && <BackupsTab slug={pack.slug} packName={pack.name} />}

      {tab === "logs" && <LogPanel lines={logs} />}

      {tab === "info" && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            <Panel title={t("info.version")}>
              <DataList
                rows={[
                  { label: t("info.latest"), value: latest?.name ?? "—", mono: true },
                  { label: t("info.published"), value: latest ? formatWhen(latest.createdAt) : "—" },
                  { label: t("info.minecraft"), value: latest?.minecraft ?? "—", mono: true },
                  { label: t("info.loaderLabel"), value: loader, mono: true },
                  { label: t("info.filesLabel"), value: latest?.fileCount ?? 0 },
                  (state.kind === "installed" || state.kind === "outdated") && {
                    label: t("info.diskLabel"),
                    value: formatBytes(state.sizeBytes),
                  },
                  state.kind === "outdated" && {
                    label: t("info.installedLabel"),
                    value: state.versionId,
                    mono: true,
                  },
                ]}
              />
            </Panel>

            <Panel title={t("info.accessTitle")}>
              <DataList
                rows={[
                  {
                    label: t("info.type"),
                    value:
                      pack.accessKind === "allowlist"
                        ? t("info.allowlist")
                        : pack.accessKind === "password"
                          ? t("info.password")
                          : t("info.public"),
                    icon: pack.accessKind === "public" ? "globe" : "lock",
                  },
                  // No member count: the registry deliberately never sends the
                  // allowlist to a launcher, since one member could otherwise
                  // enumerate everyone else with access to the pack.
                  pack.accessKind === "allowlist" && {
                    label: t("info.yourAccess"),
                    value: t("info.granted"),
                  },
                ]}
              />
              <Divider label={t("info.integrityLabel")} className="my-4" />
              <p className="text-xs text-txt-dim">
                {t("info.integrityDescription")}
              </p>
            </Panel>
          </div>

          {/* §9 — rollback and the per-instance runtime. Reference material,
              which is exactly what this tab is for. */}
          <InstanceSpace slug={pack.slug} onChanged={reloadPacks} />
        </div>
      )}

      {isLocal && (
        <EditLocalPackModal
          open={editing}
          onClose={() => setEditing(false)}
          onSaved={() => {
            reloadPacks()
            toast.success(t("saveSuccess"))
          }}
          pack={pack}
          latest={latest}
        />
      )}
    </div>
  )
}
