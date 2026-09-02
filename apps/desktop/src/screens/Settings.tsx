import {
  Badge,
  Button,
  DataList,
  Divider,
  Field,
  IconButton,
  Input,
  Modal,
  Panel,
  Progress,
  Seg,
  Slider,
  Toggle,
  toast,
  ToolHeader,
} from "@boffmedia/ui";
import { listTools } from "@boffmedia/tool-kit";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { BoffAvatar } from "../components/AccountSwitcher";
import { PlayerHead } from "../components/PlayerHead";
import { useT } from "../i18n";
import {
  getRuntimeInfo,
  emulatorStatus,
  emulatorSetPath,
  emulatorClearPath,
  romDirsGet,
  romDirsAdd,
  romDirsRemove,
  filePicker,
  folderPicker,
  jvmArgsCheck,
  toolPacksList,
  toolPacksRemove,
  assetCacheBytes,
  assetCacheClear,
  onPackProgress,
  onPackDone,
  onPackError,
  type JvmArgVerdict,
} from "../runtime";
import {
  UI_SCALES,
  type ToolPackProgress,
  type ToolPackSummary,
  type UiScale,
} from "../services/types";
import { checkForUpdates, useUpdates } from "../services/updates";
import { useApp } from "../state/app";
import { elidePath, formatBytes } from "../utils/format";

// Wrong Java version is the single most common launcher support ticket, hence
// the explicit, visible Java row rather than silent detection.

/** Same tokenisation the per-pack panel uses: every accepted flag is a single
 *  whitespace-free token, so there is nothing a quote could usefully protect. */
const splitArgs = (text: string): string[] => text.split(/\s+/).filter(Boolean);

export function Settings() {
  const {
    settings,
    patchSettings,
    account,
    accounts,
    boffAccount,
    boffAccountList,
    revalidate,
    revalidating,
    removeAccount,
    switchAccount,
    signIn,
    signingIn,
    sessionBusy,
    signOut,
    switchingAccount,
    switchBoffAccount,
    switchingBoffAccount,
    boffSignIn,
    boffSignOut,
    boffSigningIn,
  } = useApp();
  const { phase, update, error } = useUpdates();
  const t = useT("settings");
  // `t` is namespaced to `settings`, so a shared string needs its own translator
  // rather than a dotted key: a `common.`-prefixed key handed to `t` resolves to
  // `settings.common.…`, misses, and renders the raw dotted string to the user.
  const tCommon = useT("common");
  // Unbound, for the tool-package `tools.*` keys a pack's `dataPack.labelKey`
  // or `titleKey` points into — the same root every tool catalog is flattened
  // onto (see `i18n/index.tsx`).
  const tRoot = useT();
  const [version, setVersion] = useState<string | null>(null);
  /** The number field's own text while it is being typed in. Held separately so
   *  a half-typed "1" on the way to "12288" is not clamped to the minimum under
   *  the cursor; committed and clamped on blur. */
  const [memoryDraft, setMemoryDraft] = useState(String(settings.memoryMib));
  // The slider writes the same setting, so the field has to follow it.
  useEffect(() => {
    setMemoryDraft(String(settings.memoryMib));
  }, [settings.memoryMib]);
  /** Free-text draft for the same reason `memoryDraft` is one: committing on
   *  every keystroke would re-split "-Xms2G -XX" the moment the space is typed
   *  and fight the cursor. Committed on blur. */
  const [jvmDraft, setJvmDraft] = useState(settings.jvmArgs.join(" "));
  const [jvmVerdicts, setJvmVerdicts] = useState<JvmArgVerdict[]>([]);
  // Judged as typed, by Rust — the renderer holds no second copy of the grammar.
  useEffect(() => {
    let live = true;
    void jvmArgsCheck(splitArgs(jvmDraft)).then((v) => {
      if (live) setJvmVerdicts(v);
    });
    return () => {
      live = false;
    };
  }, [jvmDraft]);

  // Section navigation state and tracking
  const [activeSection, setActiveSection] = useState("settings-appearance");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // IntersectionObserver to track which section is most visible
  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section that is most visible
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const mostVisible = visibleEntries.reduce((prev, current) =>
            prev.intersectionRatio > current.intersectionRatio ? prev : current
          );
          setActiveSection(
            mostVisible.target.id || "settings-appearance"
          );
        }
      },
      {
        root: scrollContainer,
        threshold: 0.3,
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
  const [mgbaStatus, setMgbaStatus] = useState<any>(null);
  const [melondsStatus, setMelondsStatus] = useState<any>(null);
  const [romFolders, setRomFolders] = useState<string[]>([]);
  const [loadingEmulators, setLoadingEmulators] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Storage (tool asset packs + boffasset cache) ────────────────────────
  const [toolPacks, setToolPacks] = useState<ToolPackSummary[]>([]);
  const [cacheBytes, setCacheBytes] = useState(0);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ToolPackSummary | null>(
    null,
  );
  const [deletingPack, setDeletingPack] = useState(false);
  // Keyed by `ToolPackProgress.tool` — installs now start silently in the
  // background the moment a tool opens (`useToolPack`), so this is the only
  // place any of that becomes visible. A record rather than one value:
  // nothing stops two different tools' packs from downloading at once.
  const [packProgress, setPackProgress] = useState<
    Record<string, ToolPackProgress>
  >({});

  const loadStorage = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const [list, bytes] = await Promise.all([
        toolPacksList(),
        assetCacheBytes(),
      ]);
      setToolPacks(list);
      setCacheBytes(bytes);
    } catch (err) {
      // Degrades to an empty section rather than blocking the rest of
      // Settings — a browser tab or a first run with no packs yet is a valid
      // state, not an error worth a banner.
      console.error("Failed to load tool packs:", err);
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  useEffect(() => {
    void loadStorage();
  }, [loadStorage]);

  useEffect(() => {
    const offs = [
      onPackProgress((e) =>
        setPackProgress((prev) => ({ ...prev, [e.tool]: e })),
      ),
      onPackDone((e) => {
        setPackProgress((prev) => {
          const { [e.tool]: _omit, ...rest } = prev;
          return rest;
        });
        void loadStorage();
      }),
      onPackError((e) =>
        setPackProgress((prev) => {
          const { [e.tool]: _omit, ...rest } = prev;
          return rest;
        }),
      ),
    ];
    return () => offs.forEach((off) => off());
  }, [loadStorage]);

  /** A pack's display name, resolved through the tool registry rather than
   *  shown as the raw `tool` key: `ToolManifest.dataPack.labelKey` (or the
   *  manifest's own `titleKey` when a pack declares no label of its own) is
   *  what the gate and this row must agree on. */
  const packLabel = useCallback(
    (tool: string): string => {
      const manifest = listTools().find((m) => m.dataPack?.id === tool);
      if (!manifest) return tool;
      return tRoot(manifest.dataPack?.labelKey ?? manifest.titleKey);
    },
    [tRoot],
  );

  const handleDeletePack = async () => {
    if (!pendingDelete) return;
    setDeletingPack(true);
    try {
      await toolPacksRemove(pendingDelete.tool);
      toast.success(
        t("storage.deleteSuccess", { name: packLabel(pendingDelete.tool) }),
      );
      setPendingDelete(null);
      void loadStorage();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? t("storage.deleteError"),
      );
    } finally {
      setDeletingPack(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await assetCacheClear();
      setCacheBytes(0);
      toast.success(t("storage.cacheClearSuccess"));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? t("storage.cacheClearError"),
      );
    } finally {
      setClearingCache(false);
    }
  };

  useEffect(() => {
    // Null in a browser tab, where there is no shell to ask.
    void getRuntimeInfo().then((info) => setVersion(info?.appVersion ?? null));
  }, []);

  useEffect(() => {
    // Load emulator status and ROM folders on mount
    setLoadingEmulators(true);
    setLoadError(null);
    Promise.all([
      emulatorStatus("mgba")
        .then((s) => setMgbaStatus(s))
        .catch((err) => {
          console.error("Failed to load mGBA status:", err);
          setLoadError(t("emulators.loadError"));
        }),
      emulatorStatus("melonds")
        .then((s) => setMelondsStatus(s))
        .catch((err) => {
          console.error("Failed to load melonDS status:", err);
          setLoadError(t("emulators.loadError"));
        }),
      romDirsGet()
        .then((dirs) => setRomFolders(dirs))
        .catch((err) => {
          console.error("Failed to load ROM folders:", err);
          setLoadError(t("emulators.loadError"));
        }),
    ]).finally(() => setLoadingEmulators(false));
  }, []);

  const checking = phase === "checking";

  const handleEmulatorLocate = async (kind: "mgba" | "melonds") => {
    const path = await filePicker();
    if (!path) return;
    try {
      const newStatus = await emulatorSetPath(kind, path);
      if (kind === "mgba") setMgbaStatus(newStatus);
      else setMelondsStatus(newStatus);
      toast.success(t("emulators.emulatorPathSet"));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          t("emulators.emulatorPathError"),
      );
    }
  };

  const handleEmulatorClear = async (kind: "mgba" | "melonds") => {
    try {
      const newStatus = await emulatorClearPath(kind);
      if (kind === "mgba") setMgbaStatus(newStatus);
      else setMelondsStatus(newStatus);
      toast.success(t("emulators.emulatorPathCleared"));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          t("emulators.emulatorPathError"),
      );
    }
  };

  const handleAddRomFolder = async () => {
    const dir = await folderPicker();
    if (!dir) return;
    try {
      const updated = await romDirsAdd(dir);
      setRomFolders(updated);
      toast.success(t("emulators.addFolderSuccess"));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ?? t("emulators.addFolderError"),
      );
    }
  };

  const handleRemoveRomFolder = async (dir: string) => {
    try {
      const updated = await romDirsRemove(dir);
      setRomFolders(updated);
      toast.success(t("emulators.removeFolderSuccess"));
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message ??
          t("emulators.removeFolderError"),
      );
    }
  };

  const formatEmulatorStatus = (
    status: any,
    kind: "mgba" | "melonds",
  ): {
    label: string;
    path?: string;
    method?: string;
    detail?: string;
    warning: boolean;
  } | null => {
    if (!status) return null;
    const kindLabel =
      kind === "mgba" ? t("emulators.mgba") : t("emulators.melonds");
    if (status.staleOverride) {
      return {
        label: kindLabel,
        detail: t("emulators.staleOverrideWarning"),
        warning: true,
      };
    }
    if (!status.resolved) {
      return {
        label: kindLabel,
        detail: t("emulators.notFound"),
        warning: false,
      };
    }
    // Source + method labels come from i18n — "vía RetroArch" is copy, not code.
    // Path and method are returned separately so the view can truncate the long
    // path on one line without hiding how it was resolved.
    const sourceLabel = t(`emulators.source.${status.resolved.source}`);
    const method =
      status.resolved.via === "retroarch"
        ? t("emulators.viaRetroarch", { source: sourceLabel })
        : sourceLabel;
    return {
      label: kindLabel,
      path: status.resolved.path as string,
      method,
      warning: false,
    };
  };

  const handleSectionClick = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const boffLocked = switchingBoffAccount || sessionBusy || boffSigningIn;

  return (
    <div className="px-8 py-7">
      <ToolHeader className="mb-6" title={t("title")} />

      <div className="mx-auto flex w-full gap-8">
        {/* Sticky section navigation - hidden below 900px */}
        <nav className="hidden w-48 lg:block">
          <div className="sticky top-0 self-start">
            <ul className="flex flex-col gap-2">
              {[
                { id: "settings-appearance", key: "sections.appearance.title" },
                { id: "settings-game", key: "sections.game.title" },
                { id: "settings-emulators", key: "sections.emulators.title" },
                { id: "settings-account", key: "sections.account.title" },
                { id: "settings-storage", key: "sections.storage.title" },
                { id: "settings-app", key: "sections.app.title" },
              ].map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full text-left font-mono text-[11px] uppercase tracking-[0.1em] border-l-2 pl-3 py-1 transition-colors ${
                      activeSection === section.id
                        ? "border-accent text-accent"
                        : "border-transparent text-txt-muted hover:text-txt"
                    }`}
                  >
                    {t(section.key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content column */}
        <div className="flex-1 flex flex-col gap-10 max-w-[760px]">
        <Section
          id="settings-appearance"
          sectionRef={(el) => {
            if (el) sectionRefs.current["settings-appearance"] = el;
          }}
          title={t("sections.appearance.title")}
          lead={t("sections.appearance.lead")}
        >
          <Panel>
            <div className="flex flex-col gap-5">
              <Field label={t("language.label")}>
                <Seg
                  className="justify-self-start"
                  value={settings.locale}
                  onChange={(locale) =>
                    patchSettings({ locale: locale as typeof settings.locale })
                  }
                  options={[
                    { value: "es", label: t("language.es") },
                    { value: "en", label: t("language.en") },
                  ]}
                />
              </Field>

              <Divider />

              <Field label={t("uiScale.label")} hint={t("uiScale.hint")}>
                <Seg
                  className="justify-self-start"
                  value={String(settings.uiScale ?? 1)}
                  onChange={(value) =>
                    patchSettings({ uiScale: Number(value) as UiScale })
                  }
                  options={UI_SCALES.map((scale) => ({
                    value: String(scale),
                    label: `${Math.round(scale * 100)}%`,
                  }))}
                />
              </Field>

              <Divider />

              <Field label={t("packLayout.label")}>
                <Seg
                  className="justify-self-start"
                  value={settings.packLayout}
                  onChange={(packLayout) =>
                    patchSettings({
                      packLayout: packLayout as typeof settings.packLayout,
                    })
                  }
                  options={[
                    { value: "card", label: t("packLayout.card") },
                    { value: "compact", label: t("packLayout.compact") },
                    { value: "row", label: t("packLayout.row") },
                  ]}
                />
              </Field>
            </div>
          </Panel>
        </Section>

        <Section
          id="settings-game"
          sectionRef={(el) => {
            if (el) sectionRefs.current["settings-game"] = el;
          }}
          title={t("sections.game.title")}
          lead={t("sections.game.lead")}
        >
          <Panel
            title={t("performance.title")}
            aside={
              <Badge tone={settings.memoryAuto ? "ok" : "info"}>
                {settings.memoryAuto
                  ? t("performance.auto")
                  : t("performance.manual")}
              </Badge>
            }
          >
            {/* §9 — the global default. Each pack can still inherit this, override
              it, or size itself; the per-pack control lives in su ficha. */}
            <Toggle
              on={settings.memoryAuto}
              onChange={(memoryAuto) => patchSettings({ memoryAuto })}
              label={t("performance.autoToggle")}
            />
            {/* Slider for the sense of the range, number for a value you can
              actually hit: 6144 is four pixels wide on a 2–16 GiB track. Both
              write the same setting, and the number is clamped on commit rather
              than per keystroke so typing "1" on the way to "12288" is not
              snapped to the minimum under the cursor. */}
            <div className="mt-4 flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <Slider
                  label={t("performance.slider")}
                  min={2048}
                  max={16384}
                  step={512}
                  value={settings.memoryMib}
                  unit=" MiB"
                  disabled={settings.memoryAuto}
                  onChange={(memoryMib) => patchSettings({ memoryMib })}
                />
              </div>
              <div className="w-[116px] shrink-0">
                <Input
                  type="number"
                  min={2048}
                  max={16384}
                  step={512}
                  aria-label={t("performance.slider")}
                  disabled={settings.memoryAuto}
                  value={memoryDraft}
                  onChange={(e) => setMemoryDraft(e.target.value)}
                  onBlur={() => {
                    const parsed = Number(memoryDraft);
                    const next = Number.isFinite(parsed)
                      ? Math.min(16384, Math.max(2048, Math.round(parsed)))
                      : settings.memoryMib;
                    setMemoryDraft(String(next));
                    if (next !== settings.memoryMib)
                      patchSettings({ memoryMib: next });
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-txt-dim">
              {settings.memoryAuto
                ? t("performance.autoHint")
                : t("performance.manualHint", {
                    size: formatBytes(settings.memoryMib * 1024 * 1024),
                  })}
            </p>
          </Panel>

          <Panel title={t("java.title")}>
            <Field label={t("java.pathLabel")} hint={t("java.pathHint")}>
              <Input
                value={settings.javaPath ?? ""}
                placeholder={t("java.placeholder")}
                onChange={(e) =>
                  patchSettings({ javaPath: e.target.value || null })
                }
              />
            </Field>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={settings.javaPath ? "warn" : "ok"}>
                {settings.javaPath ? t("java.manual") : t("java.auto")}
              </Badge>
              <span className="text-xs text-txt-dim">
                {settings.javaPath ? t("java.manualHint") : t("java.autoHint")}
              </span>
            </div>
          </Panel>

          <Panel
            title={t("jvm.title")}
            aside={
              <Badge tone={settings.jvmArgs.length ? "warn" : "ok"}>
                {settings.jvmArgs.length
                  ? t("jvm.count", { count: settings.jvmArgs.length })
                  : t("jvm.none")}
              </Badge>
            }
          >
            {/* A free-text field, like every other launcher's — but judged by
              the same Rust allowlist the installer applies, so a refused flag
              is named HERE instead of disappearing at launch. */}
            <Field label={t("jvm.label")} hint={t("jvm.hint")}>
              <Input
                value={jvmDraft}
                placeholder={t("jvm.placeholder")}
                onChange={(e) => setJvmDraft(e.target.value)}
                onBlur={() => patchSettings({ jvmArgs: splitArgs(jvmDraft) })}
              />
            </Field>
            {jvmVerdicts.some((v) => !v.ok) && (
              <ul className="mt-2 flex flex-col gap-1" role="alert">
                {jvmVerdicts
                  .filter((v) => !v.ok)
                  .map((v) => (
                    <li key={v.arg} className="text-[11px] text-bad">
                      {t("jvm.rejected", { arg: v.arg, reason: v.reason ?? "" })}
                    </li>
                  ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-txt-dim">{t("jvm.memoryNote")}</p>
          </Panel>

          <Panel title={t("install.title")}>
            <Field label={t("install.gameDir")}>
              <Input
                value={settings.gameDir}
                onChange={(e) => patchSettings({ gameDir: e.target.value })}
              />
            </Field>
            {/* §9 — rollback depth. Almost free: a retained version is its file
              list, and the .jar it names lives once in the shared cache however
              many versions reference it. */}
            <Field label={t("install.retain")} className="mt-4">
              <Input
                type="number"
                min={1}
                max={20}
                value={settings.retainVersions}
                onChange={(e) =>
                  patchSettings({ retainVersions: Number(e.target.value) || 1 })
                }
              />
            </Field>
            <Divider className="my-4" />
            <div className="flex flex-col gap-3">
              <Toggle
                on={settings.closeOnLaunch}
                onChange={(closeOnLaunch) => patchSettings({ closeOnLaunch })}
                label={t("install.closeOnLaunch")}
              />
              <Toggle
                on={settings.keepLogs}
                onChange={(keepLogs) => patchSettings({ keepLogs })}
                label={t("install.keepLogs")}
              />
              <div className="flex flex-col gap-1">
                <Toggle
                  on={settings.backupBeforeUpdate}
                  onChange={(backupBeforeUpdate) =>
                    patchSettings({ backupBeforeUpdate })
                  }
                  label={t("install.backupBeforeUpdate")}
                />
                <p className="pl-[52px] text-[11px] text-txt-dim">
                  {t("install.backupBeforeUpdateHint")}
                </p>
              </div>
            </div>
          </Panel>
        </Section>

        <Section
          id="settings-emulators"
          sectionRef={(el) => {
            if (el) sectionRefs.current["settings-emulators"] = el;
          }}
          title={t("sections.emulators.title")}
          lead={t("sections.emulators.lead")}
        >
          <Panel>
            {loadError && (
              <div className="mb-4 flex items-center justify-between rounded border border-warn bg-surface-warn-dim p-3">
                <p className="text-sm text-warn">{loadError}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLoadError(null)}
                >
                  {tCommon("primitives.dismiss")}
                </Button>
              </div>
            )}
            {/* Emulator status rows */}
            <div className="space-y-4">
              {/* mGBA row */}
              {mgbaStatus &&
                (() => {
                  const status = formatEmulatorStatus(mgbaStatus, "mgba");
                  return (
                    <div className="rounded border border-line bg-surface-bright p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{status?.label}</p>
                          {status?.path ? (
                            <>
                              <p
                                className="truncate font-mono text-[11px] text-txt-muted"
                                title={status.path}
                              >
                                {elidePath(status.path)}
                              </p>
                              <p className="truncate text-[11px] text-txt-dim">
                                {status.method}
                              </p>
                            </>
                          ) : (
                            <p
                              className={`text-xs ${status?.warning ? "text-warn" : "text-txt-muted"}`}
                            >
                              {status?.detail}
                            </p>
                          )}
                        </div>
                        <div className="ml-3 flex shrink-0 gap-2">
                          {!mgbaStatus.resolved && !mgbaStatus.staleOverride ? (
                            <Button
                              size="sm"
                              onClick={() => void handleEmulatorLocate("mgba")}
                            >
                              {t("emulators.locate")}
                            </Button>
                          ) : (
                            <>
                              <IconButton
                                name="folder"
                                label={t("emulators.change")}
                                size="sm"
                                onClick={() =>
                                  void handleEmulatorLocate("mgba")
                                }
                              />
                              <IconButton
                                name="x"
                                label={t("emulators.clear")}
                                size="sm"
                                onClick={() => void handleEmulatorClear("mgba")}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* melonDS row */}
              {melondsStatus &&
                (() => {
                  const status = formatEmulatorStatus(melondsStatus, "melonds");
                  return (
                    <div className="rounded border border-line bg-surface-bright p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{status?.label}</p>
                          {status?.path ? (
                            <>
                              <p
                                className="truncate font-mono text-[11px] text-txt-muted"
                                title={status.path}
                              >
                                {elidePath(status.path)}
                              </p>
                              <p className="truncate text-[11px] text-txt-dim">
                                {status.method}
                              </p>
                            </>
                          ) : (
                            <p
                              className={`text-xs ${status?.warning ? "text-warn" : "text-txt-muted"}`}
                            >
                              {status?.detail}
                            </p>
                          )}
                        </div>
                        <div className="ml-3 flex shrink-0 gap-2">
                          {!melondsStatus.resolved &&
                          !melondsStatus.staleOverride ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                void handleEmulatorLocate("melonds")
                              }
                            >
                              {t("emulators.locate")}
                            </Button>
                          ) : (
                            <>
                              <IconButton
                                name="folder"
                                label={t("emulators.change")}
                                size="sm"
                                onClick={() =>
                                  void handleEmulatorLocate("melonds")
                                }
                              />
                              <IconButton
                                name="x"
                                label={t("emulators.clear")}
                                size="sm"
                                onClick={() =>
                                  void handleEmulatorClear("melonds")
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>

            <Divider className="my-4" />

            {/* ROM folders section */}
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-sm">{t("emulators.romFolders")}</p>
              <Button
                size="sm"
                icon="plus"
                onClick={() => void handleAddRomFolder()}
              >
                {t("emulators.addFolder")}
              </Button>
            </div>

            {romFolders.length === 0 ? (
              <p className="text-xs text-txt-dim">{t("emulators.noFolders")}</p>
            ) : (
              <div className="space-y-2">
                {romFolders.map((folder) => (
                  <div
                    key={folder}
                    className="flex items-center justify-between gap-2 rounded bg-surface-bright p-2 text-sm"
                  >
                    <span className="truncate font-mono text-xs" title={folder}>
                      {elidePath(folder)}
                    </span>
                    <IconButton
                      name="x"
                      label={t("emulators.removeFolder")}
                      size="sm"
                      className="shrink-0"
                      onClick={() => void handleRemoveRomFolder(folder)}
                    />
                  </div>
                ))}
              </div>
            )}

            <Divider className="my-4" />

            {/* EmuDeck recommendation */}
            <div className="space-y-2">
              <p className="text-xs font-medium">
                {t("emulators.emudeckRecommendation")}
              </p>
              <a
                href="https://www.emudeck.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-bright hover:underline"
              >
                https://www.emudeck.com/
              </a>
            </div>

            <p className="mt-4 text-[11px] text-txt-dim italic">
              {t("emulators.packPagePrimary")}
            </p>
          </Panel>
        </Section>

        <Section
          id="settings-account"
          sectionRef={(el) => {
            if (el) sectionRefs.current["settings-account"] = el;
          }}
          title={t("sections.account.title")}
          lead={t("sections.account.lead")}
        >
          <Panel>
            {/* Boffmedia account roster */}
            <div className="mb-4">
              <p className="mb-3 text-sm font-medium">
                {t("account.boffAccounts")}
              </p>
              {boffAccountList.length > 0 ? (
                <div className="space-y-2">
                  {boffAccountList.map((entry) => {
                    const isActive = entry.id === boffAccount?.id;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 border-b border-line py-2 last:border-b-0"
                      >
                        <BoffAvatar
                          username={entry.username}
                          avatarUrl={entry.avatarUrl}
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-semibold">
                            {entry.username}
                            {isActive && (
                              <Badge tone="ok">
                                {t("account.boffActive")}
                              </Badge>
                            )}
                          </p>
                          <p className="truncate font-mono text-[10px] text-txt-dim">
                            #{entry.id}
                          </p>
                        </div>
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={boffLocked}
                            onClick={() => void switchBoffAccount(entry.id)}
                          >
                            {t("account.useBoffAccount")}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-txt-dim">
                  {t("account.minecraftNone")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  icon="plus"
                  disabled={boffLocked}
                  onClick={() => void boffSignIn()}
                >
                  {t("account.addBoffAccount")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="logout"
                  disabled={boffLocked || !boffAccount}
                  onClick={() => void boffSignOut()}
                >
                  {t("account.signOutBoff")}
                </Button>
              </div>
            </div>

            <Divider className="my-4" />

            <DataList
              rows={[
                {
                  label: t("account.token"),
                  value: t("account.tokenValue"),
                  icon: "lock",
                },
              ]}
            />
            {/* Revalidates the BOFFMEDIA session — the one the pack list uses. A
              stale launcher JWT is what the "packs won't load / 401" state is;
              the Minecraft session is a separate, launch-time credential. */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                icon="refresh"
                disabled={!boffAccount || revalidating}
                onClick={() => {
                  void revalidate();
                }}
              >
                {revalidating
                  ? t("account.revalidating")
                  : t("account.revalidate")}
              </Button>
              <span className="text-xs text-txt-dim">
                {t("account.revalidateHint")}
              </span>
            </div>

            <Divider className="my-4" />

            {/* The linked Minecraft identities: sub-credentials asked for at
              launch time, not the launcher principal.

              This is a LIST, and that is the point. auth_accounts/auth_switch
              have supported several linked accounts since the roster landed,
              but this panel used to render exactly one of them with an
              "Unlink" button — so the only account surface anyone goes
              looking for stated, in as many words, that you get one Minecraft
              account. The rail chip had the real switcher, hidden behind a
              32px avatar. Adding is the same device flow either way: the
              roster keys on UUID, so it appends rather than replacing. */}
            <p className="mb-1 text-sm font-medium">
              {t("account.linkedMinecraft")}
            </p>
            <p className="mb-3 text-xs text-txt-dim">
              {t("account.minecraftLead")}
            </p>

            {/* `accounts` is the roster; `account` is the one holding a live
              session. Falling back to a single synthesised row keeps the panel
              truthful when the roster file could not be read — authAccounts
              swallows that and returns [] rather than blocking the shell. */}
            {(accounts.length > 0
              ? accounts
              : account
                ? [{ ...account, active: true }]
                : []
            ).map((entry) => {
              const isActive = entry.uuid === account?.uuid;
              return (
                <div
                  key={entry.uuid}
                  className="flex items-center gap-3 border-b border-line py-2 last:border-b-0"
                >
                  <PlayerHead
                    skinUrl={entry.skinUrl}
                    username={entry.username}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm">
                      {entry.username}
                      {isActive && (
                        <Badge tone="ok">
                          {t("account.minecraftActive")}
                        </Badge>
                      )}
                    </p>
                    <p className="truncate font-mono text-[10px] text-txt-dim">
                      {entry.uuid}
                    </p>
                  </div>
                  {/* Switching runs the full MSA refresh chain and swaps the
                    session the game launches with, so it must not overlap an
                    install or a running game (sessionBusy). */}
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={switchingAccount || sessionBusy || signingIn}
                      onClick={() => void switchAccount(entry.uuid)}
                    >
                      {t("account.useMinecraft")}
                    </Button>
                  )}
                  <IconButton
                    name="x"
                    size="sm"
                    variant="ghost"
                    label={t("account.unlinkMinecraft")}
                    title={t("account.unlinkMinecraft")}
                    disabled={switchingAccount || sessionBusy}
                    onClick={() => void removeAccount(entry.uuid)}
                  />
                </div>
              );
            })}

            {accounts.length === 0 && !account && (
              <p className="text-xs text-txt-dim">
                {t("account.minecraftNone")}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Always present, linked accounts or none: this is the
                affordance that was missing entirely. */}
              <Button
                size="sm"
                variant="ghost"
                icon="plus"
                disabled={switchingAccount || sessionBusy || signingIn}
                onClick={() => void signIn()}
              >
                {t("account.addMinecraft")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon="logout"
                onClick={() => signOut()}
              >
                {t("account.signOutEverywhere")}
              </Button>
            </div>
            <p className="mt-2 text-xs text-txt-dim">
              {t("account.signOutEverywhereHint")}
            </p>
            <p className="mt-3 text-xs text-txt-dim">{t("account.note")}</p>
          </Panel>
        </Section>

        <Section
          id="settings-storage"
          sectionRef={(el) => {
            if (el) sectionRefs.current["settings-storage"] = el;
          }}
          title={t("sections.storage.title")}
          lead={t("sections.storage.lead")}
        >
          <Panel title={t("storage.packsTitle")}>
            {loadingStorage ? (
              <p className="text-xs text-txt-dim">{t("storage.loading")}</p>
            ) : toolPacks.length === 0 &&
              Object.keys(packProgress).length === 0 ? (
              <p className="text-xs text-txt-dim">{t("storage.noPacks")}</p>
            ) : (
              <div className="space-y-2">
                {toolPacks.map((pack) => (
                  <div
                    key={pack.tool}
                    className="flex items-center justify-between gap-3 rounded border border-line bg-surface-bright p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {packLabel(pack.tool)}
                      </p>
                      <p className="font-mono text-[11px] text-txt-dim">
                        {t("storage.version", { version: pack.version })}
                        {" · "}
                        {formatBytes(pack.bytes)}
                      </p>
                    </div>
                    <IconButton
                      name="trash"
                      label={t("storage.delete")}
                      size="sm"
                      onClick={() => setPendingDelete(pack)}
                    />
                  </div>
                ))}
                {/* One row per pack currently downloading in the background
                    (`useToolPack`, triggered by opening the tool) — this is
                    now the ONLY place any of that becomes visible. It can
                    name a pack not yet in `toolPacks` above (a first
                    install) or one already listed (a silent update). */}
                {Object.values(packProgress).map((progress) => {
                  const total = progress.total ?? 0;
                  const downloaded = progress.downloaded ?? 0;
                  const pct = total > 0 ? (downloaded / total) * 100 : 0;
                  return (
                    <div
                      key={progress.tool}
                      className="rounded border border-line bg-surface-bright p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {packLabel(progress.tool)}
                        </p>
                        <span className="text-[11px] text-txt-dim">
                          {t(`storage.phase.${progress.phase}`)}
                        </span>
                      </div>
                      <Progress value={pct} aria-label={t("storage.downloading")} />
                      <div className="mt-1 flex items-center justify-between text-[11px] text-txt-dim">
                        <span>
                          {t("storage.progressOf", {
                            downloaded: formatBytes(downloaded),
                            total: formatBytes(total),
                          })}
                        </span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title={t("storage.cacheTitle")}>
            <DataList
              rows={[
                { label: t("storage.cacheSize"), value: formatBytes(cacheBytes) },
              ]}
            />
            <div className="mt-3">
              <Button
                size="sm"
                variant="ghost"
                icon="trash"
                loading={clearingCache}
                disabled={cacheBytes === 0}
                onClick={() => void handleClearCache()}
              >
                {t("storage.cacheClear")}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-txt-dim">
              {t("storage.cacheHint")}
            </p>
          </Panel>
        </Section>

        <Section
          id="settings-app"
          sectionRef={(el) => {
            if (el) sectionRefs.current["settings-app"] = el;
          }}
          title={t("sections.app.title")}
          lead={t("sections.app.lead")}
        >
          <Panel title={t("updates.title")}>
            <DataList
              rows={[
                {
                  label: t("updates.installed"),
                  value: version ?? t("updates.browserMode"),
                  mono: true,
                },
              ]}
            />
            <div className="mt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                icon="refresh"
                disabled={checking}
                onClick={() => {
                  void checkForUpdates(true);
                }}
              >
                {checking ? t("updates.checking") : t("updates.check")}
              </Button>
              <span className="text-xs text-txt-dim">
                {error
                  ? error
                  : update
                    ? t("updates.availableHint", { version: update.version })
                    : checking
                      ? t("updates.checkingHint")
                      : t("updates.idleHint")}
              </span>
            </div>
          </Panel>
        </Section>
        </div>
      </div>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t("storage.deleteTitle")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-txt-muted">
            {t("storage.deleteWarning", {
              name: pendingDelete ? packLabel(pendingDelete.tool) : "",
            })}
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setPendingDelete(null)}>
              {t("storage.cancelButton")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon="trash"
              loading={deletingPack}
              onClick={() => void handleDeletePack()}
            >
              {t("storage.deleteButton")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** One group of related settings.
 *
 *  The heading carries the hierarchy the old flat grid had none of: nine panels
 *  at equal weight gave the eye no order to read them in. A one-line `lead` says
 *  what the group is for, so a player scanning for "where do I change the
 *  language" can skip four sections without reading a single control. */
function Section({
  id,
  title,
  lead,
  children,
  sectionRef,
}: {
  id: string;
  title: string;
  lead?: string;
  children: ReactNode;
  sectionRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <section
      id={id}
      ref={sectionRef}
      className="flex flex-col gap-3 scroll-mt-6"
    >
      <header className="flex flex-col gap-[2px] border-b border-solid border-line pb-2">
        <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.06em] text-txt">
          {title}
        </h2>
        {lead && (
          <p className="text-[12px] leading-snug text-txt-muted">{lead}</p>
        )}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
