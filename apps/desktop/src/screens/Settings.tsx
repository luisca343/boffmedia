import {
  Badge,
  Button,
  DataList,
  Divider,
  Field,
  IconButton,
  Input,
  Panel,
  Seg,
  Slider,
  Toggle,
  toast,
  ToolHeader,
} from "@boffmedia/ui";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

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
} from "../runtime";
import { UI_SCALES, type UiScale } from "../services/types";
import { checkForUpdates, useUpdates } from "../services/updates";
import { useApp } from "../state/app";
import { elidePath, formatBytes } from "../utils/format";

// Wrong Java version is the single most common launcher support ticket, hence
// the explicit, visible Java row rather than silent detection.

export function Settings() {
  const {
    settings,
    patchSettings,
    account,
    boffAccount,
    revalidate,
    revalidating,
    removeAccount,
    signOut,
    switchingAccount,
  } = useApp();
  const { phase, update, error } = useUpdates();
  const t = useT("settings");
  // `t` is namespaced to `settings`, so a shared string needs its own translator
  // rather than a dotted key: a `common.`-prefixed key handed to `t` resolves to
  // `settings.common.…`, misses, and renders the raw dotted string to the user.
  const tCommon = useT("common");
  const [version, setVersion] = useState<string | null>(null);
  /** The number field's own text while it is being typed in. Held separately so
   *  a half-typed "1" on the way to "12288" is not clamped to the minimum under
   *  the cursor; committed and clamped on blur. */
  const [memoryDraft, setMemoryDraft] = useState(String(settings.memoryMib));
  // The slider writes the same setting, so the field has to follow it.
  useEffect(() => {
    setMemoryDraft(String(settings.memoryMib));
  }, [settings.memoryMib]);
  const [mgbaStatus, setMgbaStatus] = useState<any>(null);
  const [melondsStatus, setMelondsStatus] = useState<any>(null);
  const [romFolders, setRomFolders] = useState<string[]>([]);
  const [loadingEmulators, setLoadingEmulators] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  return (
    <div className="px-8 py-7">
      <ToolHeader className="mb-6" title={t("title")} />

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-10">
        <Section
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
                                size={15}
                                className="!h-8 !w-8"
                                onClick={() =>
                                  void handleEmulatorLocate("mgba")
                                }
                              />
                              <IconButton
                                name="x"
                                label={t("emulators.clear")}
                                size={15}
                                className="!h-8 !w-8"
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
                                size={15}
                                className="!h-8 !w-8"
                                onClick={() =>
                                  void handleEmulatorLocate("melonds")
                                }
                              />
                              <IconButton
                                name="x"
                                label={t("emulators.clear")}
                                size={15}
                                className="!h-8 !w-8"
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
                      size={15}
                      className="!h-8 !w-8 shrink-0"
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
          title={t("sections.account.title")}
          lead={t("sections.account.lead")}
        >
          <Panel>
            <DataList
              rows={[
                {
                  label: t("account.boffAccount"),
                  value: boffAccount?.username ?? "—",
                },
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

            {/* The linked Minecraft identity: a sub-credential asked for at launch
              time, not the launcher principal. This is the only surface that
              keeps unlink (auth_remove) and sign-out-everywhere (auth_logout)
              reachable now that the old Minecraft account picker is gone. */}
            <p className="mb-2 text-sm font-medium">
              {t("account.linkedMinecraft")}
            </p>
            {account ? (
              <>
                <DataList
                  rows={[
                    { label: t("account.user"), value: account.username },
                    {
                      label: t("account.uuid"),
                      value: account.uuid,
                      mono: true,
                      wide: true,
                    },
                  ]}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="x"
                    disabled={switchingAccount}
                    onClick={() => void removeAccount(account.uuid)}
                  >
                    {t("account.unlinkMinecraft")}
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
              </>
            ) : (
              <>
                <p className="text-xs text-txt-dim">
                  {t("account.minecraftNone")}
                </p>
                <div className="mt-3">
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
              </>
            )}
            <p className="mt-3 text-xs text-txt-dim">{t("account.note")}</p>
          </Panel>
        </Section>

        <Section title={t("sections.app.title")} lead={t("sections.app.lead")}>
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
  );
}

/** One group of related settings.
 *
 *  The heading carries the hierarchy the old flat grid had none of: nine panels
 *  at equal weight gave the eye no order to read them in. A one-line `lead` says
 *  what the group is for, so a player scanning for "where do I change the
 *  language" can skip four sections without reading a single control. */
function Section({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
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
