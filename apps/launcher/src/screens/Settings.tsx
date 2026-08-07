import { Badge, Button, DataList, Divider, Field, Input, Kicker, Panel, Seg, Slider, Toggle, toast } from "@boffmedia/ui"
import { useEffect, useState } from "react"

import { useT } from "../i18n"
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
} from "../runtime"
import { checkForUpdates, useUpdates } from "../services/updates"
import { useLauncher } from "../state/launcher"
import { formatBytes } from "../utils/format"

// HANDOFF §6.3: "Wrong Java version is the single most common launcher support
// ticket." Hence the explicit, visible Java row rather than silent detection.

export function Settings() {
  const { settings, patchSettings, account, revalidate, revalidating } = useLauncher()
  const { phase, update, error } = useUpdates()
  const t = useT("settings")
  const [version, setVersion] = useState<string | null>(null)
  const [mgbaStatus, setMgbaStatus] = useState<any>(null)
  const [melondsStatus, setMelondsStatus] = useState<any>(null)
  const [romFolders, setRomFolders] = useState<string[]>([])
  const [loadingEmulators, setLoadingEmulators] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    // Null in a browser tab, where there is no shell to ask.
    void getRuntimeInfo().then((info) => setVersion(info?.appVersion ?? null))
  }, [])

  useEffect(() => {
    // Load emulator status and ROM folders on mount
    setLoadingEmulators(true)
    setLoadError(null)
    Promise.all([
      emulatorStatus("mgba").then((s) => setMgbaStatus(s)).catch((err) => {
        console.error("Failed to load mGBA status:", err)
        setLoadError(t("emulators.loadError"))
      }),
      emulatorStatus("melonds").then((s) => setMelondsStatus(s)).catch((err) => {
        console.error("Failed to load melonDS status:", err)
        setLoadError(t("emulators.loadError"))
      }),
      romDirsGet().then((dirs) => setRomFolders(dirs)).catch((err) => {
        console.error("Failed to load ROM folders:", err)
        setLoadError(t("emulators.loadError"))
      }),
    ]).finally(() => setLoadingEmulators(false))
  }, [])

  const checking = phase === "checking"

  const handleEmulatorLocate = async (kind: "mgba" | "melonds") => {
    const path = await filePicker()
    if (!path) return
    try {
      const newStatus = await emulatorSetPath(kind, path)
      if (kind === "mgba") setMgbaStatus(newStatus)
      else setMelondsStatus(newStatus)
      toast.success(t("emulators.emulatorPathSet"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulators.emulatorPathError"))
    }
  }

  const handleEmulatorClear = async (kind: "mgba" | "melonds") => {
    try {
      const newStatus = await emulatorClearPath(kind)
      if (kind === "mgba") setMgbaStatus(newStatus)
      else setMelondsStatus(newStatus)
      toast.success(t("emulators.emulatorPathCleared"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulators.emulatorPathError"))
    }
  }

  const handleAddRomFolder = async () => {
    const dir = await folderPicker()
    if (!dir) return
    try {
      const updated = await romDirsAdd(dir)
      setRomFolders(updated)
      toast.success(t("emulators.addFolderSuccess"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulators.addFolderError"))
    }
  }

  const handleRemoveRomFolder = async (dir: string) => {
    try {
      const updated = await romDirsRemove(dir)
      setRomFolders(updated)
      toast.success(t("emulators.removeFolderSuccess"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulators.removeFolderError"))
    }
  }

  const formatEmulatorStatus = (status: any, kind: "mgba" | "melonds") => {
    if (!status) return null
    const kindLabel = kind === "mgba" ? t("emulators.mgba") : t("emulators.melonds")
    if (status.staleOverride) {
      return {
        label: kindLabel,
        value: t("emulators.staleOverrideWarning"),
        warning: true,
      }
    }
    if (!status.resolved) {
      return {
        label: kindLabel,
        value: t("emulators.notFound"),
        warning: false,
      }
    }
    // Source + method labels come from i18n — "vía RetroArch" is copy, not code.
    const sourceLabel = t(`emulators.source.${status.resolved.source}`)
    const value =
      status.resolved.via === "retroarch"
        ? `${status.resolved.path} · ${t("emulators.viaRetroarch", { source: sourceLabel })}`
        : `${status.resolved.path} · ${sourceLabel}`
    return {
      label: kindLabel,
      value,
      warning: false,
    }
  }

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <Kicker>{t("kicker")}</Kicker>
        <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
          {t("title")}
        </h1>
      </header>

      <div className="grid max-w-[1600px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
        <Panel
          title={t("performance.title")}
          aside={<Badge tone={settings.memoryAuto ? "ok" : "info"}>
            {settings.memoryAuto ? t("performance.auto") : t("performance.manual")}
          </Badge>}
        >
          {/* §9 — the global default. Each pack can still inherit this, override
              it, or size itself; the per-pack control lives in su ficha. */}
          <Toggle
            on={settings.memoryAuto}
            onChange={(memoryAuto) => patchSettings({ memoryAuto })}
            label={t("performance.autoToggle")}
          />
          <div className="mt-4">
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
          <p className="mt-2 text-xs text-txt-dim">
            {settings.memoryAuto
              ? t("performance.autoHint")
              : t("performance.manualHint", { size: formatBytes(settings.memoryMib * 1024 * 1024) })}
          </p>
        </Panel>

        <Panel title={t("java.title")}>
          <Field label={t("java.pathLabel")} hint={t("java.pathHint")}>
            <Input
              value={settings.javaPath ?? ""}
              placeholder={t("java.placeholder")}
              onChange={(e) => patchSettings({ javaPath: e.target.value || null })}
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

        <Panel title={t("emulators.title")}>
          {loadError && (
            <div className="mb-4 flex items-center justify-between rounded border border-warn bg-surface-warn-dim p-3">
              <p className="text-sm text-warn">{loadError}</p>
              <Button size="sm" variant="ghost" onClick={() => setLoadError(null)}>
                {t("common.primitives.dismiss")}
              </Button>
            </div>
          )}
          {/* Emulator status rows */}
          <div className="space-y-4">
            {/* mGBA row */}
            {mgbaStatus && (() => {
              const status = formatEmulatorStatus(mgbaStatus, "mgba")
              return (
                <div className="rounded border border-line bg-surface-bright p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{status?.label}</p>
                      <p className={`text-xs ${status?.warning ? "text-warn" : "text-txt-muted"}`}>
                        {status?.value}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 gap-2">
                      {!mgbaStatus.resolved && !mgbaStatus.staleOverride ? (
                        <Button size="sm" onClick={() => void handleEmulatorLocate("mgba")}>
                          {t("emulators.locate")}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => void handleEmulatorLocate("mgba")}>
                            {t("emulators.change")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleEmulatorClear("mgba")}>
                            {t("emulators.clear")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* melonDS row */}
            {melondsStatus && (() => {
              const status = formatEmulatorStatus(melondsStatus, "melonds")
              return (
                <div className="rounded border border-line bg-surface-bright p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{status?.label}</p>
                      <p className={`text-xs ${status?.warning ? "text-warn" : "text-txt-muted"}`}>
                        {status?.value}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 gap-2">
                      {!melondsStatus.resolved && !melondsStatus.staleOverride ? (
                        <Button size="sm" onClick={() => void handleEmulatorLocate("melonds")}>
                          {t("emulators.locate")}
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => void handleEmulatorLocate("melonds")}>
                            {t("emulators.change")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleEmulatorClear("melonds")}>
                            {t("emulators.clear")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          <Divider className="my-4" />

          {/* ROM folders section */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-sm">{t("emulators.romFolders")}</p>
            <Button size="sm" icon="plus" onClick={() => void handleAddRomFolder()}>
              {t("emulators.addFolder")}
            </Button>
          </div>

          {romFolders.length === 0 ? (
            <p className="text-xs text-txt-dim">{t("emulators.noFolders")}</p>
          ) : (
            <div className="space-y-2">
              {romFolders.map((folder) => (
                <div key={folder} className="flex items-center justify-between rounded bg-surface-bright p-2 text-sm">
                  <span className="truncate font-mono text-xs">{folder}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleRemoveRomFolder(folder)}
                  >
                    {t("emulators.removeFolder")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Divider className="my-4" />

          {/* EmuDeck recommendation */}
          <div className="space-y-2">
            <p className="text-xs font-medium">{t("emulators.emudeckRecommendation")}</p>
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
          <Field label={t("install.retain")}>
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
                onChange={(backupBeforeUpdate) => patchSettings({ backupBeforeUpdate })}
                label={t("install.backupBeforeUpdate")}
              />
              <p className="pl-[52px] text-[11px] text-txt-dim">
                {t("install.backupBeforeUpdateHint")}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title={t("language.title")}>
          <Field label={t("language.label")}>
            <Seg
              value={settings.locale}
              onChange={(locale) => patchSettings({ locale: locale as typeof settings.locale })}
              options={[
                { value: "es", label: t("language.es") },
                { value: "en", label: t("language.en") },
              ]}
            />
          </Field>
        </Panel>

        <Panel title={t("updates.title")}>
          <DataList
            rows={[
              { label: t("updates.installed"), value: version ?? t("updates.browserMode"), mono: true },
            ]}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              icon="refresh"
              disabled={checking}
              onClick={() => {
                void checkForUpdates(true)
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

        <Panel title={t("account.title")}>
          <DataList
            rows={[
              { label: t("account.user"), value: account?.username ?? "—" },
              { label: t("account.uuid"), value: account?.uuid ?? "—", mono: true, wide: true },
              { label: t("account.token"), value: t("account.tokenValue"), icon: "lock" },
            ]}
          />
          <p className="mt-3 text-xs text-txt-dim">{t("account.note")}</p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              icon="refresh"
              disabled={!account || revalidating}
              onClick={() => {
                void revalidate()
              }}
            >
              {revalidating ? t("account.revalidating") : t("account.revalidate")}
            </Button>
            <span className="text-xs text-txt-dim">{t("account.revalidateHint")}</span>
          </div>
        </Panel>
      </div>
    </div>
  )
}
