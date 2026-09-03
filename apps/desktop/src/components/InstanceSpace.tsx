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
  Stats,
} from "@boffmedia/ui"

import {
  instanceRuntime,
  instanceRuntimeSet,
  jvmArgsCheck,
  type InstanceRuntime,
  type JavaChoice,
  type JvmArgVerdict,
  type JvmChoice,
  type MemoryChoice,
  type RuntimeSource,
} from "../runtime"
import { useT } from "../i18n"

// Per-instance Java runtime + memory settings for the Settings tab.
//
// A separate component rather than more of PackDetail: it reads the instance
// marker on the Rust side and neither belongs to the install state machine
// in state/app.tsx, which owns progress events and nothing else.
//
// Everything here goes through runtime.ts, so `dev:renderer` renders it against
// the in-process simulation and the screen stays browser-runnable.

type Props = {
  slug: string
  /** Pack password, if any — not used by RuntimePanel but kept for interface compatibility. */
  password?: string
  /** Called after runtime changes (not used here but kept for interface compatibility). */
  onChanged?: () => void
}

// "per-instance Java runtime + memory, with a sane heuristic". Three
// states, three badges: what the player picked must be readable at a glance, or
// "why is this pack using 4 GB?" becomes a support ticket.

const SOURCE_TONE: Record<RuntimeSource, "info" | "warn" | "ok"> = {
  global: "info",
  override: "warn",
  auto: "ok",
}

const gib = (mib: number) => `${(mib / 1024).toFixed(1).replace(".", ",")} GB`

/** Split the flags field the way a shell would, minus the quoting: every
 *  accepted flag is a single whitespace-free token, so anything a quote could
 *  protect is something the allowlist refuses anyway. */
const splitArgs = (text: string): string[] => text.split(/\s+/).filter(Boolean)

export function RuntimePanel({ slug, password, onChanged }: Props) {
  const t = useT("instanceSpace")
  const [runtime, setRuntime] = useState<InstanceRuntime | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The flags field is a free-text draft rather than a render of `over.jvm.args`:
  // round-tripping through split/join would eat the space the player just typed
  // between two flags.  `null` = "show whatever the server last said".
  const [jvmDraft, setJvmDraft] = useState<string | null>(null)
  const [jvmVerdicts, setJvmVerdicts] = useState<JvmArgVerdict[]>([])

  const SOURCE_LABEL: Record<RuntimeSource, string> = {
    global: t("sourceGlobal"),
    override: t("sourceOverride"),
    auto: t("sourceAuto"),
  }

  const refresh = useCallback(() => {
    void instanceRuntime(slug).then(setRuntime)
    setJvmDraft(null)
  }, [slug])

  useEffect(refresh, [refresh])

  const saveRuntime = async (memory: MemoryChoice, java: JavaChoice, jvm: JvmChoice) => {
    setError(null)
    // Optimistic, so dragging the slider does not lag a round trip behind the
    // finger. The server's answer replaces it, resolved values and all.
    setRuntime((current) => (current ? { ...current, over: { memory, java, jvm } } : current))
    try {
      setRuntime(await instanceRuntimeSet(slug, memory, java, jvm))
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("saveConfigError"))
      void instanceRuntime(slug).then(setRuntime)
    }
  }

  // Judged by Rust, on every edit, so a refused flag is marked as it is typed
  // rather than after a launch that quietly dropped it. Deliberately NOT a
  // second copy of the grammar in TS: one rule, in the place that enforces it.
  const jvmMode = runtime?.over.jvm.mode
  const jvmArgsText =
    jvmDraft ?? (runtime?.over.jvm.mode === "custom" ? runtime.over.jvm.args.join(" ") : "")
  useEffect(() => {
    if (jvmMode !== "custom") {
      setJvmVerdicts([])
      return
    }
    let live = true
    void jvmArgsCheck(splitArgs(jvmArgsText)).then((v) => {
      if (live) setJvmVerdicts(v)
    })
    return () => {
      live = false
    }
  }, [jvmArgsText, jvmMode])

  return (
    // Two columns: memory and Java are short forms that read side by side; the
    // resolved summary and the JVM flags (a long free-text field) span both.
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(26.25rem,100%),1fr))]">
      {/* What this pack will actually launch with, BEFORE the controls: that is
          the question the tab exists to answer. */}
      {runtime !== null && (
        <Panel className="col-span-full">
          <Stats
            className="w-full [&>div]:flex-1"
            items={[
              {
                n: (
                  <span>
                    {gib(runtime.effective.heapMib)}{" "}
                    <Badge
                      tone={SOURCE_TONE[runtime.effective.memorySource]}
                      className="ml-2 inline-block"
                    >
                      {SOURCE_LABEL[runtime.effective.memorySource]}
                    </Badge>
                  </span>
                ),
                l: t("memory"),
              },
              {
                n: runtime.effective.javaPath
                  ? runtime.effective.javaPath.split(/[\/\\]/).pop() ?? "Java"
                  : t("javaTileManaged"),
                l: "Java",
              },
              {
                n: gib(runtime.effective.totalRamMib),
                l: "RAM",
              },
            ]}
          />
          <p className="mt-3 text-xs text-txt-dim">
            {runtime.effective.memorySource === "auto"
              ? t("memoryAutoDetail", { count: runtime.effective.modCount })
              : runtime.effective.memorySource === "override"
                ? t("memoryOverrideDetail")
                : t("memoryGlobalDetail")}
          </p>
        </Panel>
      )}

      {runtime === null ? (
        <p className="col-span-full text-sm text-txt-muted">{t("loading")}</p>
      ) : (
        <>
          {/* Memory section */}
          <Panel title={t("memoryDivider")}>
            <p className="mb-3 text-xs text-txt-dim">
              {runtime.over.memory.mode === "auto"
                ? t("autoMemory", { count: runtime.effective.modCount })
                : runtime.over.memory.mode === "inherit"
                  ? runtime.globalMemoryAuto
                    ? t("globalMemoryAuto")
                    : t("globalMemoryMib", { gib: gib(runtime.globalMemoryMib) })
                  : t("recommendedMemory", { gib: gib(runtime.effective.recommendedMib) })}
            </p>
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
                  runtime.over.jvm,
                )
              }
            />
            {runtime.over.memory.mode === "fixed" && (
              <div className="mt-3">
                <Slider
                  label={t("memory")}
                  min={1024}
                  max={16384}
                  step={512}
                  unit=" MiB"
                  value={runtime.over.memory.mib}
                  onChange={(mib) =>
                    void saveRuntime({ mode: "fixed", mib }, runtime.over.java, runtime.over.jvm)
                  }
                />
              </div>
            )}
          </Panel>

          {/* Java section */}
          <Panel title={t("javaDivider")}>
            <p className="mb-3 text-xs text-txt-dim">
              {runtime.over.java.mode === "auto"
                ? t("javaAuto")
                : runtime.over.java.mode === "inherit"
                  ? runtime.globalJavaPath
                    ? t("javaGlobal", { path: runtime.globalJavaPath })
                    : t("javaManaged")
                  : ""}
            </p>
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
                  runtime.over.jvm,
                )
              }
            />
            {runtime.over.java.mode === "custom" && (
              <Field
                className="mt-3"
                label={t("customJavaLabel")}
                hint={t("customJavaHint")}
              >
                <Input
                  value={runtime.over.java.path}
                  placeholder={t("customJavaPlaceholder")}
                  onChange={(e) =>
                    void saveRuntime(
                      runtime.over.memory,
                      { mode: "custom", path: e.target.value },
                      runtime.over.jvm,
                    )
                  }
                />
              </Field>
            )}
          </Panel>

          {/* JVM section */}
          <Panel title={t("jvmDivider")} className="col-span-full">
            <p className="mb-3 text-xs text-txt-dim">
              {runtime.over.jvm.mode === "inherit"
                ? runtime.globalJvmArgs.length
                  ? t("jvmGlobal", { args: runtime.globalJvmArgs.join(" ") })
                  : t("jvmInheritNone")
                : ""}
            </p>
            <Seg
              options={[
                { value: "inherit", label: t("inherit") },
                { value: "custom", label: t("manual") },
              ]}
              value={runtime.over.jvm.mode}
              onChange={(mode) => {
                // Switching to "custom" starts from what is CURRENTLY in force,
                // not from empty: the player is adjusting the flags they can
                // see, and handing them a blank box would silently drop the
                // pack's own recommendation the moment they opened it.
                const args = mode === "custom" ? runtime.effective.jvmArgs : []
                setJvmDraft(mode === "custom" ? args.join(" ") : null)
                void saveRuntime(
                  runtime.over.memory,
                  runtime.over.java,
                  mode === "custom" ? { mode: "custom", args } : { mode: "inherit" },
                )
              }}
            />
            {runtime.over.jvm.mode === "custom" && (
              <Field className="mt-3" label={t("jvmCustomLabel")} hint={t("jvmCustomHint")}>
                <Input
                  value={jvmArgsText}
                  placeholder={t("jvmCustomPlaceholder")}
                  onChange={(e) => {
                    setJvmDraft(e.target.value)
                    void saveRuntime(runtime.over.memory, runtime.over.java, {
                      mode: "custom",
                      args: splitArgs(e.target.value),
                    })
                  }}
                />
              </Field>
            )}
            {/* Refusals are listed rather than silently filtered. A flag that
                vanished from the command line without a word is the failure
                mode this whole feature has to avoid. */}
            {jvmVerdicts.some((v) => !v.ok) && (
              <ul className="mt-2 flex flex-col gap-1" role="alert">
                {jvmVerdicts
                  .filter((v) => !v.ok)
                  .map((v) => (
                    <li key={v.arg} className="text-[0.6875rem] text-bad">
                      {t("jvmRejected", { arg: v.arg, reason: v.reason ?? "" })}
                    </li>
                  ))}
              </ul>
            )}
            {runtime.over.jvm.mode === "custom" && runtime.effective.jvmArgs.length === 0 && (
              <p className="mt-2 text-xs text-txt-dim">{t("jvmEmpty")}</p>
            )}
          </Panel>

          {error && (
            <p className="col-span-full text-sm text-bad" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
