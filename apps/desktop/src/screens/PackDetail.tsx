import { useEffect, useRef, useState } from "react";

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
  Menu,
  Modal,
  Panel,
  Progress,
  SectionBar,
  Stats,
  Stepper,
  Tabs,
  Textarea,
  toast,
  DISPLAY_VOICE,
} from "@boffmedia/ui";
import type { MenuItem } from "@boffmedia/ui";

import { useT } from "../i18n";
import { CrashDiagnosisCard } from "../components/CrashDiagnosis";
import { VersionPicker, dependenciesOf } from "../components/VersionPicker";
import type { VersionChoice } from "../components/VersionPicker";
import { InstanceSpace } from "../components/InstanceSpace";
import { BrowsePage } from "../components/pack/BrowsePage";
import { getModule } from "../services/gameModules";
import { BackupsTab } from "../components/pack/BackupsTab";
import { ContentTab } from "../components/pack/ContentTab";
import { OptionalEditorPage } from "../components/pack/OptionalEditorPage";
import { OptionalPanel } from "../components/pack/OptionalPanel";
import { PublishDialog } from "../components/pack/PublishDialog";
import { FilesTab } from "../components/pack/FilesTab";
import { GalleryTab } from "../components/pack/GalleryTab";
import { ScreenshotsTab } from "../components/pack/ScreenshotsTab";
import { WorldsTab } from "../components/pack/WorldsTab";
import { LogPanel } from "../components/pack/LogPanel";
import { EmulatorSetupPanel } from "../components/pack/EmulatorSetupPanel";
import { RandomizerPanel } from "../components/pack/RandomizerPanel";
import {
  exportMrpack,
  exportServerMrpack,
  exportServerZip,
  onServerZipProgress,
  instanceOptionalModel,
  instanceReveal,
  localPackDuplicate,
  localPackGet,
  localPackIcon,
  localPackIconClear,
  localPackIconSet,
  localPackSave,
  filePicker,
  openUrl,
  provideFile,
  webBaseUrl,
} from "../runtime";
import {
  DeleteLocalPackModal,
  UninstallPackModal,
} from "../components/pack/PackDeleteDialogs";
import { useApp } from "../state/app";
import { formatBytes, formatDuration, formatWhen } from "../utils/format";
import { LOADER_LABEL, PHASE_LABEL, STEP_GROUPS } from "../utils/labels";

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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** The pack's own version, as the picker's shape. A pack with no version yet
 *  leaves `minecraft` empty so the picker fills it with Mojang's latest. */
function choiceOf(
  latest: {
    minecraft: string | null;
    loader: string | null;
    loaderVersion: string | null;
  } | null,
): VersionChoice {
  return {
    minecraft: latest?.minecraft ?? "",
    loader: latest?.loader ?? "",
    loaderVersion: latest?.loaderVersion ?? "",
  };
}

/** RF-10: edit is only ever offered for a local pack, and only ever writes
 *  back to that SAME slug — `localPackSave` overwrites in place when the slug
 *  it is given already exists under `local-packs/`, so this can never create
 *  a second pack or touch a managed one. */
function EditLocalPackModal({
  open,
  onClose,
  onSaved,
  onIconChanged,
  pack,
  latest,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Icon edits land on disk immediately (a file dialog, not the Save button),
   *  so the header must re-resolve its icon without waiting for a manifest save. */
  onIconChanged: () => void;
  pack: {
    id: string;
    slug: string;
    name: string;
    summary: string | null;
    description: string | null;
  };
  latest: {
    name: string;
    minecraft: string | null;
    loader: string | null;
    loaderVersion: string | null;
  } | null;
}) {
  const t = useT("packDetail");
  const [name, setName] = useState(pack.name);
  const [summary, setSummary] = useState(pack.summary ?? "");
  const [description, setDescription] = useState(pack.description ?? "");
  const [versionName, setVersionName] = useState(latest?.name ?? "");
  const [choice, setChoice] = useState<VersionChoice>(() => choiceOf(latest));
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingIcon, setSettingIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(pack.name);
    setSummary(pack.summary ?? "");
    setDescription(pack.description ?? "");
    setVersionName(latest?.name ?? "");
    setChoice(choiceOf(latest));
  }, [
    open,
    pack.name,
    pack.summary,
    pack.description,
    latest?.name,
    latest?.minecraft,
    latest?.loader,
    latest?.loaderVersion,
  ]);

  const changeIcon = async () => {
    setSettingIcon(true);
    try {
      const changed = await localPackIconSet(pack.slug);
      if (changed) {
        toast.success(t("iconSetSuccess"));
        onIconChanged();
      }
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("iconSetError"));
    } finally {
      setSettingIcon(false);
    }
  };

  const clearIcon = async () => {
    try {
      await localPackIconClear(pack.slug);
      onIconChanged();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? t("iconClearError"),
      );
    }
  };

  const save = async () => {
    if (!name.trim()) {
      setError(t("nameError"));
      return;
    }
    if (choice.loader && !choice.loaderVersion) {
      setError(t("loaderVersionError"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const current = await localPackGet(pack.slug);
      const dependencies = dependenciesOf(choice);
      const summaryValue = summary.trim() || undefined;
      const descriptionValue = description.trim() || undefined;
      await localPackSave({
        ...current,
        pack: {
          ...(current?.pack ?? {
            id: pack.id,
            slug: pack.slug,
            access: { kind: "public" },
          }),
          name: name.trim(),
          slug: pack.slug,
          summary: summaryValue,
          description: descriptionValue,
        },
        version: {
          ...(current?.version ?? {
            id: "local-v1",
            name: "local",
            createdAt: new Date().toISOString(),
            files: [],
          }),
          name: versionName.trim() || current?.version?.name || "1.0",
          dependencies,
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("editModal")}>
      <div className="flex flex-col gap-4">
        <Field label={t("nameField")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("iconLabel")}>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              icon="upload"
              loading={settingIcon}
              onClick={() => void changeIcon()}
            >
              {t("iconSetButton")}
            </Button>
            <Button size="sm" onClick={() => void clearIcon()}>
              {t("iconClearButton")}
            </Button>
          </div>
        </Field>
        <Field label={t("summaryLabel")}>
          <Input
            value={summary}
            maxLength={512}
            placeholder={t("summaryPlaceholder")}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
        <Field label={t("descriptionLabel")}>
          <Textarea
            rows={4}
            value={description}
            maxLength={2048}
            placeholder={t("descriptionPlaceholder")}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label={t("versionNameLabel")}>
          <Input
            value={versionName}
            placeholder={t("versionNamePlaceholder")}
            onChange={(e) => setVersionName(e.target.value)}
          />
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
  );
}

type TabKey =
  | "content"
  | "optional"
  | "files"
  | "worlds"
  | "gallery"
  | "screenshots"
  | "backups"
  | "logs"
  | "info";

export function PackDetail() {
  const t = useT("packDetail");
  // The delete / uninstall / open-folder actions are library vocabulary shared
  // with the packs screen, so their labels live in the `packs` namespace.
  const tk = useT("packs");
  // The optional-content strings live in the `content` namespace with the rest
  // of the chooser's, so this panel and the Content tab cannot drift apart.
  const tc = useT("content");
  const {
    selected,
    install,
    play,
    repair,
    stop,
    game,
    go,
    logs,
    reloadPacks,
    offline,
    editIntent,
    clearEditIntent,
  } = useApp();
  const now = useNow(game.kind === "running");
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingServer, setExportingServer] = useState(false);
  // null = not running. The ZIP export ships the mod jars themselves, so it is
  // a minutes-long, hundreds-of-megabytes job and needs a real counter.
  const [serverZip, setServerZip] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showUninstall, setShowUninstall] = useState(false);
  const [tab, setTab] = useState<TabKey>("content");
  const [browsing, setBrowsing] = useState(false);
  const [editingOptional, setEditingOptional] = useState(false);
  const [contentNonce, setContentNonce] = useState(0);
  // An authoring save always mints a new version id, so the instance is
  // outdated the instant it returns. Held locally rather than waiting for
  // `state.kind` to catch up: the rescan behind `reloadPacks` is a round trip,
  // and for the length of it the panel would show the marker's catalogue — the
  // groups from the LAST install — with nothing on screen saying so. That gap
  // is exactly what "I saved three groups and only the first one shows" looks
  // like. Cleared on the same falling edge of `installing` that refreshes the
  // rest of the page, because that is when it stops being true.
  const [optionalJustSaved, setOptionalJustSaved] = useState(false);
  const [providingFile, setProvidingFile] = useState<string | null>(null);
  const [fileError, setFileError] = useState<{
    path: string;
    message: string;
  } | null>(null);
  // The Content tab's rows describe what is ON DISK, and an install or a launch
  // changes that from outside the tab. Without this the badges an install just
  // made true stay false until the player navigates away and back — which is
  // exactly what "instalé el pack y los mods siguen sin instalar" was.
  //
  // Keyed on the FALLING edge of `installing` rather than on every state
  // change, so an unrelated re-scan does not refetch the whole list. A launch
  // is covered by the same edge: it re-verifies the instance and emits install
  // progress while it does, so `play` passes through `installing` too.
  const installPhase = selected?.state.kind;
  const wasInstalling = useRef(false);
  useEffect(() => {
    if (installPhase === "installing") {
      wasInstalling.current = true;
      return;
    }
    if (!wasInstalling.current) return;
    wasInstalling.current = false;
    setContentNonce((n) => n + 1);
    setOptionalJustSaved(false);
  }, [installPhase]);

  /** How many optional groups this pack actually offers, for the one decision
   *  that has to be made BEFORE the panel mounts: whether the tab exists at all.
   *
   *  Read off the same command the panel uses rather than from
   *  `latest.optionalFeatureCount`, and the difference is not pedantry: that
   *  number counts AUTHORED features only, while the model also folds in every
   *  unclaimed `env.client: "optional"` file as a synthesised `otros` group.
   *  A pack imported from a .mrpack carries exactly that and nothing else — so
   *  gating on the count would hide the tab from the packs where optional
   *  content most often comes from someone else's authoring.
   *
   *  A local pack always gets the tab regardless: it is the only door to the
   *  authoring page, so hiding it on a pack with no groups yet would hide the
   *  feature from precisely the packs that have not used it.
   *
   *  Answers 0 for a managed pack that is not installed yet — no marker to read
   *  and no manifest fetched here. That case is already served by the
   *  pre-install chooser on the Info tab, which is where the decision is worth
   *  more anyway: declining a 400 MB shaderpack there means never fetching it. */
  const [optionalGroupCount, setOptionalGroupCount] = useState(0);
  const scanSlug = selected?.pack.slug ?? null;
  useEffect(() => {
    if (!scanSlug) return;
    let alive = true;
    void instanceOptionalModel(scanSlug)
      .then((groups) => {
        if (alive) setOptionalGroupCount(groups.length);
      })
      .catch(() => {
        if (alive) setOptionalGroupCount(0);
      });
    return () => {
      alive = false;
    };
  }, [scanSlug, contentNonce]);

  // A local pack's icon is a file on disk (a data: URL), not the manifest's
  // iconUrl; resolve it here so the header prefers it. Re-runs when contentNonce
  // bumps after an icon edit.
  const [localIcon, setLocalIcon] = useState<string | null>(null);
  const localSlug = selected?.origin === "local" ? selected.pack.slug : null;
  useEffect(() => {
    if (!localSlug) {
      setLocalIcon(null);
      return;
    }
    let alive = true;
    void localPackIcon(localSlug).then((data) => {
      if (alive) setLocalIcon(data);
    });
    return () => {
      alive = false;
    };
  }, [localSlug, contentNonce]);

  // What the pack already holds, for the mod browser: a project id -> the
  // version id of the file in the manifest. Only Modrinth-sourced files can
  // answer — an `override` blob or a hand-dropped jar has no project to match a
  // catalogue row against.
  //
  // Read from the manifest rather than from the install marker: the browser adds
  // TO the manifest, so that is the document its answers have to agree with.
  const [installedVersions, setInstalledVersions] = useState<
    Record<string, string>
  >({});
  useEffect(() => {
    if (!localSlug) {
      setInstalledVersions({});
      return;
    }
    let alive = true;
    void localPackGet(localSlug)
      .then((manifest) => {
        if (!alive || !manifest) return;
        const files = (manifest.version?.files ?? []) as Array<{
          source?: { kind?: string; projectId?: string; versionId?: string };
        }>;
        const map: Record<string, string> = {};
        for (const file of files) {
          const src = file.source;
          if (src?.kind === "modrinth" && src.projectId && src.versionId) {
            map[src.projectId] = src.versionId;
          }
        }
        setInstalledVersions(map);
      })
      .catch(() => {
        /* the browser works without it; every row just keeps its Add button */
      });
    return () => {
      alive = false;
    };
  }, [localSlug, contentNonce]);

  // The library card's "Edit" navigates here asking the form to open straight
  // away. Consume the one-shot intent (only a local pack has an edit form) and
  // clear it, so a later plain visit to the same pack does not reopen the modal.
  useEffect(() => {
    if (editIntent && localSlug) setEditing(true);
    if (editIntent) clearEditIntent();
  }, [editIntent, localSlug, clearEditIntent]);

  if (!selected) {
    return (
      <div className="px-8 py-7">
        <Empty icon="cube" title={t("noPackTitle")} lead={t("noPackLead")}>
          <Button size="sm" icon="back" onClick={() => go("packs")}>
            {t("backButton")}
          </Button>
        </Empty>
      </div>
    );
  }

  const { pack, latest, state, origin } = selected;
  const isLocal = origin === "local";

  /** Copies the manifest AND the installed files, so the clone is playable
   *  immediately rather than needing a full reinstall. That copy is the slow
   *  part — a large modpack is gigabytes — which is why the menu entry shows a
   *  running label instead of appearing to do nothing. */
  const doDuplicate = async () => {
    setDuplicating(true);
    try {
      const copy = await localPackDuplicate(pack.slug, "");
      toast.success(t("duplicateSuccess", { name: copy.pack.name }));
      reloadPacks();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? t("duplicateError"),
      );
    } finally {
      setDuplicating(false);
    }
  };

  const doExport = async (serverOnly: boolean) => {
    const setFlag = serverOnly ? setExportingServer : setExporting;
    setFlag(true);
    try {
      await (serverOnly ? exportServerMrpack : exportMrpack)(pack.slug);
      toast.success(t("exportSuccess"));
    } catch (err) {
      const message = (err as { message?: string })?.message;
      if (message !== t("exportCancelled")) {
        toast.error(message ?? t("exportError"));
      }
    } finally {
      setFlag(false);
    }
  };

  const doExportServerZip = async () => {
    setServerZip({ done: 0, total: 0 });
    const stop = onServerZipProgress((e) => {
      if (e.slug === pack.slug) setServerZip({ done: e.done, total: e.total });
    });
    try {
      const report = await exportServerZip(pack.slug);
      toast.success(
        report.skipped.length > 0
          ? t("exportServerZipSkipped", { count: report.skipped.length })
          : t("exportServerZipSuccess"),
      );
    } catch (err) {
      const message = (err as { message?: string })?.message;
      if (message !== t("exportCancelled")) {
        toast.error(message ?? t("exportServerZipError"));
      }
    } finally {
      stop();
      setServerZip(null);
    }
  };

  const handleProvideFile = async (filePath: string) => {
    // Open the native picker for the player's copy of this file; cancel is a no-op.
    const source = await filePicker();
    if (!source) return;
    setProvidingFile(filePath);
    setFileError(null);
    try {
      await provideFile(pack.slug, filePath, source);
      reloadPacks();
    } catch (err) {
      const errObj = err as {
        code?: string;
        message?: string;
        expectedHint?: string;
      };
      if (errObj.code === "wrong_hash") {
        setFileError({
          path: filePath,
          message: errObj.expectedHint
            ? t("pack.requiredFiles.wrongHashHint", {
                hint: errObj.expectedHint,
              })
            : (errObj.message ?? t("pack.requiredFiles.wrongHash")),
        });
      } else {
        toast.error(
          (err as { message?: string })?.message ??
            t("pack.requiredFiles.couldNotProvide"),
        );
      }
    } finally {
      setProvidingFile(null);
    }
  };

  // The tail is where the stack trace ends up; a crash log's first lines are
  // just the JVM banner.
  const crashLines = logs.filter((line) => line.level === "error").slice(-12);
  const installing = state.kind === "installing";
  // No published version means nothing to install, whatever the disk says.
  const needsInstall =
    !!latest && (state.kind === "not-installed" || state.kind === "outdated");
  const running = game.kind === "running";
  const loader = !latest?.loader
    ? "Vanilla"
    : `${LOADER_LABEL[latest.loader] ?? latest.loader} ${latest.loaderVersion ?? ""}`.trim();

  // "Has files on disk": a broken install still has a directory to open and
  // remove, so Open folder / Delete / Uninstall are all offered on it.
  const hasFiles =
    state.kind === "installed" ||
    state.kind === "outdated" ||
    state.kind === "broken";

  // Check if there are unsatisfied required user files
  const hasMissingUserFiles =
    (state.kind === "installed" || state.kind === "outdated") &&
    state.missingUserFiles &&
    state.missingUserFiles.length > 0;

  // Check if the pack's randomizer ROM is not yet patched
  const randomizerBlocked =
    (state.kind === "installed" || state.kind === "outdated") &&
    state.randomizerBlocked === true;

  const openFolder: MenuItem = {
    label: tk("openInstanceFolder"),
    icon: "folder",
    onSelect: () => void instanceReveal(pack.slug, ""),
  };
  const localMenuItems: MenuItem[] = [
    {
      label: t("editLocalMenu"),
      icon: "edit",
      onSelect: () => setEditing(true),
    },
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
    {
      label: serverZip
        ? t("exportingServerZipMenu", {
            done: serverZip.done,
            total: serverZip.total,
          })
        : t("exportServerZipMenu"),
      icon: "server",
      disabled: serverZip !== null,
      onSelect: () => void doExportServerZip(),
    },
    // Offered to everyone; the API is what enforces BOFF_ADMIN. Hiding it based
    // on a role the renderer would have to guess at is how a button ends up
    // lying about what it does — a 403 with a real message is more honest than
    // an entry that silently is not there.
    {
      label: t("publishMenu"),
      icon: "globe",
      onSelect: () => setPublishing(true),
    },
    ...(hasFiles ? [openFolder] : []),
    { sep: true },
    {
      label: tk("deleteLocalMenu"),
      icon: "trash",
      danger: true,
      disabled: installing,
      onSelect: () => setShowDelete(true),
    },
  ];
  const managedMenuItems: MenuItem[] = [
    // Public packs only, matching the API: password and allowlist packs have no
    // public page at all, so offering the link would open a 404 and quietly
    // suggest that a private pack is shareable.
    ...(pack.accessKind === "public"
      ? [
          {
            label: t("sharePageMenu"),
            icon: "globe" as const,
            onSelect: () =>
              void openUrl(`${webBaseUrl()}/app/packs/${pack.slug}`),
          },
        ]
      : []),
    openFolder,
    {
      label: tk("uninstallMenu"),
      icon: "trash",
      danger: true,
      disabled: installing,
      onSelect: () => setShowUninstall(true),
    },
  ];

  // Browsing takes over the whole page rather than opening a dialog: the
  // catalog is three panes wide and adding several mods in a row should not
  // mean reopening a modal each time. Only available for game types that support browse.
  const module = getModule(pack.gameType);
  if (browsing && module.supportsBrowse && isLocal && latest?.minecraft) {
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
          // Both derived from the same map, so the grid badge and the version
          // row can never disagree about what the pack contains.
          addedProjectIds={Object.keys(installedVersions)}
          installedVersions={installedVersions}
          onBack={() => setBrowsing(false)}
          onChanged={() => setContentNonce((n) => n + 1)}
        />
      </div>
    );
  }

  // Same takeover shape as browsing, and for the same reason: the authoring form
  // is groups holding options holding a scrolling file picker, and every one of
  // those levels needs width a column beside the file list cannot give it.
  if (editingOptional && isLocal) {
    return (
      <OptionalEditorPage
        slug={pack.slug}
        onBack={() => setEditingOptional(false)}
        onSaved={() => {
          setOptionalJustSaved(true);
          setContentNonce((n) => n + 1);
          reloadPacks();
        }}
      />
    );
  }

  return (
    // The bar is full-bleed — it owns its own gutter and its hairline has to
    // reach both edges — so the page padding lives on the body wrapper below it
    // rather than on this root. Same shape as ToolView, which is the point: one
    // depth-one chassis, whatever the section.
    <div>
      <SectionBar bordered label={t("libraryBack")} onBack={() => go("packs")} />

      <div className="px-8 py-7">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <CatalogIcon src={localIcon ?? pack.iconUrl ?? undefined} size={64} />
          <div className="min-w-0">
            <h1 className={`${DISPLAY_VOICE} text-[30px] text-txt`}>
              {pack.name}
            </h1>
            {/* The reference's metadata strip: the three facts a player checks
                before pressing Play, on one line instead of in a panel. Rendered via module.
                The slug leads it: `name` is a display string that can change between
                versions, so the slug is the only stable id a player can quote in a
                report — and it is what the logs, the install dir and the API all use. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-txt-muted">
              <span className="flex items-center gap-1.5">
                <Icon name="code" size={12} /> {pack.slug}
              </span>
              {module.detailTabs?.some((t) => t.value === "content") && (
                <>
                  {latest?.minecraft && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="gamepad" size={12} /> Minecraft{" "}
                      {latest.minecraft}
                    </span>
                  )}
                  {latest?.loader && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="puzzle" size={12} /> {loader}
                    </span>
                  )}
                </>
              )}
              {module.supportsSetupPanel && latest?.emulatorKind && (
                <span className="flex items-center gap-1.5">
                  <Icon name="gamepad" size={12} />{" "}
                  {t(`emulatorSetup.emulatorNames.${latest.emulatorKind}`) ??
                    "Emulator"}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={12} />
                {state.kind === "installed" || state.kind === "outdated"
                  ? formatBytes(state.sizeBytes)
                  : t("uninstalled")}
              </span>
              {isLocal && <Badge tone="info">Local</Badge>}
            </div>
            {pack.summary && (
              <p className="mt-2 max-w-[560px] text-sm text-txt-muted">
                {pack.summary}
              </p>
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
              {t("installingPercent", {
                percent: Math.round(state.progress.fraction * 100),
              })}
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
              disabled={hasMissingUserFiles || randomizerBlocked}
              title={
                randomizerBlocked
                  ? t("randomlocke.playBlockedRandomizeFirst")
                  : hasMissingUserFiles
                    ? t("pack.requiredFiles.title")
                    : undefined
              }
              onClick={() => void play(pack.id)}
            >
              {t("play")}
            </Button>
          )}

          {/* RF-10: a managed pack never shows the local-authoring actions
              (edit / duplicate / export) — but it CAN be opened on disk and
              uninstalled once it has files, so it gets its own menu. */}
          {isLocal ? (
            <Menu label={t("moreActions")} items={localMenuItems} />
          ) : (
            hasFiles && (
              <Menu label={t("moreActions")} items={managedMenuItems} />
            )
          )}
        </div>
      </header>

      {/* ── Live state: never behind a tab ────────────────────────────────── */}

      {installing && (
        <Panel
          title={t("installingPanel")}
          aside={<Badge tone="info">{t("inProgress")}</Badge>}
          className="mb-4"
        >
          <Stepper
            steps={STEP_GROUPS.map((g) => g.label)}
            current={STEP_GROUPS.findIndex((g) =>
              g.phases.includes(state.progress.phase),
            )}
          />
          <div className="mt-5">
            <Progress value={state.progress.fraction * 100} />
            <div className="mt-2 flex items-center justify-between gap-4 text-xs">
              <span className="truncate font-mono text-txt-dim">
                {PHASE_LABEL[state.progress.phase]} ·{" "}
                {state.progress.currentFile}
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
        <Panel
          title={t("damagedTitle")}
          aside={<Badge tone="bad">{t("damaged")}</Badge>}
          className="mb-4"
        >
          <p className="text-sm text-txt-muted">{state.reason}</p>
          <p className="mt-2 text-xs text-txt-dim">{t("damageExplanation")}</p>
        </Panel>
      )}

      {/* A crash the player cannot read is a support ticket. The last error
          lines are what actually names the culprit mod, so they go here rather
          than only in the log tab nobody opens. Minecraft-only in Cycle 1. */}
      {module.supportsCrashDiagnosis && game.kind === "crashed" && (
        <Panel
          title={t("crashedTitle")}
          aside={
            <Badge tone="bad">{t("crashCode", { code: game.exitCode })}</Badge>
          }
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
            <p className="text-sm text-txt-muted">{t("noErrorLines")}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" icon="list" onClick={() => setTab("logs")}>
              {t("viewLogs")}
            </Button>
            <Button
              size="sm"
              variant="pri"
              icon="play"
              onClick={() => void play(pack.id)}
            >
              {t("retry")}
            </Button>
          </div>
        </Panel>
      )}

      {running && (
        <Panel
          title={t("sessionPanel")}
          aside={<Badge tone="ok">{t("running")}</Badge>}
          className="mb-4"
        >
          <Stats
            items={[
              { n: formatDuration(now - game.since), l: t("elapsedTime") },
              { n: game.pid, l: t("pid") },
              { n: loader, l: t("loader") },
            ]}
          />
          <p className="mt-3 text-xs text-txt-dim">{t("appClosable")}</p>
        </Panel>
      )}

      {/* Required user-provided files panel — for non-emulator packs. Emulator
          packs get the richer EmulatorSetupPanel (above), which owns the ROM
          checklist, so this generic panel is gated off there to avoid double UI. */}
      {module.supportsMissingFiles !== false &&
        (state.kind === "installed" || state.kind === "outdated") &&
        state.missingUserFiles &&
        state.missingUserFiles.length > 0 && (
          <Panel
            title={t("pack.requiredFiles.title")}
            aside={<Badge tone="info">{state.missingUserFiles.length}</Badge>}
            className="mb-4"
          >
            <div className="space-y-3">
              {state.missingUserFiles.map((file) => (
                <div
                  key={file.path}
                  className="rounded border border-line bg-surface-bright p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{file.hint}</p>
                      <p className="text-xs text-txt-muted">{file.path}</p>
                      <p className="text-xs text-txt-dim">
                        {formatBytes(file.fileSize)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      loading={providingFile === file.path}
                      onClick={() => void handleProvideFile(file.path)}
                    >
                      {t("pack.requiredFiles.selectFile")}
                    </Button>
                  </div>
                  {fileError?.path === file.path && (
                    <p className="mt-2 text-xs text-bad">
                      {t("pack.requiredFiles.wrongHash")}
                      {fileError.message ? `: ${fileError.message}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        )}

      {/* Emulator setup panel — shown for packs that support it. */}
      {module.supportsSetupPanel &&
        (state.kind === "installed" || state.kind === "outdated") && (
          <EmulatorSetupPanel
            slug={pack.slug}
            emulatorKind={latest?.emulatorKind}
            missingFiles={state.missingUserFiles ?? []}
            onFileProvided={() => {
              setContentNonce((n) => n + 1);
              reloadPacks();
            }}
            className="mb-4"
          />
        )}

      {/* Randomizer panel — shown for emulator packs with an active event. */}
      {module.supportsSetupPanel &&
        (state.kind === "installed" || state.kind === "outdated") && (
          <RandomizerPanel
            slug={pack.slug}
            packId={pack.id}
            missingFiles={state.missingUserFiles ?? []}
            romBlocked={randomizerBlocked}
            className="mb-4"
          />
        )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}

      {/* Build tabs array based on module. Minecraft packs show all tabs;
          other types show only generic tabs. */}
      {(() => {
        const baseTabs = [
          { value: "gallery", label: t("galleryTab") },
          { value: "logs", label: t("tabs.logs") },
          { value: "info", label: t("tabs.info") },
        ];
        const module = getModule(pack.gameType);
        const moduleTabs = (module.detailTabs ?? [])
          .map((tab) => ({
            ...tab,
            // Resolve tab label keys
            label: t(tab.label),
          }))
          // See `optionalGroupCount`: the tab is declared by the module but
          // only earns its place on a pack that has something to put in it.
          .filter(
            (tab) =>
              tab.value !== "optional" || isLocal || optionalGroupCount > 0,
          );
        const allTabs = [...moduleTabs, ...baseTabs];
        const moduleTabValues = moduleTabs.map((t) => t.value);
        return (
          <Tabs
            className="mb-5"
            value={tab}
            onChange={(v) => {
              const newTab = v as TabKey;
              // If switching to a module-specific tab that's not available, reset to the first available
              if (
                !moduleTabValues.includes(newTab) &&
                moduleTabValues.length === 0 &&
                [
                  "content",
                  "files",
                  "worlds",
                  "screenshots",
                  "backups",
                ].includes(newTab)
              ) {
                setTab("gallery");
              } else {
                setTab(newTab);
              }
            }}
            tabs={allTabs}
          />
        );
      })()}

      {tab === "content" && (
        <ContentTab
          slug={pack.slug}
          isLocal={isLocal}
          minecraft={latest?.minecraft ?? ""}
          loader={latest?.loader ?? null}
          onBrowse={() => setBrowsing(true)}
          onChanged={reloadPacks}
          // A prop, not a `key`: remounting would also throw away the search
          // box, the category filter and the live per-file download state.
          refreshKey={contentNonce}
        />
      )}

      {/* Its own tab rather than a block above the file list. The list answers
          "what is in this pack" and runs to a few hundred rows; this answers
          "what do I want from it", and a decision parked on top of an inventory
          is a decision that gets scrolled past. Owning the page is also what
          lets the groups sit side by side instead of stacking. */}
      {tab === "optional" && (
        <OptionalPanel
          slug={pack.slug}
          packId={pack.id}
          isLocal={isLocal}
          layout="grid"
          // `not-installed` excluded deliberately: with no marker there is
          // nothing for the document to be ahead OF, the panel is already
          // reading the manifest, and the pre-install toggles are exactly what
          // the install pass consumes — so locking them would cost the author
          // the one choice that is worth making before the download.
          pendingInstall={
            state.kind === "outdated" ||
            (optionalJustSaved && state.kind !== "not-installed")
          }
          refreshKey={contentNonce}
          onChanged={reloadPacks}
          onEdit={isLocal ? () => setEditingOptional(true) : undefined}
        />
      )}

      <PublishDialog
        slug={pack.slug}
        open={publishing}
        onClose={() => setPublishing(false)}
        onPublished={reloadPacks}
      />

      {tab === "files" && <FilesTab slug={pack.slug} />}

      {tab === "worlds" && (
        <WorldsTab slug={pack.slug} isLocal={isLocal} onChanged={reloadPacks} />
      )}

      {tab === "gallery" && (
        <GalleryTab
          slug={pack.slug}
          isLocal={isLocal}
          managedGallery={pack.gallery}
          contentNonce={contentNonce}
        />
      )}

      {tab === "screenshots" && <ScreenshotsTab slug={pack.slug} />}

      {/* Available for managed packs too: a backup only ever reads the
          instance, so nothing here can put a server-managed pack out of sync
          the way editing its file list would. */}
      {tab === "backups" && (
        <BackupsTab slug={pack.slug} packName={pack.name} />
      )}

      {tab === "logs" && <LogPanel lines={logs} />}

      {tab === "info" && (
        <div className="flex flex-col gap-4">
          {pack.description && (
            <Panel title={t("descriptionTitle")}>
              <p className="whitespace-pre-wrap text-sm text-txt-muted">
                {pack.description}
              </p>
            </Panel>
          )}
          {/* The install-time step. Here rather than behind the Install button
              because a modal in front of a download is a modal people dismiss:
              this is the screen they are already reading while deciding, and
              choosing NOW is what keeps a declined 400 MB shaderpack from ever
              being fetched. The Content tab keeps the same switches afterwards,
              so nothing is decided permanently. */}
          {state.kind === "not-installed" && (
            <Panel title={tc("optionalTitle")}>
              <OptionalPanel
                slug={pack.slug}
                packId={pack.id}
                isLocal={isLocal}
                preInstall
                onChanged={reloadPacks}
              />
            </Panel>
          )}
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            <Panel title={t("info.version")}>
              <DataList
                rows={[
                  {
                    label: t("info.latest"),
                    value: latest?.name ?? "—",
                    mono: true,
                  },
                  {
                    label: t("info.published"),
                    value: latest ? formatWhen(latest.createdAt) : "—",
                  },
                  module.detailTabs?.some((t) => t.value === "content") && {
                    label: t("info.minecraft"),
                    value: latest?.minecraft ?? "—",
                    mono: true,
                  },
                  module.detailTabs?.some((t) => t.value === "content") && {
                    label: t("info.loaderLabel"),
                    value: loader,
                    mono: true,
                  },
                  {
                    label: t("info.filesLabel"),
                    value: latest?.fileCount ?? 0,
                  },
                  // Only when the pack offers something, for the same reason
                  // the library card omits it: a zero here tells nobody
                  // anything.
                  !!latest?.optionalFeatureCount && {
                    label: tc("optionalTitle"),
                    value: latest.optionalFeatureCount,
                  },
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
              which is exactly what this tab is for. Module-specific. */}
          {module.supportsInstanceSpace && (
            <InstanceSpace slug={pack.slug} onChanged={reloadPacks} />
          )}
        </div>
      )}

      {isLocal && (
        <EditLocalPackModal
          open={editing}
          onClose={() => setEditing(false)}
          onSaved={() => {
            reloadPacks();
            toast.success(t("saveSuccess"));
          }}
          onIconChanged={() => setContentNonce((n) => n + 1)}
          pack={pack}
          latest={latest}
        />
      )}

      {isLocal ? (
        <DeleteLocalPackModal
          open={showDelete}
          slug={pack.slug}
          name={pack.name}
          onClose={() => setShowDelete(false)}
          // The pack no longer exists after this, so there is nothing to return
          // to — send the player back to the library.
          onDone={() => {
            reloadPacks();
            go("packs");
          }}
        />
      ) : (
        <UninstallPackModal
          open={showUninstall}
          slug={pack.slug}
          name={pack.name}
          blocked={running}
          onClose={() => setShowUninstall(false)}
          // The pack stays in the library, and this screen stays open — a
          // reload flips it to its "not installed" state in place.
          onDone={reloadPacks}
        />
      )}
      </div>
    </div>
  );
}
