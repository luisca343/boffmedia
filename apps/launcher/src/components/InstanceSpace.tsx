import { useCallback, useEffect, useState } from "react"

import {
  Badge,
  Button,
  Divider,
  Empty,
  Field,
  Input,
  Panel,
  Seg,
  Slider,
  Toggle,
} from "@boffmedia/ui"

import {
  instanceOptional,
  instanceOptionalSet,
  instanceRevert,
  instanceRuntime,
  instanceRuntimeSet,
  instanceVersions,
  type InstanceRuntime,
  type JavaChoice,
  type MemoryChoice,
  type OptionalFile,
  type RetainedVersion,
  type RuntimeSource,
} from "../runtime"
import { useT } from "../i18n"
import { formatBytes, formatWhen } from "../utils/format"

// HANDOFF §9 — "locked vs. user space" and "pack version pinning + rollback".
//
// A separate component rather than more of PackDetail: both features read the
// instance marker on the Rust side and neither belongs to the install state
// machine in state/launcher.tsx, which owns progress events and nothing else.
//
// Everything here goes through runtime.ts, so `dev:renderer` renders it against
// the in-process simulation and the screen stays browser-runnable.

type Props = {
  slug: string
  /** Pack password, if any — a revert re-downloads through the same
   *  entitlement-checked route an install uses (§7.4). */
  password?: string
  /** Called after a revert so the library's install state stops claiming the
   *  version that was just rolled back. */
  onChanged?: () => void
}

// §9 — "per-instance Java runtime + memory, with a sane heuristic". Three
// states, three badges: what the player picked must be readable at a glance, or
// "why is this pack using 4 GB?" becomes a support ticket.

const SOURCE_TONE: Record<RuntimeSource, "info" | "warn" | "ok"> = {
  global: "info",
  override: "warn",
  auto: "ok",
}

const gib = (mib: number) => `${(mib / 1024).toFixed(1).replace(".", ",")} GB`

export function InstanceSpace({ slug, password, onChanged }: Props) {
  const t = useT("instanceSpace")
  const [optional, setOptional] = useState<OptionalFile[] | null>(null)
  const [versions, setVersions] = useState<RetainedVersion[] | null>(null)
  const [runtime, setRuntime] = useState<InstanceRuntime | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const SOURCE_LABEL: Record<RuntimeSource, string> = {
    global: t("sourceGlobal"),
    override: t("sourceOverride"),
    auto: t("sourceAuto"),
  }

  const refresh = useCallback(() => {
    void instanceOptional(slug).then(setOptional)
    void instanceVersions(slug).then(setVersions)
    void instanceRuntime(slug).then(setRuntime)
  }, [slug])

  useEffect(refresh, [refresh])

  const toggle = async (file: OptionalFile) => {
    setError(null)
    setBusy(file.path)
    try {
      setOptional(await instanceOptionalSet(slug, file.path, !file.enabled))
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("saveSelectionError"))
    } finally {
      setBusy(null)
    }
  }

  const revert = async (version: RetainedVersion) => {
    setError(null)
    setBusy(version.versionId)
    try {
      await instanceRevert(slug, version.versionId, password)
      refresh()
      onChanged?.()
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("revertError"))
    } finally {
      setBusy(null)
    }
  }

  const saveRuntime = async (memory: MemoryChoice, java: JavaChoice) => {
    setError(null)
    // Optimistic, so dragging the slider does not lag a round trip behind the
    // finger. The server's answer replaces it, resolved values and all.
    setRuntime((current) => (current ? { ...current, over: { memory, java } } : current))
    try {
      setRuntime(await instanceRuntimeSet(slug, memory, java))
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("saveConfigError"))
      void instanceRuntime(slug).then(setRuntime)
    }
  }

  const pinned = versions?.find((v) => v.current)

  return (
    <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
      <Panel
        title={t("optionalMods")}
        aside={optional?.length ? <Badge tone="info">{optional.length}</Badge> : null}
      >
        {optional === null ? (
          <p className="text-sm text-txt-muted">{t("loading")}</p>
        ) : optional.length === 0 ? (
          <Empty
            icon="cube"
            title={t("noOptional")}
            lead={t("noOptionalDetail")}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {optional.map((file) => (
              <li key={file.path} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-txt">{file.name}</p>
                  <p className="text-[11px] text-txt-dim">{formatBytes(file.size)}</p>
                </div>
                <Toggle on={file.enabled} onChange={() => void toggle(file)} />
              </li>
            ))}
          </ul>
        )}
        <Divider label={t("spaceDivider")} className="my-4" />
        {/* The single most important thing this panel can say. Players assume
            an update wipes the folder, and then never add anything to it. */}
        <p className="text-xs text-txt-dim" dangerouslySetInnerHTML={{ __html: t("spaceWarning") }} />
      </Panel>

      <Panel
        title={t("savedVersions")}
        aside={pinned ? <Badge tone="ok">{pinned.versionName}</Badge> : null}
      >
        {versions === null ? (
          <p className="text-sm text-txt-muted">{t("loading")}</p>
        ) : versions.length === 0 ? (
          <Empty
            icon="clock"
            title={t("noVersions")}
            lead={t("noVersionsDetail")}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {versions.map((version) => (
              <li key={version.versionId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-txt">
                    {version.versionName}
                    {version.current && (
                      <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-txt-dim">
                        {t("currentVersion")}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-txt-dim">
                    {formatWhen(version.installedAt)} · {t("versionFileCount", { count: version.fileCount })} ·{" "}
                    {version.minecraft}
                  </p>
                </div>
                {!version.current && (
                  <Button
                    size="sm"
                    icon="back"
                    // A version installed before the launcher recorded file
                    // lists has nothing to replay; offering the button would
                    // promise a rollback that cannot happen.
                    disabled={!version.revertible || busy !== null}
                    loading={busy === version.versionId}
                    onClick={() => void revert(version)}
                  >
                    {t("revertButton")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Divider label={t("costDivider")} className="my-4" />
        <p className="text-xs text-txt-dim" dangerouslySetInnerHTML={{ __html: t("costWarning") }} />
      </Panel>

      {/* §9 — per-instance Java runtime + memory. The resolved values sit at the
          top, BEFORE the controls: what this pack will launch with is the
          question the panel exists to answer, and "6,0 GB (automático, 214
          mods)" beats a slider the player has to interpret. */}
      <Panel
        title={`${t("memory")} · Java`}
        aside={
          runtime ? (
            <Badge tone={SOURCE_TONE[runtime.effective.memorySource]}>
              {SOURCE_LABEL[runtime.effective.memorySource]}
            </Badge>
          ) : null
        }
      >
        {runtime === null ? (
          <p className="text-sm text-txt-muted">{t("loading")}</p>
        ) : (
          <>
            <p className="text-sm text-txt">
              <strong className="font-display text-[20px] tracking-[0.04em]">
                {gib(runtime.effective.heapMib)}
              </strong>{" "}
              <span className="text-txt-muted">
                (
                {runtime.effective.memorySource === "auto"
                  ? t("memoryAutoDetail", { count: runtime.effective.modCount })
                  : runtime.effective.memorySource === "override"
                    ? t("memoryOverrideDetail")
                    : t("memoryGlobalDetail")}
                )
              </span>
            </p>
            <p className="mt-1 text-xs text-txt-dim">
              {runtime.effective.javaPath
                ? t("javaPath", { path: runtime.effective.javaPath })
                : t("javaManagedJava")}{" "}
              · {SOURCE_LABEL[runtime.effective.javaSource].toLowerCase()} · {t("javaRAM", { gib: gib(runtime.effective.totalRamMib) })}
            </p>

            <Divider label={t("memoryDivider")} className="my-4" />
            <Seg
              options={[
                { value: "inherit", label: t("inherit") },
                { value: "auto", label: t("auto") },
                { value: "fixed", label: t("manual") },
              ]}
              value={runtime.over.memory.mode}
              onChange={(mode) =>
                void saveRuntime(
                  mode === "fixed"
                    ? { mode: "fixed", mib: runtime.effective.heapMib }
                    : mode === "auto"
                      ? { mode: "auto" }
                      : { mode: "inherit" },
                  runtime.over.java,
                )
              }
            />
            {runtime.over.memory.mode === "fixed" ? (
              <div className="mt-3">
                <Slider
                  label={t("memory")}
                  min={1024}
                  max={16384}
                  step={512}
                  unit=" MiB"
                  value={runtime.over.memory.mib}
                  onChange={(mib) => void saveRuntime({ mode: "fixed", mib }, runtime.over.java)}
                />
                <p className="mt-2 text-xs text-txt-dim">
                  {t("recommendedMemory", { gib: gib(runtime.effective.recommendedMib) })}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-txt-dim">
                {runtime.over.memory.mode === "auto"
                  ? t("autoMemory", { count: runtime.effective.modCount })
                  : runtime.globalMemoryAuto
                    ? t("globalMemoryAuto")
                    : t("globalMemoryMib", { gib: gib(runtime.globalMemoryMib) })}
              </p>
            )}

            <Divider label={t("javaDivider")} className="my-4" />
            <Seg
              options={[
                { value: "inherit", label: t("inherit") },
                { value: "auto", label: t("auto") },
                { value: "custom", label: t("customJavaLabel") },
              ]}
              value={runtime.over.java.mode}
              onChange={(mode) =>
                void saveRuntime(
                  runtime.over.memory,
                  mode === "custom"
                    ? { mode: "custom", path: runtime.effective.javaPath ?? "" }
                    : mode === "auto"
                      ? { mode: "auto" }
                      : { mode: "inherit" },
                )
              }
            />
            {runtime.over.java.mode === "custom" ? (
              <Field
                className="mt-3"
                label={t("customJavaLabel")}
                hint={t("customJavaHint")}
              >
                <Input
                  value={runtime.over.java.path}
                  placeholder={t("customJavaPlaceholder")}
                  onChange={(e) =>
                    void saveRuntime(runtime.over.memory, {
                      mode: "custom",
                      path: e.target.value,
                    })
                  }
                />
              </Field>
            ) : (
              <p className="mt-3 text-xs text-txt-dim">
                {runtime.over.java.mode === "auto"
                  ? t("javaAuto")
                  : runtime.globalJavaPath
                    ? t("javaGlobal", { path: runtime.globalJavaPath })
                    : t("javaManaged")}
              </p>
            )}
          </>
        )}
      </Panel>

      {error && (
        <p className="col-span-full text-sm text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
