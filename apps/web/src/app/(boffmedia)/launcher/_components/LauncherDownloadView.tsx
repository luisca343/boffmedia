"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { LauncherDownloadEntity } from "@boffmedia/shared"
import { Banner, Button, CodeBlock, Empty, Icon, Panel, Spinner, type IconName } from "@boffmedia/ui"

import { LauncherDownloadsService } from "@/services/api/boffmedia/launcherDownloadsService"

/** Las claves de Tauri (`{os}-{arch}`) que sabemos presentar. Cualquier otra se
 *  muestra igualmente en «otras plataformas» con su clave cruda: es preferible a
 *  ocultar una descarga que sí existe. */
const PLATFORMS: Record<string, { labelKey: string; icon: IconName }> = {
  "windows-x86_64": { labelKey: "windows", icon: "cube" },
  "linux-x86_64": { labelKey: "linux", icon: "code" },
  "darwin-x86_64": { labelKey: "macIntel", icon: "cube" },
  "darwin-aarch64": { labelKey: "macApple", icon: "cube" },
}

type FeatureKey = "delta" | "mods" | "versions" | "auth" | "java" | "crash"

const FEATURES: { icon: IconName; key: FeatureKey }[] = [
  { icon: "zap", key: "delta" },
  { icon: "puzzle", key: "mods" },
  { icon: "layers", key: "versions" },
  { icon: "shield", key: "auth" },
  { icon: "sliders", key: "java" },
  { icon: "alert", key: "crash" },
]

function formatBytes(bytes: number, locale?: string): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes
  let unit = "B"
  for (const next of units) {
    value /= 1024
    unit = next
    if (value < 1024 || next === "GB") break
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${unit}`
}

/**
 * Adivina la plataforma del visitante para destacar UNA descarga.
 *
 * Solo se usa para ordenar la página: la lista completa se pinta siempre, así
 * que equivocarse cuesta un clic y nunca deja a nadie sin su instalador. No
 * distingue Intel de Apple Silicon (el user agent de Safari miente sobre la
 * arquitectura), por eso macOS cae en la lista y nunca es la principal.
 */
function guessTarget(): string | null {
  if (typeof navigator === "undefined") return null
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return "windows-x86_64"
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux-x86_64"
  return null
}

export function LauncherDownloadView() {
  const t = useTranslations("launcher")
  const [rows, setRows] = React.useState<LauncherDownloadEntity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [failed, setFailed] = React.useState(false)
  // Se resuelve en un efecto y no durante el render: `navigator` no existe en el
  // servidor y leerlo en el primer render rompería la hidratación.
  const [guess, setGuess] = React.useState<string | null>(null)

  React.useEffect(() => {
    setGuess(guessTarget())
  }, [])

  React.useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await LauncherDownloadsService.list()
        if (!alive) return
        if (!response.success) {
          setFailed(true)
          return
        }
        setRows(response.data ?? [])
      } catch {
        if (alive) setFailed(true)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const primary = React.useMemo(() => {
    if (rows.length === 0) return null
    return rows.find((row) => row.target === guess) ?? rows.find((row) => row.target === "windows-x86_64") ?? null
  }, [rows, guess])

  const others = React.useMemo(
    () => rows.filter((row) => row.target !== primary?.target),
    [rows, primary],
  )

  const label = (target: string) => {
    const known = PLATFORMS[target]
    return known ? t(`platforms.${known.labelKey}`) : target
  }

  return (
    <main className="wrap pb-[90px] pt-[34px]" data-ds="boffmedia">
      <div className="mb-7">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(46px,6vw,80px)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[17px]/[1.6] text-txt-muted">{t("lead")}</p>
      </div>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Spinner size={32} className="text-accent" />
        </div>
      ) : failed ? (
        <Banner tone="error" icon="alert" title={t("loadFailedTitle")}>
          {t("loadFailedLead")}
        </Banner>
      ) : rows.length === 0 ? (
        <Empty icon="download" title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <>
          {primary && (
            <div className="mb-8 flex flex-wrap items-center gap-6 border border-solid border-accent-line border-l-4 border-l-accent bg-[linear-gradient(120deg,var(--accent-soft),var(--panel)_60%)] px-7 py-7 cut-corner">
              <span className="grid h-[58px] w-[58px] flex-none place-items-center bg-accent text-accent-ink [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]">
                <Icon name={PLATFORMS[primary.target]?.icon ?? "download"} size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[24px] not-italic normal-case text-txt">
                  {t("primaryTitle", { platform: label(primary.target) })}
                </h2>
                <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.08em] text-txt-dim">
                  {t("meta", {
                    version: primary.version,
                    size: formatBytes(primary.sizeBytes),
                    date: new Date(primary.publishedAt).toLocaleDateString(),
                  })}
                </p>
              </div>
              <Button variant="pri" icon="download" href={primary.url} className="flex-none">
                {t("download")}
              </Button>
            </div>
          )}

          <Banner tone="warn" icon="shield" title={t("smartscreenTitle")} className="mb-8">
            {t("smartscreenLead")}
          </Banner>

          <div className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
            <Panel title={t("verifyTitle")}>
              <p className="mb-4 font-body text-[15px]/[1.6] text-txt-muted">{t("verifyLead")}</p>
              {rows.map((row) => (
                <div key={row.target} className="mb-5 last:mb-0">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-txt-dim">
                      {label(row.target)} · {row.version}
                    </span>
                    <span className="truncate font-mono text-[11px] text-txt-dim" title={row.artifactName}>
                      {row.artifactName}
                    </span>
                  </div>
                  {/* copyText va aparte: lo que se copia es el hash desnudo, no la
                      etiqueta ni los saltos de línea del bloque. */}
                  <CodeBlock
                    label="SHA-512"
                    lines={[row.sha512]}
                    copyText={row.sha512}
                    className="break-all"
                  />
                </div>
              ))}
              <p className="mt-4 mb-2 font-body text-[15px]/[1.6] text-txt-muted">{t("verifyHow")}</p>
              <CodeBlock
                label="PowerShell"
                lines={[`Get-FileHash -Algorithm SHA512 .\\${rows[0]?.artifactName ?? "BoffLauncher.exe"}`]}
              />
              <CodeBlock
                label="Linux / macOS"
                lines={[`sha512sum ${rows[0]?.artifactName ?? "BoffLauncher.exe"}`]}
                className="mt-2"
              />
            </Panel>

            <div className="grid content-start gap-4">
              {others.length > 0 && (
                <Panel title={t("otherTitle")}>
                  <div className="grid gap-2">
                    {others.map((row) => (
                      <a
                        key={row.target}
                        href={row.url}
                        className="group flex items-center gap-3 border border-solid border-line bg-base px-4 py-3 no-underline cut-tag transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2"
                      >
                        <Icon
                          name={PLATFORMS[row.target]?.icon ?? "download"}
                          size={18}
                          className="flex-none text-txt-dim group-hover:text-accent"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-bold text-txt">{label(row.target)}</span>
                          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">
                            {row.version} · {formatBytes(row.sizeBytes)}
                          </span>
                        </span>
                        <Icon name="download" size={16} className="flex-none text-txt-dim group-hover:text-accent" />
                      </a>
                    ))}
                  </div>
                </Panel>
              )}

              <Panel title={t("requirementsTitle")}>
                <ul className="grid gap-2.5">
                  {["os", "webview", "ram", "account"].map((key) => (
                    <li key={key} className="flex items-start gap-2.5">
                      <Icon name="check" size={15} className="mt-[3px] flex-none text-accent" />
                      <span className="font-body text-[14px]/[1.5] text-txt-muted">
                        {t(`requirements.${key}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>

          {primary?.notes && (
            <Panel title={t("notesTitle", { version: primary.version })} className="mb-8">
              <p className="whitespace-pre-wrap font-body text-[15px]/[1.6] text-txt-muted">{primary.notes}</p>
            </Panel>
          )}

          <h2 className="mb-4 text-[26px]">{t("featuresTitle")}</h2>
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
            {FEATURES.map((feature) => (
              <Panel key={feature.key} className="p-0">
                <div className="flex items-start gap-3">
                  <Icon name={feature.icon} size={20} className="mt-[2px] flex-none text-accent" />
                  <div className="min-w-0">
                    <h3 className="text-[16px] not-italic normal-case text-txt">
                      {t(`features.${feature.key}.title`)}
                    </h3>
                    <p className="mt-1 font-body text-[14px]/[1.5] text-txt-muted">
                      {t(`features.${feature.key}.lead`)}
                    </p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
