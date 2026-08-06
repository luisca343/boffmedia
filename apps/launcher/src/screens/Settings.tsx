import { Badge, Button, DataList, Divider, Field, Input, Kicker, Panel, Seg, Slider, Toggle } from "@boffmedia/ui"
import { useEffect, useState } from "react"

import { useT } from "../i18n"
import { getRuntimeInfo } from "../runtime"
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

  useEffect(() => {
    // Null in a browser tab, where there is no shell to ask.
    void getRuntimeInfo().then((info) => setVersion(info?.appVersion ?? null))
  }, [])

  const checking = phase === "checking"

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <Kicker>{t("kicker")}</Kicker>
        <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
          {t("title")}
        </h1>
      </header>

      <div className="grid max-w-[900px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
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
